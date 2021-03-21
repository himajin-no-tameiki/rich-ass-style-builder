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
    <p class="title is-6 is-spaced">Preview Style (this won't affect the final result)</p>
    <preview-style-form v-model="previewStyle" />
    <p class="title is-6 is-spaced">Apply</p>
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
    <description />
  </div>
</template>

<script>
import LayerTable from './LayerTable.vue'
import FilePathForm from './FilePathForm.vue'
import PreviewStyleForm from './PreviewStyleForm.vue'
import Description from './Description.vue'
import { openPreviewInMPV, previewStyleOnMpv, transformAssFile } from '../ass'
import { debounce, randomColor, createReadStreamSafe, createWriteStreamSafe } from '../utils'
import fs from 'fs'

export default {
  components: {
    LayerTable,
    FilePathForm,
    PreviewStyleForm,
    Description,
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
      previewStyle: {
        fontName: 'Arial',
        fontSize: 100,
        fontColor: '#6666FF',
        shadowColor: '#6666FF',
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
        this.mpv = await openPreviewInMPV(this.layers, this.previewStyle, this.mpvPath)
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
    updatePreviewIfOpen: debounce(500, function () {
      if (this.mpvIsOpened) {
        console.log('updating layers')
        this.updatePreview()
      }
    }),
    async updatePreview () {
      await previewStyleOnMpv(this.layers, this.previewStyle)
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
        const { layers, lastId, mpvPath, previewStyle } = JSON.parse(contentJSON)
        this.layers = layers
        this.lastId = lastId
        this.mpvPath = mpvPath
        this.previewStyle = previewStyle
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
        previewStyle: this.previewStyle,
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
      handler() {
        this.updatePreviewIfOpen()
      },
    },
    previewStyle: {
      deep: true,
      handler() {
        this.updatePreviewIfOpen()
      },
    },
  },
}
</script>

<style>

</style>