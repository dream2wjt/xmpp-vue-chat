/**
 * Create by jingtian.wang on 2018/7/17.
 */
import Vue from 'vue'
import {MSG_TYPES, isWechat, getIdFromJid, getBareJid, Contact} from '../../service/const'

const isEmpty = (str) => {
  return str === null || str === undefined ? true : /^[\s\xa0]*$/.test(str)
}

// 保存的最大查询记录数
const MAX_RECORD_NUM = 10

// 微信上文件转换需要的参数
const IMG_SUFFIX = ['bmp', 'jpg', 'jpeg', 'png', 'tif', 'gif', 'pcx', 'tga', 'exif', 'fpx', 'svg', 'psd', 'cdr', 'pcd', 'dxf', 'ufo', 'eps', 'ai', 'raw', 'WMF', 'webp']
const VOC_SUFFIX = ['cda', 'wav', 'mp3', 'wma', 'asf', 'ra', 'mid', 'ogg', 'ape', 'flac', 'au']
const VOC_IMG = require('../../assets/voice.svg')

/**
 *  根据jid找列表contact
 * @param state {vuex}
 * @param jid
 * @returns {*}
 */
function getContactByJid (state, jid) {
  try {
    let user = state.contacts.find((item) => {
      return getBareJid(jid).toLowerCase() === getBareJid(item.jid).toLowerCase()
    })
    return user
  } catch (e) {
    return null
  }
}

/**
 *  根据jid找列表contact
 * @param state {vuex}
 * @param jid
 * @returns {*}
 */
function createUnkownSender (state, jid) {
  let pro = (resovle, reject) => {
    let sender = new Contact({jid: jid})

    state.uiCore.queryAddressBook(sender.jid.split('@')[0], (user) => {
      for (let p in user) {
        if (sender.hasOwnProperty(p)) { sender[p] = user[p] }
      }
      // 加到本地好友列表
      state.contacts.splice(1, 0, sender)
      // 加到服务器好友列表
      state.uiCore.addContact(sender.jid, sender.name)

      resovle(sender)
    }, (error) => {
      console.log('uihChat queryAddressBook fail-- ', error)
      reject('uihChat queryAddressBook fail-- ', error)
    })
  }

  return new Promise(pro)
}

function parseMsgContent (content) {
  if (content.substr(content.length - 30).match(/alt.?=.+图片/)) {
    return '[图片]'
  } else {
    let tempMsg = content.replace(/img src=.+?emoji/g, '')
    let tempContent, _content
    if (tempMsg.indexOf('<') >= 0) {
      tempContent = /<" alt=".+?">/.exec(tempMsg)
      while (tempContent) {
        _content = tempContent[0].replace(/<" alt="/, '[').replace('">', ']')
        tempMsg = tempMsg.replace(tempContent[0], _content)
        tempContent = /<" alt=".+?">/.exec(tempMsg)
      }
    } else {
      tempContent = /&lt;&quot; alt=&quot;.+?&quot;&gt;/.exec(tempMsg)
      while (tempContent) {
        _content = tempContent[0].replace(/&lt;&quot; alt=&quot;/, '[').replace('&quot;&gt;', ']')
        tempMsg = tempMsg.replace(tempContent[0], _content)
        tempContent = /&lt;&quot; alt=&quot;.+?&quot;&gt;/.exec(tempMsg)
      }
    }
    return tempMsg
  }
}
function msgTransfer (message) {
  if (!isWechat) return
  if (message.msgType !== MSG_TYPES.FILE_TYPE) return
  if (!message.content.includes('img')) return
  let msg = message.content.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  let slot = msg.match(/<img.+<\/a>/)[0]
  let src = slot.match(/href=".+?"/)[0].replace('href=', '').replace(/"/g, '')
  let suffix = src.split('.').pop()
  let name = src.split('/').pop()
  let rep
  if (IMG_SUFFIX.includes(suffix)) {
    rep = `<img src="" data-src="${src}" alt="图片文件"/><span>${name}</span>`
  } else if (VOC_SUFFIX.includes(suffix)) {
    let suc = `let time = parseInt(this.duration);this.parentNode.style.width=time+'0px';this.nextSibling.innerHTML = time+'″';`
    let rem = `this.removeAttribute('onloadeddata');this.removeAttribute('onerror');`
    rep = `<div class="voc-file"><div class="voc-bar"><img src="${VOC_IMG}"></div><audio src="${src}" onloadeddata="${suc + rem}" onerror="${rem}"></audio><span></span></div>`
  } else {
    rep = `<p>微信端暂不支持此类格式文件下载，请复制以下链接并用浏览器打开</p><p style="text-decoration: underline">${src}</p>`
  }
  message.content = msg.replace(msg, rep)
}
export default {
  updatePlatform (state, payload) {
    state.platform = payload
  },
  updateCurUser (state, payload) {
    state.curUser = payload
  },
  updateChattingUser (state, payload) {
    if (typeof payload === 'object') {
      state.chattingUser = payload
    } else {
      state.chattingUser = getContactByJid(state, payload)
    }

    if (state.chattingUser !== null) {
      state.chattingUser.lastArchivedUid = ''
      state.chattingUser.archiveExhausted = false
      state.chattingUser.msgPrompt = 0 // 清除未读消息
    }
  },
  updateUiCore (state, payload) {
    state.uiCore = payload
  },
  updateAddressBooks (state, payload) {
    state.addressBooks = payload
  },
  updateContacts (state, payload) {
    let sysContact = new Contact({
      id: 'chatadmin',
      jid: 'chatadmin@' + window.xmppdomain,
      name: '系统消息',
      avatar: state.platform === 'pc' ? require('../../assets/systemP.png') : require('../../assets/systemM.png'),
      msgs: []
    })
    payload.unshift(sysContact)

    // 切换账号，清除旧帐号缓存
    if (!state.lastUser ||
      getBareJid(state.curUser.jid) !==
      getBareJid(state.lastUser.jid)) {
      state.lastUser = state.curUser
      state.contacts = payload
    }
  },
  // add or update one contact
  updateContact (state, payload) {
    let contact = getContactByJid(state, payload.jid)
    if (contact) {
      Object.assign(contact, payload)
    } else {
      contact = new Contact(payload)
      // 存在系统消息模块，默认插到系统消息后
      state.contacts.splice(1, 0, contact)
      // 先更新列表再补充联系人与业务相关消息，避免列表延时显示
      state.uiCore.queryAddressBook(getIdFromJid(contact.jid), (user) => {
        for (let p in user) {
          if (contact.hasOwnProperty(p)) { contact[p] = user[p] }
        }
      })
    }
  },
  // remove a contact
  deleteContact (state, payload) {
    let contact = getContactByJid(state, payload.jid)
    if (contact) {
      state.contacts.splice(state.contacts.indexOf(payload), 1)
    }
  },
  addMessage (state, message) {
    // 及时消息是以对象传递，历史消息通过数组方式传递
    if (Array.isArray(message)) { return }
    msgTransfer(message)
    let processMessage = function (state, tagUser, message) {
      tagUser.msgs.push(message)

      if (!state.chattingUser ||
        (getBareJid(state.chattingUser.jid) !== getBareJid(message.from) &&
          getBareJid(message.from) !== getBareJid(state.curUser.jid))) {
        tagUser.msgPrompt++
      }
      tagUser.lastMsg = parseMsgContent(message.content)
      tagUser.msgTime = message.time
    }

    let tagUser
    // carbon 协议，区别消息来自好友还是来自己方的其他设备
    if (getBareJid(message.from) === getBareJid(state.curUser.jid)) {
      tagUser = getContactByJid(state, message.to)
    } else {
      tagUser = getContactByJid(state, message.from)
    }

    if (!tagUser) {
      // 创建未知联系人
      createUnkownSender(state, message.from).then(user => {
        processMessage(state, user, message)
      })
    } else {
      // 新消息用户至顶
      state.contacts.splice(state.contacts.indexOf(tagUser), 1)
      getIdFromJid(tagUser.jid) !== 'chatadmin' ? state.contacts.splice(1, 0, tagUser) : state.contacts.unshift(tagUser)
      processMessage(state, tagUser, message)
    }
  },
  loadMessage (state, historyMsgs) {
    // 加载历史消息
    if (!Array.isArray(historyMsgs) || historyMsgs.length === 0) { return }
    // 防止history中有重复数据
    let _msgTime
    let len = historyMsgs.length
    for (let i = 0; i < len; i++) {
      msgTransfer(historyMsgs[i])
      if (_msgTime === historyMsgs[i].time) {
        historyMsgs.splice(i--, 1)
        len--
        continue
      }
      _msgTime = historyMsgs[i].time
    }
    // 防止最后一条历史数据重复
    if (state.chattingUser.msgs[0] && state.chattingUser.msgs[0].time === _msgTime) {
      historyMsgs.splice(--len, 1)
      if (!len) return
    }
    state.chattingUser.msgs = historyMsgs.concat(state.chattingUser.msgs)
    state.chattingUser.lastMsg = parseMsgContent(historyMsgs[len - 1].content)
    state.chattingUser.msgTime = historyMsgs[historyMsgs.length - 1].time
  },
  clearMessage (state, jid) {
    let tagUser = getContactByJid(state, jid)
    if (tagUser) tagUser.msgs = tagUser.msgs.slice(-10)
  },
  // search component
  addSearchHistory (state, payload) {
    let id = payload.userRefid
    let record = payload.record
    let type = payload.type

    if (!id || isEmpty(record) || !type) {
      return
    }

    let history = state.searchHistoryMap[payload.type]
    if (history === undefined) {
      history = {}
      history[id] = new Array(record)
      Vue.set(state.searchHistoryMap, type, history)
    } else if (history[id] === undefined) {
      Vue.set(history, id, new Array(record))
    } else {
      let arr = history[id]
      let duplicatedIndex = arr.findIndex(r => r === record)
      if (duplicatedIndex !== -1) {
        arr.splice(duplicatedIndex, 1)
      }

      arr.unshift(record)

      if (arr.length > MAX_RECORD_NUM) {
        arr.pop()
      }
    }
  },
  clearSearchHistory (state, payload) {
    let id = payload.userRefid
    let type = payload.type

    if (!id || !type) {
      return
    }

    state.searchHistoryMap[type][id] = []
  }
}
