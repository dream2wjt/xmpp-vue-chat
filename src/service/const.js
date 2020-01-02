/**
 * Create by jingtian.wang on 2018/7/13.
 */
var userAgent = navigator.userAgent.toLowerCase()
export const isPC = userAgent.includes('windows nt') || navigator.userAgent.includes('macintosh')
export const isIOS = userAgent.includes('iphone') || userAgent.includes('ipad')
export const isWechat = userAgent.includes('micromessenger')

/**
定义消息类型
 */
const msgTypeArr = ['text', 'image', 'file']
export const MSG_TYPES = {TEXT_TYPE: msgTypeArr[0], IMG_TYPE: msgTypeArr[1], FILE_TYPE: msgTypeArr[2]}
/**
 *  根据jid获取id
 * @param jid
 * @returns {*}
 */
export function getIdFromJid (jid) {
  try {
    if (jid.indexOf('@') < 0) { return null }
    return jid.split('@')[0]
  } catch (e) {
    return 'undefined'
  }
}
/**
 *  根据jid获取bid
 * @param jid
 * @returns {*}
 */
export function getBareJid (jid) {
  return jid ? jid.split('/')[0] : null
}

export class Urls {
  static getThirdSystemUsers = '/API/ShowUsers2UIHChat'
  static queryThirdSystemUsers = '/API/QueryUsers2UIHChat'
  static uploadFile2ThirdSystem = '/API/UploadFileByUIHChat'
}

export class PubSubTopic {
  static MESSAGE_CHAT = 'message.chat'
  static MESSAGE_SYS = 'message.sys'
  static MESSAGE_ERROR = 'message.error'
  static PRESENCE_STATE = 'presence.state'
  static PRESENCE_INVITE = 'presence.invite'
  static OPERATE_LOGIN = 'operate.login'
  static OPERATE_LOGOUT = 'operate.logout'
  static OPERATE_SEND_MESSAGE = 'operate.send.msg'
  static OPERATE_USER_CHOOSE = 'operate.user.choose'
  static OPERATE_RESPONSE_STATE = 'operate.response.state'
  static CONNECTION_DISCONNECT = 'connection.disconnect'
}

/**
 * 联系人
 * @param options
 * @constructor
 */
export function Contact (options) {
  this.id = options.id
  this.jid = options.jid
  this.name = options.name || options.jid.split('@')[0]
  this.gender = options.gender
  this.telephone = options.telephone
  this.organization = options.organization
  this.department = options.department
  this.office = options.office
  this.duty = options.duty
  this.avatar = options.avatar || require('../assets/default.png')
  this.describe = options.describe || ''
  this.msgTime = options.msgTime || ''
  this.lastMsg = options.lastMsg || ''
  this.msgPrompt = 0 // unread message
  this.available = options.available || false  // online //offline
  this.show = options.show || 'offline' // .online-在线.away-临时离开.  chat-活跃并想聊天.  dnd-"Do Not Disturb".  xa-"eXtended Away"，长时间离开.offline-离线
  this.status = options.status || ''
  this.priority = options.priority || 0  // 可选的<priority/>元素包含定义该资源优先级的非自然人可读的XML字符数据
  this.subscription = options.subscription || 'none'
  this.archiveExhausted = false // 是否可以加载历史记录
  this.lastArchivedUid = '' // 上一次历史记录id
  this.msgs = []
}

/**
 * 消息
 * @param options
 * @constructor
 */
export function Message (options) {
  this.id = new Date().getTime() + ':msg'
  this.type = options.chat || 'chat'
  this.content = options.content
  this.msgType = msgTypeArr.includes(options.msgType) ? options.msgType : MSG_TYPES.TEXT_TYPE
  this.time = options.time || new Date().getTime()
  this.from = options.from || localStorage.getItem('uihChatJid').split('/')[0]
  this.to = options.to
  this.href = options.href || '' // the link of picture in server
}
