/**
 * Create by jingtian.wang on 2018/09/03.
 */

import PubSub from 'pubsub-js'
import {getBareJid, PubSubTopic} from './const'

// 向组件外发送通知事件
export const PubEvent = {
  publishChatMessage (data) {
    PubSub.publish(PubSubTopic.MESSAGE_CHAT, data)
  },
  publishSystemMessage (data) {
    PubSub.publish(PubSubTopic.MESSAGE_SYS, data)
  },
  publishErrorMessage (data) {
    PubSub.publish(PubSubTopic.MESSAGE_ERROR, data)
  },
  publishStatePresence (data) {
    PubSub.publish(PubSubTopic.PRESENCE_STATE, data)
  },
  publishInvitePresence (data) {
    PubSub.publish(PubSubTopic.PRESENCE_INVITE, data)
  },
  publishConnectionStatus (data) {
    PubSub.publish(PubSubTopic.CONNECTION_DISCONNECT, data)
  },
  publishOperateUserChoose (data) {
    PubSub.publish(PubSubTopic.OPERATE_USER_CHOOSE, data)
  },
  publishOperateResponseState (data) {
    PubSub.publish(PubSubTopic.OPERATE_RESPONSE_STATE, data)
  }
}

// 监听组件外事件，此处监听接口仅适用Body及iframe集成方式
// 监听登录事件
// data {
//    id,
//    pass,
//    name,
//    avatar
// }
PubSub.subscribe(PubSubTopic.OPERATE_LOGIN, (msg, data) => {
  if (msg !== PubSubTopic.OPERATE_LOGIN || !data) {
    let reply = {
      handle: PubSubTopic.OPERATE_LOGIN,
      content: {
        state: 'fail',
        content: 'invalid login param'
      }
    }
    PubEvent.publishOperateResponseState(reply)
    console.log('subLogin--', 'invalid login param')
    return
  }

  let store = window.vueIns.$store
  let router = window.vueIns.$router
  let uiCore = store.state.uihChat.uiCore

  let jid = data.id.toLowerCase()
  if (!jid.match(/@(.*)$/)) {
    jid = jid + '@' + window.xmppdomain
  }
  // log in user info
  let lgInfo = {
    jid: jid,
    pass: data.pass,
    name: data.name,
    avatar: data.avatar
  }
  uiCore.login({jid: jid, pass: data.pass}, (response) => {
    PubEvent.publishOperateResponseState({handle: PubSubTopic.OPERATE_LOGIN, content: response})
    console.log('login--', response.content)

    if (response.state !== 'success') {
      return
    }

    // get contact list
    uiCore.getContacts((contacts) => {
      store.commit('uihChat/updateContacts', contacts)
      store.state.uihChat.platform === 'pc' ? router.push('/chatwin') : router.push('/chatpanel')
    })
    // send presence
    uiCore.sendPresence('online')
  })
  // get address book list
  uiCore.getAddressBook({id: data.id, name: data.name}, (addressBooks) => {
    store.commit('uihChat/updateAddressBooks', addressBooks)
  })
  store.commit('uihChat/updateCurUser', lgInfo)
})

// 监听登出事件
PubSub.subscribe(PubSubTopic.OPERATE_LOGOUT, (msg, data) => {
  if (msg !== PubSubTopic.OPERATE_LOGOUT) {
    let reply = {
      handle: PubSubTopic.OPERATE_LOGOUT,
      content: {
        state: 'fail',
        content: 'logout param error'
      }
    }
    PubEvent.publishOperateResponseState(reply)
    console.log('subLogout--', 'logout param error')
    return
  }

  let uiCore = window.vueIns.$store.state.uihChat.uiCore
  uiCore.logout()
})

// 监听给指定联系人发送消息事件
// data {
//    id,
//    name
// }
PubSub.subscribe(PubSubTopic.OPERATE_SEND_MESSAGE, (msg, data) => {
  if (msg !== PubSubTopic.OPERATE_SEND_MESSAGE || !data) {
    let reply = {
      handle: PubSubTopic.OPERATE_SEND_MESSAGE,
      content: {
        state: 'fail',
        content: 'subSendMessage param error'
      }
    }
    PubEvent.publishOperateResponseState(reply)
    console.log('subSendMessage--', 'subSendMessage param error')
    return
  }

  let store = window.vueIns.$store
  let contacts = store.state.uihChat.contacts
  let uiCore = store.state.uihChat.uiCore
  let bid = data.id

  if (!bid.match(/@(.*)$/)) {
    bid = bid + '@' + window.xmppdomain
  }
  let contact = contacts.find((item) => {
    return getBareJid(item.jid) === bid
  })
  // add to contact
  if (!contact) {
    // add to local first, second to server
    store.commit('uihChat/updateContact', {jid: bid, name: data.name})
    uiCore.addContact(bid, data.name)
  }
  // show the chat window
  document.getElementById('app').setAttribute('style', 'display: -webkit-box')
  // route to contact list
  window.vueIns.$emit('headerChange', '1')
  // choose contact
  window.vueIns.$emit('contactChoose', bid)
})
