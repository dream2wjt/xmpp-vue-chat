/**
 * Created by jingtian.wang on 2018/8/14.
 *
 */
import {Strophe, $pres, $msg, $iq, b64_sha1} from 'strophe.js' // eslint-disable-line
import 'strophejs-plugin-disco'
import 'strophejs-plugin-caps'
import 'strophejs-plugin-rsm'
import 'strophejs-plugin-mam'
import ImageCompressor from 'image-compressor.js'
import {UploadFile2ThirdSystem, GetThirdSystemUsers, QueryThirdSystemUsers, Put} from './RestApi'
import {PubEvent} from './eventEngine'
import {MSG_TYPES, Message, Contact} from './const'

window.b64_sha1 = b64_sha1 // eslint-disable-line
/**
 * Set some options for the chat.
 *
 * @namespace uihChatOpts
 */
let uihChatOpts = {

  /** name of container application */
  app_name: 'web applications',

  /** xmpp options */
  xmpp: {
    /** BOSH url */
    url: null,

    /** XMPP JID */
    jid: null,

    /** XMPP domain */
    domain: null,

    /** XMPP password */
    password: null,

    /** XMPP connection */
    connection: null,

    /** session id */
    sid: null,

    /** request id */
    rid: null,

    /** present state */
    state: '',

    /** entity features */
    features: [],

    /** entity features */
    carbons: {
      enabled: false,
      ns: 'urn:xmpp:carbons:2'
    }
  },
  /**
   * Options for Message Archive Management (XEP-0313)
   */
  mam: {
    enable: true,
    max: 10
  },
  /** default xmpp priorities */
  priority: {
    online: 0,
    chat: 0,
    away: 0,
    xa: 0,
    dnd: 0
  },
  /** upload image */
  img: {
    maxSize: 5 * 1024 * 1024, // 5M
    bUploadRaw: false
  }
}

function log (msg, content) {
  if (!window.isDebug) {
    return
  }
  console.log(msg, content)
}

/**
 * UI核心接口类
 * @param options
 * @constructor
 */
function UICore (options) {
  this.onServerResonse = null
  this.onChatListener = []
  this.onContactListener = []

  this._init(options)
  return this
}

/**
 * 连接成功后初始化
 *
 * @private
 */
UICore.prototype._init = function (options) {
  uihChatOpts.xmpp.connection = new Strophe.Connection(options.boshUrl)

  uihChatOpts.xmpp.connection.rawInput = this.rawInput
  uihChatOpts.xmpp.connection.rawOutput = this.rawOutput
  uihChatOpts.xmpp.connection.nextValidRid = this._onRidChange

  uihChatOpts.xmpp.url = options.boshUrl
  uihChatOpts.xmpp.domain = options.xmppDomain
  uihChatOpts.xmpp.jid = localStorage.getItem('uihChatJid')
  uihChatOpts.xmpp.sid = localStorage.getItem('uihChatSid')
  uihChatOpts.xmpp.rid = localStorage.getItem('uihChatRid')
  uihChatOpts.xmpp.features = localStorage.getItem('features') || []

  if (uihChatOpts.xmpp.sid && uihChatOpts.xmpp.rid) {
    uihChatOpts.xmpp.connection.attach(uihChatOpts.xmpp.jid, uihChatOpts.xmpp.sid, uihChatOpts.xmpp.rid, this._serverCallBack.bind(this))
  }

  let caps = uihChatOpts.xmpp.connection.caps
  if (caps) {
    caps.node = 'https://www.united-imaging.com/cn/home/'
  }
}

/**
 * 启用carbons
 *
 * @private
 */
UICore.prototype._enableCarbons = function () {
  // get server feature
  if (uihChatOpts.xmpp.features.length === 0) {
    uihChatOpts.xmpp.connection.flush()

    let barJid = Strophe.getDomainFromJid(uihChatOpts.xmpp.jid)
    uihChatOpts.xmpp.connection.disco.info(barJid, undefined, (stanza) => {
      let queryEle = stanza.getElementsByTagName('query')
      Strophe.forEachChild(queryEle[0], 'feature', (item) => {
        uihChatOpts.xmpp.features.push(item.getAttribute('var'))
      })

      // enable carbons
      let features = uihChatOpts.xmpp.features
      localStorage.setItem('features', uihChatOpts.xmpp.features)

      if (features.length > 0 && features.indexOf(uihChatOpts.xmpp.carbons.ns) >= 0) {
        let iq = $iq({
          type: 'set'
        }).c('enable', {
          xmlns: uihChatOpts.xmpp.carbons.ns
        })
        uihChatOpts.xmpp.connection.sendIQ(iq, () => {
          uihChatOpts.xmpp.carbons.enabled = true
        }, (stanza) => {
          log('enableCarbons--', stanza)
        })
      }
    }, (error) => {
      log('enableCarbons--', error)
    })
  }
}

/**
 * 服务器回调响应函数
 *
 * @private
 * @param status
 */
UICore.prototype._serverCallBack = function (status) {
  log('server connect status--', Object.getOwnPropertyNames(Strophe.Status)[status])

  let initial = () => {
    uihChatOpts.xmpp.connection.addHandler(this._onReceived.bind(this), null, 'message')
    uihChatOpts.xmpp.connection.addHandler(this._onErrorMessage.bind(this), null, 'message', 'error')
    uihChatOpts.xmpp.connection.addHandler(this._onChatMessage.bind(this), null, 'message', 'chat')
    uihChatOpts.xmpp.connection.addHandler(this._onPresence.bind(this), null, 'presence', null, null, null)
    uihChatOpts.xmpp.connection.addHandler(this._onRosterChanged.bind(this), 'jabber:iq:roster', 'iq', 'set')

    localStorage.setItem('uihChatJid', uihChatOpts.xmpp.jid)
    localStorage.setItem('uihChatSid', uihChatOpts.xmpp.connection._proto.sid)

    // enable carbons
    this._enableCarbons()
  }

  switch (status) {
    case Strophe.Status.CONNECTING:
      break
    case Strophe.Status.CONNECTED:
      initial()
      if (this.onServerResonse) this.onServerResonse({state: 'success', content: 'connect success'})
      break
    case Strophe.Status.ATTACHED:
      if (this.onServerResonse) this.onServerResonse({state: 'success', content: 'connect success'})
      initial()
      break
    case Strophe.Status.DISCONNECTED:
      this._disconnected()
      break
    case Strophe.Status.CONNFAIL:
      this._init({boshUrl: uihChatOpts.xmpp.url, xmppDomain: uihChatOpts.xmpp.domain})
      if (this.onServerResonse) this.onServerResonse({state: 'fail', content: 'login connect fail'})
      break
    case Strophe.Status.AUTHFAIL:
      this._init({boshUrl: uihChatOpts.xmpp.url, xmppDomain: uihChatOpts.xmpp.domain})
      if (this.onServerResonse) this.onServerResonse({state: 'fail', content: 'login auth failed'})
      break
  }
}

/** 2018/8/18
 * 登录
 *@param options = {jid, pass}
 *@param cb
 *
 */
UICore.prototype.login = function (options, cb) {
  if (uihChatOpts.xmpp.connection && uihChatOpts.xmpp.connection.authenticated) {
    let msg = {state: 'success', content: 'Connection already authenticated.'}
    log('login--', msg.content)
    if (cb) cb(msg)
    return
  }
  uihChatOpts.xmpp.jid = options.jid
  uihChatOpts.xmpp.password = options.pass
  this.onServerResonse = cb

  localStorage.removeItem('uihChatSid')
  localStorage.removeItem('uihChatRid')

  uihChatOpts.xmpp.connection.connect(options.jid, options.pass, this._serverCallBack.bind(this))
}

/** 2018/8/18
 * 登出
 *@param logoutCb
 *
 */
UICore.prototype.logout = function (logoutCb) {
  // clean some resource
  if (logoutCb) logoutCb()
  uihChatOpts.xmpp.connection.disconnect()
  // todo..
}

/**
 * 与服务器断开时触发
 *
 * @private
 *
 * @param
 */
UICore.prototype._disconnected = function () {
  log('disconnected--', 'disconnect form server.')
  localStorage.removeItem('uihChatJid')
  localStorage.removeItem('uihChatSid')
  localStorage.removeItem('uihChatRid')
  localStorage.removeItem('features')
  PubEvent.publishConnectionStatus({state: 'disconnected'})
}

/**
 * rid 变更时触发
 *
 * @private
 * @param {integer} rid next valid request id
 */
UICore.prototype._onRidChange = function (rid) {
  localStorage.setItem('uihChatRid', rid)
}
/**
 * 切换在线状态
 *
 * param preState  //uihChatOpts.CONST.STATUS
 */
UICore.prototype.sendPresence = function (preState = 'online') {
  // disco stuff
  if (uihChatOpts.xmpp.connection.disco) {
    uihChatOpts.xmpp.connection.disco.addIdentity('client', 'web', 'UihChat', '')
    uihChatOpts.xmpp.connection.disco.addFeature(Strophe.NS.DISCO_INFO)
    uihChatOpts.xmpp.connection.disco.addFeature(Strophe.NS.RECEIPTS)
    uihChatOpts.xmpp.connection.disco.addFeature(Strophe.NS.VERSION)
  }

  let pres = $pres()

  if (uihChatOpts.xmpp.connection.caps) {
    // attach caps
    pres.c('c', uihChatOpts.xmpp.connection.caps.generateCapsAttrs()).up()
  }

  if (preState !== 'online' && preState !== 'offline') {
    pres.c('show').t(preState).up()
  }

  let priority = uihChatOpts.priority
  if (priority && typeof priority[preState] !== 'undefined' && parseInt(priority[preState]) !== 0) {
    pres.c('priority').t(priority[preState]).up()
  }

  log('sendPresence-- ' + pres.toString())
  uihChatOpts.xmpp.connection.send(pres)
}

/** 发送消息
 *
 *@param message
 * out message body
 * receive message jid
 */
UICore.prototype.sendMessage = function (message) {
  let Jid = message.to
  let msg = $msg({
    to: Jid,
    type: message.type,
    msgType: message.msgType
  })

  if (message.href !== undefined && message.href !== '') {
    msg.c('body').t(message.content)

    msg.up().c('html', {
      xmlns: Strophe.NS.XHTML_IM
    }).c('body').t(message.href).up()
  } else {
    msg.c('body').t(message.content)
  }
  // if (uihChatOpts.xmpp.connection.caps.hasFeatureByJid(toJid, Strophe.NS.RECEIPTS)) {
  //   msg.up().c('request', {
  //     xmlns: 'urn:xmpp:receipts'
  //   })
  // }
  uihChatOpts.xmpp.connection.send(msg)
}

/**
 * 发送图片
 * @param file
 * @param jid
 * @param blobUrl
 * @param refUrl
 * @param prgsCb
 *
 */
UICore.prototype.sendImage = function (file, jid, blobUrl, refUrl, prgsCb) {
  log('sendImage--', 'compress image start……')

  let p0 = new Promise((resolve, reject) => {
    if (uihChatOpts.img.bUploadRaw) {
      // no compress, but should rotate the picture
      let imgCompress = new ImageCompressor()
      imgCompress.compress(file, {checkOrientation: true, quality: 1})
        .then((result) => {
          const formData = new FormData()
          formData.append('img', result)

          // upload raw picture and return the link in server
          UploadFile2ThirdSystem(formData, (response) => {
            let downUrl = window.containerBase + response.url
            resolve(downUrl)
            if (refUrl) refUrl(downUrl)
          }, (error) => {
            reject(error)
          }, (progress) => {
            if (prgsCb) prgsCb(progress)
          })
        })
    } else {
      resolve('')
    }
  })

  // compress the picture to low quality for xmpp deliver
  let p1 = new Promise((resolve, reject) => {
    let imgCompress = new ImageCompressor()
    imgCompress.compress(file, {checkOrientation: true, quality: file.size > 2 * 1024 * 1024 ? 0.3 : 0.6})
      .then((result) => {
        let _file = new FileReader()
        _file.onload = e => {
          // get the blob url
          resolve(e.target.result)
          // return blob url to local for show
          if (blobUrl) blobUrl(e.target.result)
        }
        _file.readAsDataURL(result)
      }).catch(err => {
        reject(err)
      })
  })

  Promise.all([p0, p1]).then(val => {
    // add message to send data of compressed picture and the link of raw picture
    let msg = new Message({
      content: '<img src="' + val[1] + '" alt="图片"/>',
      msgType: MSG_TYPES.IMG_TYPE,
      to: jid,
      href: val[0] === '' ? '' : val[0]
    })
    this.sendMessage(msg)
  }).catch(err => {
    log('sendImage--', err)
  })
}

/**
 * 出席信息
 *
 * @private
 *
 * @param msg
 * @returns {boolean}
 */
UICore.prototype._onPresence = function (msg) {
  log('onPresence--', msg)

  let type = msg.getAttribute('type')
  let from = msg.getAttribute('from')
  let bid = Strophe.getBareJidFromJid(from).toLowerCase()
  let show = Strophe.getText(msg.querySelector('show'))
  let priority = Strophe.getText(msg.querySelector('priority'))
  let status = Strophe.getText(msg.querySelector('status'))

  // from yourself
  if (bid === Strophe.getBareJidFromJid(uihChatOpts.xmpp.jid)) {
    return true
  }

  // incoming friendship request
  if (type === 'subscribe') {
    // if has this contact, auto approve and add to roster
    this.resFriendReq(bid, true)
    // ..todo
    // this.queryAddressBook(Strophe.getNodeFromJid(bid), (user) => {
    //   this.addContact(bid, user.name)
    // }, () => {
    // })
    PubEvent.publishInvitePresence({from: from.split('@')[0], action: 'Friend apply'})
    // your friend remove you
  } else if (type === 'unsubscribe') {
    PubEvent.publishInvitePresence({from: from.split('@')[0], action: 'Friend remove'})
  } else {
    let contact = {
      jid: from,
      show: type === 'unavailable' ? 'offline' : show || 'online',
      priority: priority,
      status: status,
      available: type !== 'error' && type !== 'unavailable'
    }
    this.onContactListener[0](contact)
    PubEvent.publishStatePresence({from: from.split('@')[0], status: contact.show})
  }
  return true
}

/**
 * 服务器消息总出口
 *
 * @private
 *
 * @param msg
 * @returns {boolean}
 */
UICore.prototype._onReceived = function (msg) {
  log('onReceived---', msg)

  // chat type message process in _onChatMessage
  let type = msg.getAttribute('type')
  if (type === 'chat' || msg.querySelector('message') || type === 'error') {
    return true
  }

  let toJid = Strophe.getBareJidFromJid(msg.getAttribute('to'))
  let fromJid = Strophe.getBareJidFromJid(msg.getAttribute('from'))
  let msgType = msg.getAttribute('msgType')
  let bodys = msg.getElementsByTagName('body')
  let delay = msg.querySelector('delay')
  let stamp = delay ? new Date(delay.getAttribute('stamp')) : new Date()
  stamp = stamp.getTime()

  if (type === 'normal' && fromJid.split('@')[0] === 'admin' && bodys.length > 0) {
    let body = bodys[0]
    let message = new Message({
      type: type,
      content: Strophe.getText(body),
      time: stamp,
      from: 'chatadmin@' + fromJid.split('@')[1],
      to: toJid,
      msgType
    })
    // pop message
    this.onChatListener.forEach((item) => {
      item(message)
    })
    PubEvent.publishSystemMessage(message)
  }
  // todo..
  return true
}

/**
 * 接收消息(type == chat)
 *
 * @private
 * @param msg
 */
UICore.prototype._onChatMessage = function (msg) {
  log('onChatMessage--', msg)

  let carbon = msg.querySelector('message')
  if (carbon) {
    msg = carbon
  }
  let toJid = Strophe.getBareJidFromJid(msg.getAttribute('to'))
  let fromJid = Strophe.getBareJidFromJid(msg.getAttribute('from'))
  let msgType = msg.getAttribute('msgType')
  let bodys = msg.getElementsByTagName('body')
  let type = msg.getAttribute('type')
  let delay = msg.querySelector('delay')
  let stamp = delay ? new Date(delay.getAttribute('stamp')) : new Date()
  stamp = stamp.getTime()
  let href = bodys.length > 1 ? Strophe.getText(bodys[1]) : ''

  if (bodys.length > 0) {
    const body = bodys[0]
    let message = new Message({
      type: type,
      content: Strophe.getText(body),
      time: stamp,
      from: fromJid,
      to: toJid,
      href: href,
      msgType
    })
    // pop message
    this.onChatListener.forEach((item) => {
      item(message)
    })
    PubEvent.publishChatMessage(message)
  }
  return true
}

/**
 * 打印错误信息
 *
 * @private
 *
 * message error message
 */
UICore.prototype._onErrorMessage = function (msg) {
  log('onErrorMessage--', msg)

  let fromJid = msg.getAttribute('from')
  let message = {
    content: '',
    from: fromJid
  }

  if (msg.querySelector('item-not-found')) {
    msg.content = 'message not send , because item not found.'
  } else if (msg.querySelector('forbidden')) {
    msg.content = 'message not send , because forbidden.'
  } else if (msg.querySelector('not-acceptable')) {
    msg.content = 'message not send , not acceptable.'
  } else if (msg.querySelector('remote-server-not-found')) {
    msg.content = 'message not send , remote server not found.'
  } else if (msg.querySelector('service-unavailable')) {
    msg.content = 'message not send , service unavailable.'
  } else {
    msg.content = 'message not send.'
  }

  PubEvent.publishErrorMessage(message)
  return true
}
/**
 * 好友列表
 *
 * @private
 *
 * @param msg
 * @returns {boolean}
 */
UICore.prototype._onRosterChanged = function (msg) {
  log('onRosterChanged--', msg)
  let queryEle = msg.getElementsByTagName('query')

  Strophe.forEachChild(queryEle[0], 'item', (item) => {
    let jid = item.getAttribute('jid')
    let name = item.getAttribute('name')
    // let group = getEleText(item, 'group')
    let subscription = item.getAttribute('subscription')

    // create new contact
    let contact = {
      jid: jid,
      name: name || jid.split('@')[0],
      // group: group,
      subscription: subscription || 'none'
    }
    // delete contact
    if (subscription === 'remove') {
      this.onContactListener[1](contact)
    } else {
      this.onContactListener[0](contact)
    }
  })

  return true
}

/**
 * 获取通讯录
 * @param curUser // login user
 * @param callBack // out address book
 * return address book about login user
 */
UICore.prototype.getAddressBook = function (curUser, callBack) {
  GetThirdSystemUsers(curUser, (response) => {
    if (!response || response.data.length < 1) {
      log('getAddressBook--', 'get nothing address book.')
      return
    }
    let adsBk = []
    response.data.forEach((item) => {
      let user = new Contact({
        id: item.id,
        name: item.name,
        gender: item.gender,
        telephone: item.telephone,
        organization: item.organization,
        department: item.department,
        office: item.office,
        duty: item.duty,
        avatar: item.avatar
      })
      adsBk.push(user)
    })
    if (callBack) callBack(adsBk)
  }, (error) => {
    log('getAddressBook--', 'get address book error: ' + error.message)
  })
}

/**
 * 查询通讯录特定联系人
 * @param id
 * @param callBack
 * @param errorCb
 * return search user
 */
UICore.prototype.queryAddressBook = function (id, callBack, errorCb) {
  QueryThirdSystemUsers({id: id}, (response) => {
    if (!response || !response.data) {
      log('queryAddressBook--', 'query address book nothing')
      return
    }
    let user = {
      id: response.data.id,
      name: response.data.name,
      gender: response.data.gender,
      telephone: response.data.telephone,
      organization: response.data.organization,
      department: response.data.department,
      office: response.data.office,
      duty: response.data.duty,
      avatar: response.data.avatar
    }
    if (callBack) callBack(user)
  }, (error) => {
    if (errorCb) errorCb(error)
    log('queryAddressBook--', 'query address book error: ' + error.message)
  })
}

/**
 * 获取联系人
 * @param cb
 */
UICore.prototype.getContacts = function (cb) {
  let iq = $iq({
    type: 'get'
  }).c('query', {xmlns: 'jabber:iq:roster'})

  let contacts = []
  uihChatOpts.xmpp.connection.sendIQ(iq, (result) => {
    let queryEle = result.getElementsByTagName('query')
    Strophe.forEachChild(queryEle[0], 'item', (item) => {
      let contact = new Contact(
        {
          jid: item.getAttribute('jid'),
          subscription: item.getAttribute('subscription'),
          // group: getEleText(item, 'group'),
          name: item.getAttribute('name')
        }
      )
      contacts.push(contact)
    })
    if (cb) {
      cb(contacts)
    }
  })
}

/**
 * 添加联系人
 * @param {string} jid
 * @param {string} alias
 */
UICore.prototype.addContact = function (jid, alias) {
  let iq = $iq({
    type: 'set'
  }).c('query', {
    xmlns: 'jabber:iq:roster'
  }).c('item', {
    jid: jid,
    name: alias || ''
  })
  uihChatOpts.xmpp.connection.sendIQ(iq)

  // send subscription request to buddy (trigger onRosterChanged)
  uihChatOpts.xmpp.connection.send($pres({
    to: jid,
    type: 'subscribe'
  }))
}

/**
 * 删除联系人
 * @param friend // you contact
 */
UICore.prototype.removeContact = function (friend) {
  if (!friend) {
    log('removeContact--', 'invalid friend.')
    return
  }

  let jid = friend.jid
  let iq = $iq({type: 'set'}).c('query', {xmlns: 'jabber:iq:roster'}).c('item', {subscription: 'remove', jid: jid})
  uihChatOpts.xmpp.connection.sendIQ(iq)

  this.onContactListener[1](friend)
  this.resFriendReq(jid, false)
}

/**
 * 名册设置
 * 修改联系人的备注
 * @param jid
 * @param name
 */
UICore.prototype.changeName = function (jid, name) {
  this.rosterSet(this, jid, name, null)
}

/**
 * 修改联系人的分组
 * @param jid
 * @param group
 */
UICore.prototype.changeGroup = function (jid, group) {
  this.rosterSet(this, jid, null, group)
}

/**
 * 名册设置 roster set
 * @param friend
 * @param group
 */
UICore.prototype.rosterSet = function (friend, group) {
  const iq = $iq({from: uihChatOpts.xmpp.jid, type: 'set'})
    .c('query', {xmlns: 'jabber:iq:roster'})
    .c('item', {jid: friend.jid, name: friend.name})
    .c('group', '', group)
    .tree()
  uihChatOpts.xmpp.connection.sendIQ(iq)
}

/** 2018/8/18
 * 响应好友的请求
 * *@param from  friend jid
 * *@param approve  true or false
 */
UICore.prototype.resFriendReq = function (from, approve) {
  uihChatOpts.xmpp.connection.send($pres({
    to: from,
    type: (approve) ? 'subscribed' : 'unsubscribed'
  }))
}

UICore.prototype.rawInput = function (data) {
  // log('rawInput--', data);
}
UICore.prototype.rawOutput = function (data) {
  // log('rawOutput--', data);
}

/**
 * 注册消息接收函数
 * 0:add message 1:load history message
 */

UICore.prototype.addMessageListener = function () {
  for (let arg in arguments) {
    this.onChatListener.push(arguments[arg])
  }
}

/**
 * 注册会话联系人处理函数
 * 0:add or update contact 1:delete contact
 */

UICore.prototype.addContactListener = function () {
  for (let arg in arguments) {
    this.onContactListener.push(arguments[arg])
  }
}

/**
 * 加载联系人历史消息
 * @param {string} friend
 */

UICore.prototype.loadHistoryMessage = function (friend) {
  let p = (resolve) => {
    // is support load history
    let hasFeatureMam1 = uihChatOpts.xmpp.features.indexOf('urn:xmpp:mam:1') >= 0
    let hasFeatureMam2 = uihChatOpts.xmpp.features.indexOf('urn:xmpp:mam:2') >= 0
    if (hasFeatureMam1 && !hasFeatureMam2) {
      Strophe.addNamespace('MAM', 'urn:xmpp:mam:1')
    }
    if (!uihChatOpts.mam.enable || (!hasFeatureMam1 && !hasFeatureMam2)) {
      log('loadHistoryMessage--', 'not able to archived messages.')
      return
    }

    let msgs = []
    if (friend.archiveExhausted) {
      log('loadHistoryMessage--', 'No more archived messages.')
      this.onChatListener.forEach((item) => {
        item(msgs)
      })
      resolve(msgs.length)
      return
    }

    let queryId = uihChatOpts.xmpp.connection.getUniqueId()
    let lastArchivedUid = friend.lastArchivedUid
    let searchJid = Strophe.getNodeFromJid(friend.jid) === 'chatadmin' ? 'admin@' + window.xmppdomain : Strophe.getBareJidFromJid(friend.jid)
    let queryOptions = {
      max: uihChatOpts.mam.max,
      queryid: queryId,
      before: lastArchivedUid,
      with: searchJid,
      onMessage: (message) => {
        let result = message.querySelector('result')
        if (!result) {
          log('loadHistoryMessage--', 'load history message nothing.')
          return
        }

        let forwarded = result.querySelector('forwarded')
        let msgEle = forwarded.querySelector('message')
        if (!msgEle) {
          return
        }
        let type = msgEle.getAttribute('type')
        let from = msgEle.getAttribute('from')
        let msgType = msgEle.getAttribute('msgType')
        if (from.split('@')[0] === 'admin') {
          from = 'chatadmin@' + window.xmppdomain
        }
        let to = msgEle.getAttribute('to')
        if (to.split('/')[0] === uihChatOpts.xmpp.jid.split('/')[0] &&
          from.split('/')[0] === uihChatOpts.xmpp.jid.split('/')[0]) {
          return
        }
        let delay = forwarded.querySelector('delay')
        let stamp = delay ? new Date(delay.getAttribute('stamp')) : new Date()
        stamp = stamp.getTime()
        let body = Strophe.getText(msgEle.querySelector('body'))
        let href = msgEle.querySelector('html') ? Strophe.getText(msgEle.querySelector('html').firstChild) : ''
        let msg = new Message({
          type: type,
          content: body,
          time: stamp,
          from: from,
          to: to,
          href: href,
          msgType
        })
        msgs.push(msg)
        return true
      },
      onComplete: (message) => {
        let fin = message.querySelector('fin')
        friend.archiveExhausted = fin.getAttribute('complete') === 'true'
        friend.lastArchivedUid = Strophe.getText(fin.querySelector('first'))
        this.onChatListener.forEach((item) => {
          item(msgs)
        })
        resolve(msgs.length)
        return true
      }
    }
    if (!lastArchivedUid && friend.msgs && friend.msgs.length > 0) {
      queryOptions.end = (new Date(friend.msgs[0].time)).toISOString()
    }
    uihChatOpts.xmpp.connection.mam.query(undefined, queryOptions)
  }
  return new Promise(p)
}
UICore.prototype.UploadFile = function (sign, file, callback, success) {
  callback()
  requestSlot(file).then(res => {
    callback(res.get)
    Put(file, res.put, success, error => {
      console.log('error', error)
    }, callback)
  }).catch(err => {
    console.log(err)
  })
}

function requestSlot (file) {
  let HTTPUPLOAD = 'urn:xmpp:http:upload'
  let iq = $iq({
    to: `httpfileupload.${window.xmppdomain}`,
    type: 'get'
  }).c('request', {
    xmlns: HTTPUPLOAD
  }).c('filename').t(file.name).up().c('size').t(file.size)
  let p = (resolve, reject) => {
    uihChatOpts.xmpp.connection.sendIQ(iq, function (stanza) {
      let slot = stanza.querySelector('slot')
      if (slot.getAttribute('xmlns') === HTTPUPLOAD) {
        let put, get
        put = slot.querySelector('put').textContent
        get = slot.querySelector('get').textContent
        resolve({
          put,
          get
        })
      }
      reject('无返回内容')
    }, error => {
      reject(error.querySelector('text').textContent)
    })
  }
  return new Promise(p)
}
export default UICore
