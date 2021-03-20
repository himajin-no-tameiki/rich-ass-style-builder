<template>
  <table class="table is-fullwidth">
    <thead>
      <tr>
        <th>Index</th>
        <th>Color</th>
        <th>Thickness</th>
        <th>Blur</th>
        <th>Opacity</th>
        <th>Offset X</th>
        <th>Offset Y</th>
        <th>Controls</th>
      </tr>
    </thead>
    <tbody>
      <LayerRow v-for="(layer, i) in value"
        :layer="layer" :index="value.length - i - 1" @input="updateLayer(i, $event)"
        @layer-up="moveUpLayer(i)" @layer-down="moveDownLayer(i)" @layer-delete="deleteLayer(i)" />
    </tbody>
  </table>
</template>

<script>
import LayerRow from './LayerRow'

export default {
  props: ['value'],
  components: {
    LayerRow,
  },
  methods: {
    updateLayer (index, newLayer) {
      const newLayers = this.value.slice()
      newLayers[index] = newLayer
      this.$emit('input', newLayers)
    },
    moveUpLayer (index) {
      if (index === 0) return
      const newLayers = this.value.slice()
      const [layer] = newLayers.splice(index, 1)
      newLayers.splice(index - 1, 0, layer)
      this.$emit('input', newLayers)
    },
    moveDownLayer (index) {
      if (index === this.value.length - 1) return
      const newLayers = this.value.slice()
      const [layer] = newLayers.splice(index, 1)
      newLayers.splice(index + 1, 0, layer)
      this.$emit('input', newLayers)
    },
    deleteLayer (index) {
      const newLayers = this.value.slice()
      newLayers.splice(index, 1)
      this.$emit('input', newLayers)
    },
  },
}
</script>

<style scoped>
table {
  table-layout: fixed;
}

th:nth-child(1) {
  width: 60px;
}
th:nth-child(2) {
  width: 100px;
}
th:nth-child(3) {
  width: 100px;
}
th:nth-child(4) {
  width: 100px;
}
</style>