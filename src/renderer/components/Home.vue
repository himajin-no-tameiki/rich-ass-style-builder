<template>
  <div class="container">
    <div class="field has-addons">
      <p class="control">
        <button @click="importSettings" class="button is-small">Import...</button>
      </p>
      <p class="control">
        <button @click="exportSettings" class="button is-small">Export...</button>
      </p>
    </div>
    <div class="field">
      <label class="label is-small">MPV</label>
      <file-path-form v-model="mpvPath" :isOpenDialog="true" :filters="filters.mpv" label="Path to MPV" />
    </div>
    <div class="field">
      <button @click="addLayer" class="button is-small">Add Layer</button>
      <button @click="showPreview" class="button is-small">Show Preview on MPV player</button>
    </div>
    <layer-table v-model="layers" />
    <div class="field">
      <label class="label is-small">Input File</label>
      <file-path-form v-model="srcFile" :isOpenDialog="true" :filters="filters.ass" label="Source File" />
    </div>
    <div class="field">
      <label class="label is-small">Output File</label>
      <file-path-form v-model="outFile" :isOpenDialog="false" :filters="filters.ass" label="Output File" />
    </div>
    <div class="field">
      <button @click="applyLayers" :disabled="processing" class="button is-info">Apply Layers</button>
    </div>
    <div class="content">
      <details>
        <summary>What does this program do?</summary>
        <p>
          This program helps you create a complex style for .ass subtitles.
          What's great about the ASS format is you can put subtitles on different layers,
          which this app abuses to create a multi-layer, rich style.
        </p>
        <p>
          Every layer in the above table adds an outline, and higher index layers are placed
          <b>above</b> lower index ones. You can for example add a black layer at the bottom,
          add some blur and increase Offset Y a bit, to make a nice, realistic drop shadow.
          Or you can add a blurred layer with a light color at the bottom to make it glow.
        </p>
        <p>
          You can hit the "Show Preview" button to show an preview of your style in MPV player, 
          and it updates automatically as you tweak the layer options. If you don't have MPV
          installed, you can get it from <a href="https://mpv.io/installation/" target="_blank">here</a>.
        </p>
        <p>
          If you disable the color of a layer by unticking the checkbox, the <b>shadow color</b>
          of the style of each line will be used. You can abuse this to make the color style-dependent
          (by setting different shadow colors Aegisub).
        </p>
        <p>
          When you're done tweaking, you can apply the style on an existing ASS file, by first
          selecting input and output files, and then hitting "Apply Layers" button. This will duplicate
          each line in the source file into as many layers as you specified, into the output file. This
          means you should do this only after you're done inputting all lines in Aegisub (or
          whatever subtitle software) and ready to burn them in into a video.
        </p>
      </details>
    </div>
  </div>
</template>

<script>
import LayerTable from './LayerTable.vue'
import FilePathForm from './FilePathForm.vue'
import { openPreviewInMPV, previewStyleOnMpv, transformAssFile } from '../ass'
import { debounce, randomColor, createReadStreamSafe, createWriteStreamSafe } from '../utils'
import fs from 'fs'

export default {
  components: {
    LayerTable,
    FilePathForm,
  },
  data () {
    return {
      mpv: null,
      srcFile: '',
      outFile: '',
      mpvPath: '',
      processing: false,
      lastId: 0,
      layers: [
        {
          id: 0,
          color: '#FF0000',
          thickness: 5,
          blur: 0,
          opacity: 255,
          offsetX: 0,
          offsetY: 0,
        },
      ],
      defaultLayerValues: {
        color: '#FF0000',
        thickness: 5,
        blur: 0,
        opacity: 255,
        offsetX: 0,
        offsetY: 0,
      },
      filters: {
        mpv: [
          {
            name: 'MPV Player',
            extensions: ['exe'],
          }
        ],
        ass: [
          {
            name: 'Advanced SubStation Alpha',
            extensions: ['ass', 'ssa'],
          },
        ],
        config: [
          {
            name: 'Config File',
            extensions: ['json'],
          },
        ],
      }
    }
  },
  computed: {
    mpvIsOpened () {
      return this.mpv !== null && this.mpv.exitCode === null
    },
  },
  methods: {
    addLayer () {
      this.lastId += 1
      const newLayer = {
        ...this.defaultLayerValues,
        color: randomColor(),
        id: this.lastId,
      }
      this.layers.push(newLayer)
    },
    async showPreview () {
      if (this.mpvIsOpened) return
      if (!this.mpvPath) {
        this.$electron.remote.dialog.showMessageBoxSync({
          type: 'error',
          message: 'You need to specify a path to MPV',
        })

        return
      }

      try {
        this.mpv = await openPreviewInMPV(this.layers, this.mpvPath)
        this.mpv.on('error', (err) => this.$electron.remote.dialog.showMessageBoxSync({
          type: 'error',
          message: 'Cannot launch MPV',
          detail: err.toString(),
        }))
      } catch (err) {
        this.$electron.remote.dialog.showMessageBoxSync({
          type: 'error',
          message: 'Failed to open MPV',
          detail: err.toString(),
        })
      }
    },
    async updatePreview () {
      await previewStyleOnMpv(this.layers)
    },
    async applyLayers () {
      this.processing = true
      let src, target

      try {
        src = await createReadStreamSafe(this.srcFile)
        target = await createWriteStreamSafe(this.outFile)
        await transformAssFile(src, target, this.layers)
        this.$electron.remote.dialog.showMessageBoxSync({
          type: 'info',
          message: 'Finished processing files',
        })
      } catch (err) {
        this.$electron.remote.dialog.showMessageBoxSync({
          type: 'error',
          message: 'Failed to process the ass file',
          detail: err.toString(),
        })
      } finally {
        try {
          if (src) src.destroy()
        } catch (e) { console.error(e) }
        try {
          if (target) target.end()
        } catch (e) { console.error(e) }
        this.processing = false
      }
    },
    async importSettings () {
      const result = this.$electron.remote.dialog.showOpenDialogSync({
        filters: this.filters.config,
        properties: ['openFile']
      })
      if (result === undefined || result.length === 0) return

      const filename = result[0]
      try {
        const contentJSON = await fs.promises.readFile(filename, { encoding: 'utf8' })
        const { layers, lastId, mpvPath } = JSON.parse(contentJSON)
        this.layers = layers
        this.lastId = lastId
        this.mpvPath = mpvPath
      } catch (err) {
        this.$electron.remote.dialog.showMessageBoxSync({
          type: 'error',
          message: 'Failed to import config',
          detail: err.toString(),
        })
      }
    },
    async exportSettings () {
      const content = {
        layers: this.layers,
        lastId: this.lastId,
        mpvPath: this.mpvPath,
      }

      const filename = this.$electron.remote.dialog.showSaveDialogSync({
        filters: this.filters.config,
      })
      if (filename === undefined) return

      try {
        await fs.promises.writeFile(filename, JSON.stringify(content, null, '\t'))
      } catch (err) {
        this.$electron.remote.dialog.showMessageBoxSync({
          type: 'error',
          message: 'Failed to export config',
          detail: err.toString(),
        })
      }
    },
  },
  watch: {
    layers: {
      deep: true,
      handler: debounce(500, function () {
        if (this.mpvIsOpened) {
          console.log('updating layers')
          this.updatePreview()
        }
      }),
    },
  },
}
</script>

<style>

</style>