import Vue from 'vue'
import 'bulma/css/bulma.css'
import VueElectron from 'vue-electron'

import App from './App.vue'

Vue.use(VueElectron)
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  components: { App },
  template: '<App/>',
}).$mount('#app')
