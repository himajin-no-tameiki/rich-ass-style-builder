<template>
  <div class="container">
    <div class="content">
      <p>
        If you disable the color of a layer, the <b>shadow color</b> of the style of
        each line will be used. You can abuse this to make the color style-dependent.
      </p>
    </div>
    <div class="field">
      <button @click="addLayer" class="button is-small">Add Layer</button>
      <button @click="showPreview" class="button is-small">Show Preview on MPV player</button>
    </div>
    <layer-table v-model="layers" />
    <file-path-form v-model="srcFile" :isOpenDialog="true" label="Source File" />
    <file-path-form v-model="outFile" :isOpenDialog="false" label="Output File" />
    <div class="field">
      <button @click="applyLayers" :disabled="processing" class="button is-info">Apply Layers</button>
    </div>
  </div>
</template>

<script>
import LayerTable from './LayerTable.vue'
import FilePathForm from './FilePathForm.vue'
import { openMpvWindow, previewStyleOnMpv, transformAssFile } from '../ass'
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
      processing: false,
      layers: [
        {
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
    }
  },
  computed: {
    mpvIsOpened () {
      return this.mpv !== null && this.mpv.exitCode === null
    },
  },
  methods: {
    addLayer () {
      const newLayer = {
        ...this.defaultLayerValues,
        color: randomColor(),
      }
      this.layers.push(newLayer)
    },
    async showPreview () {
      if (!this.mpvIsOpened) this.mpv = openMpvWindow()
      await previewStyleOnMpv(this.layers)
    },
    async applyLayers () {
      this.processing = true
      let src, target

      try {
        src = await createReadStreamSafe(this.srcFile)
        target = await createWriteStreamSafe(this.outFile)
        await transformAssFile(src, target, this.layers)
      } catch (err) {
        alert('Failed to process the ass file: ' + err)
        console.error(err)
      } finally {
        try {
          if (src) src.destroy()
        } catch (e) { console.error(e) }
        try {
          if (target) target.end()
        } catch (e) { console.error(e) }
        this.processing = false
        alert('Finished processing files')
      }
    },
  },
  watch: {
    layers: {
      deep: true,
      handler: debounce(500, function () {
        if (this.mpvIsOpened) {
          this.showPreview()
        }
      }),
    },
  },
}
</script>

<style>

</style>