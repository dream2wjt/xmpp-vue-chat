import {MSG_TYPES, isWechat, Message} from '../service/const'
import {createNamespacedHelpers} from 'vuex'

const {mapMutations, mapState} = createNamespacedHelpers('uihChat')
let loadImg = require('../assets/loadingImg.gif')

export default {
  data () {
    return {
      bodyWidth: document.body.clientWidth
    }
  },
  mounted () {
    this.addImgEvent()
  },
  computed: {
    ...mapState([
      'uiCore',
      'chattingUser'
    ])
  },
  methods: {
    ...mapMutations([
      'addMessage'
    ]),
    addImgEvent () {
      this.$refs.msgBody.$el.onclick = e => {
        let ele = e.target
        let img = ele.querySelector('img[alt^="图片"]')
        if (!img) {
          while (!ele.className.includes('uih-chat-text')) {
            if (ele.tagName === 'BODY' || ele === this.$refs.msgBody.$el) break
            ele = ele.parentNode
          }
          img = ele.querySelector('img[alt^="图片"]')
        }
        let audio = ele.querySelector('audio')
        if (audio) {
          if (audio.paused) {
            audio.play()
          } else {
            audio.pause()
          }
        }
        if (img) {
          let msrc = isWechat && img.alt === '图片文件' ? img.getAttribute('data-src') : img.src
          this.$refs.msgBody.$refs.msgContent.showImg(msrc)
        }
      }
    },
    sendPic (file, nextCB) {
      let msg = new Message({
        msgType: MSG_TYPES.IMG_TYPE,
        to: this.chattingUser.jid.split('/')[0]
      })
      msg.content = '<img src="' + loadImg + '" class="load-img" alt="图片"/>'
      this.addMessage(msg)
      // send picture
      this.uiCore.sendImage(file, this.chattingUser.jid, (blobUrl) => {
        msg.content = '<img src="' + blobUrl + '" alt="图片"/>'
        this.$refs.msgBody.updatePreviewList({
          src: blobUrl,
          width: this.bodyWidth
        })
        if (typeof nextCB === 'function') {
          // 加载图片后滚动条滚动至底部，此处this与Vue组件this不同，因此this.$nextTick需从外部传递
          nextCB()
        }
      }, (refUrl) => {
        msg.href = refUrl === '' ? '' : refUrl
      })
    },
    sendFile (file) {
      let sign = new Date().getTime()
      let callback = (tag) => {
        if (!tag && typeof tag !== 'number') {
          let info = this.getFileInfo(file)
          let slot = `<img src="${info.src}"/><a id="des${sign}" target="_blank">${info.name}</a>`
          let content = `<div class="file-content"><div id="file${sign}" class="progress-bar"></div><div class="file-description">${slot}</div></div>`
          let msg = new Message({
            type: 'chat',
            msgType: MSG_TYPES.FILE_TYPE,
            content,
            to: this.chattingUser.jid.split('/')[0]
          })
          this.addMessage(msg)
        } else if (typeof tag === 'string') {
          let des = document.getElementById(`des${sign}`)
          des.setAttribute('href', tag)
          // des.style.textDecoration = 'underline'
          des.removeAttribute('id')
        } else {
          let percent = tag || 0
          document.getElementById(`file${sign}`).style.width = `${percent}%`
        }
      }
      let success = () => {
        let signEle = document.getElementById(`file${sign}`)
        let fileContent = signEle.parentNode.parentNode
        signEle.replaceWith()
        let content = fileContent.innerHTML
        let msg = new Message({
          type: 'chat',
          msgType: MSG_TYPES.FILE_TYPE,
          content,
          to: this.chattingUser.jid.split('/')[0]
        })
        this.uiCore.sendMessage(msg)
      }
      this.uiCore.UploadFile(sign, file, callback, success)
    },
    getFileInfo (file) {
      let type = file.type
      let name = file.name
      return {src: type, name}
    }
  }
}
