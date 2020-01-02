/**
 * Create by jingtian.wang on 2018/8/14.
 */
import UICore from './src/service/UIInterfaceCore'
import uihChat from './src/store/storeCore'
import ConversationMix from './src/pages/Mobile/ConversationMix'
import ConversationPanel from './src/pages/Mobile/ConversationPanel'
import ConversationWindow from './src/pages/Mobile/ConversationWindow'

const plugin = {
  // pluginOptions = {
  //      store,
  //      xmppDomain,
  //      boshUrl
  // }
  install (vue, pluginOptions = {}) {

    // initial UI Interface module and create strophe connection
    let uiCore = new UICore(pluginOptions)

    // register vuex module
    let Store = pluginOptions.store

    // add login interface for new vue instance
    // log in user info
    // lgInfo = {
    //   id:
    //   password:
    //   name:
    //   avatar:
    // }
    vue.prototype.$loginChat = function (lgInfo, callback) {
      if (typeof pluginOptions !== 'object' || !pluginOptions.xmppDomain || !pluginOptions.boshUrl) {
        callback({state: 'error', content: 'param error!'})
      }

      // let resource = pluginOptions.resource ? '/' + pluginOptions.resource : '/uihM'
      let domain = pluginOptions.xmppDomain
      let userJid

      if (lgInfo.id.match(/@(.*)$/)) {
        userJid = lgInfo.id.toLowerCase()
      } else {
        userJid = lgInfo.id.toLowerCase() + '@' + domain
      }

      lgInfo.jid = userJid
      uiCore.login({jid: userJid, pass: lgInfo.password}, (response) => {
        if (response.state !== 'success') {
          callback(response)
          return
        }
        // get contact list
        uiCore.getContacts((contacts) => {
          Store.commit('uihChat/updateContacts', contacts)
        })
        // send presence
        uiCore.sendPresence('online')
        callback(response)
      })
      // get address book list
      uiCore.getAddressBook({id: lgInfo.id, name: lgInfo.name}, (addressBooks) => {
        Store.commit('uihChat/updateAddressBooks', addressBooks)
        // todo..
      })
      Store.commit('uihChat/updateCurUser', lgInfo)
    }

    // add logout interface for new vue instance
    vue.prototype.$logout = function () {
      uiCore.logout()
      localStorage.removeItem('uihChatShowWindow')
    }

    // register chat message handle
    uiCore.addMessageListener((message) => {
      Store.commit('uihChat/addMessage', message)
    }, (message) => {
      Store.commit('uihChat/loadMessage', message)
    })
    // register contact handle
    uiCore.addContactListener((message) => {
      Store.commit('uihChat/updateContact', message)
    }, (message) => {
      Store.commit('uihChat/deleteContact', message)
    })

    Store.commit('uihChat/updatePlatform', 'mobile')
    Store.state.uihChat.uiCore = uiCore
  }
}

export default plugin
export const install = plugin.install
export {
  uihChat,
  ConversationMix,
  ConversationPanel,
  ConversationWindow
}

