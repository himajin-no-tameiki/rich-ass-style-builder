<template>
  <tr>
    <td>{{index}}</td>
    <td>
      <input type="checkbox" v-model="isColorEnabled">
      <input type="color" v-model="selectedColor" :disabled="!isColorEnabled">
    </td>
    <td><input type="number" v-model.number="layer_.thickness" min="0" max="1000" class="input"></td>
    <td><input type="number" v-model.number="layer_.blur" min="0" max="1000" class="input"></td>
    <td>{{layer_.opacity}}<input type="range" v-model.number="layer_.opacity" min="0" max="255"></td>
    <td>{{layer_.offsetX}}<input type="range" v-model.number="layer_.offsetX" @dblclick="layer_.offsetX = 0" min="-50" max="50"></td>
    <td>{{layer_.offsetY}}<input type="range" v-model.number="layer_.offsetY" @dblclick="layer_.offsetY = 0" min="-50" max="50"></td>
    <td>
      <button @click="$emit('layer-up')" class="button is-small">Up</button>
      <button @click="$emit('layer-down')" class="button is-small">Down</button>
      <button @click="$emit('layer-delete')" class="button is-small is-danger">Delete</button>
    </td>
  </tr>
</template>

<script>
export default {
  props: ['layer', 'index'],
  data () {
    return {
      layer_: this.layer,
    }
  },
  computed: {
    selectedColor: {
      get () {
        return this.layer_.color || '#CCCCCC'
      },
      set (val) {
        if (this.layer_.color !== null) {
          this.layer_.color = val
        }
      },
    },
    isColorEnabled: {
      get () {
        return this.layer_.color !== null
      },
      set (val) {
        if (!val) {
          this.layer_.color = null
        } else {
          this.layer_.color = '#CCCCCC'
        }
      },
    },
  },
  watch: {
    layer_ (val) {
      this.$emit('input', val)
    },
    layer (val) {
      this.layer_ = val
    },
  },
}
</script>

<style scoped>
input[type="range"] {
  width: 100%;
}

tr:focus {
  outline: none;
  background: #93cae0;
}
</style>
