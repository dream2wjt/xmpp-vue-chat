// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuex from 'vuex'
import FastClick from 'fastclick'
import VueRouter from 'vue-router'
import {ToastPlugin, DatetimePlugin, LoadingPlugin} from 'vux'
import App from './App'
import directives from './lib/directives'
import store from './store/'
import routes from './router/index'
import VueScroller from 'vue-scroller'

Vue.use(VueRouter)
Vue.use(Vuex)
Vue.use(store)
Vue.use(ToastPlugin)
Vue.use(DatetimePlugin)
Vue.use(LoadingPlugin)
Vue.use(VueScroller)

Object.keys(directives).forEach(key => {
  Vue.directive(key, directives[key])
})

const router = new VueRouter({
  mode: 'hash',
  routes
})

router.beforeEach((to, from, next) => {
  if (to.path === '/login' && store.state.uihChat.uiCore &&
    typeof (store.state.uihChat.uiCore.logout) === 'function') {
    store.state.uihChat.uiCore.logout()
  }
  next()
})
FastClick.attach(document.body)

Vue.config.productionTip = false

/* eslint-disable no-new */
window.vueIns = new Vue({
  store,
  router,
  render: h => h(App)
}).$mount('#app-box')
