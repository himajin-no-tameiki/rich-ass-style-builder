<template>
  <div class="container">
    <div class="content">
      <p>
        If you disable the color of a layer, the <b>shadow color</b> of the style of
        each line will be used. You can abuse this to make the color style-dependent.
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
        ]
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