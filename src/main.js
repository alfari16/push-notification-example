import Vue from 'vue'
import App from './App'

import registerServiceWorker from './registerServiceWorker'
if (!location.href.includes('localhost')) registerServiceWorker()

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  render: h => h(App)
})
