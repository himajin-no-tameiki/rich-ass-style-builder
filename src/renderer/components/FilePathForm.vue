<template>
  <div class="field has-addons">
    <div class="control is-expanded">
      <input
        v-model="path"
        class="input is-small"
        type="text"
      />
    </div>
    <div class="control">
      <button @click="getPath" class="button is-small">...</button>
    </div>
  </div>
</template>

<script>
export default {
  props: ['value', 'isOpenDialog', 'filters'],
  methods: {
    getPath () {
      if (this.isOpenDialog) {
        const result = this.$electron.remote.dialog.showOpenDialogSync({
          filters: this.filters,
          properties: ['openFile'],
        })

        if (result === undefined || result.length === 0) return
        this.path = result[0]
      } else {
        const result = this.$electron.remote.dialog.showSaveDialogSync({
          filters:  this.filters,
        })

        if (result === undefined || result.length === 0) return
        this.path = result
      }
    },
  },
  computed: {
    path: {
      get () {
        return this.value
      },
      set (val) {
        this.$emit('input', val)
      },
    },
  },
}
</script>

<style>
</style>
