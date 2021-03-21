<template>
  <div class="field-group">
    <div class="field is-inline-block">
      <label class="label is-small">Font name</label>
      <div class="control">
        <input v-model="value_.fontName" class="input is-small" type="text" placeholder="Arial">
      </div>
    </div>
    <div class="field is-inline-block">
      <label class="label is-small">Font size</label>
      <div class="control">
        <input v-model="value_.fontSize" class="input is-small" type="number" min="5" max="1000">
      </div>
    </div>
    <div class="field is-inline-block">
      <label class="label is-small">Font color</label>
      <div class="control">
        <input v-model="value_.fontColor" type="color">
      </div>
    </div>
    <div class="field is-inline-block">
      <label class="label is-small">Shadow color</label>
      <div class="control">
        <input v-model="value_.shadowColor" type="color">
      </div>
    </div>
  </div>
</template>

<script>
// note that this component mutates the value prop
export default {
  props: ['value'],
  data () {
    return {
      value_: this.value,
    }
  },
  watch: {
    value_: {
      deep: true,
      handler (val) {
        this.$emit('input', val)
      },
    },
    value: {
      deep: true,
      handler (val) {
        this.value_ = val
      },
    },
  }
}
</script>

<style>
</style>
