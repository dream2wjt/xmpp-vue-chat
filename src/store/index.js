/**
 * Create by jingtian.wang on 2018/8/14.
 */
import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import uihChat from './storeCore'
import deepCopy from 'deep-copy'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    uihChat
  },
  plugins: [createPersistedState({
    getState: (key, storage, value) => {
      value = storage.getItem(key)
      if (!value || typeof value === 'undefined') {
        return undefined
      }

      let state = JSON.parse(value)
      if (!state.uihChat) { return state }

      state.uihChat.contacts.map((item) => {
        if (!item.hasOwnProperty('msgs')) {
          item.msgs = []
        }
      })

      if (state.uihChat.chattingUser) {
        if (!state.uihChat.chattingUser.hasOwnProperty('msgs')) {
          state.uihChat.chattingUser.msgs = []
        }
      }
      return state
    },
    reducer: (state, paths) => {
      let saveState = deepCopy(state)
      if (!saveState.uihChat) {
        return state
      }

      // saveState.uihChat.contacts.map((item) => {
      //   if (item.hasOwnProperty('msgs')) {
      //     delete item.msgs
      //   }
      // })
      //
      // if (saveState.uihChat.chattingUser) {
      //   if (saveState.uihChat.chattingUser.hasOwnProperty('msgs')) {
      //     delete saveState.uihChat.chattingUser.msgs
      //   }
      // }
      return saveState
    }
  })]
})
