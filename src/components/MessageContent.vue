<template>
  <ul>
    <li v-for="(msg,index) in user.msgs" :key="msg.key" class="uih-chat-msg">
      <div v-if="showTime(user.msgs,index)" class="uih-time-hint"><span>{{calcTime(index)}}</span></div>
      <div v-if="msg.from.split('/')[0] === curUser.jid.split('/')[0]" class="uih-chat-mine">
        <div class="uih-chat-user">
          <img :src="curUser.avatar">
        </div>
        <div class="uih-chat-text">
          <div class="f_hui_s" v-if="platform === 'pc'"><i class="f_mr5">{{(new Date(msg.time)).toLocaleString()}}</i>{{curUser.name}}</div>
          <div v-html="showMsg(msg)" :class="{'uih-chat-msg-content':true, content:!checkImg(msg)}"></div>
        </div>
      </div>
      <div class="uih-chat-user" v-else>
        <div class="uih-chat-user">
          <img :src="user.avatar">
        </div>
        <div class="uih-chat-text">
          <div class="f_hui_s" v-if="platform === 'pc'">{{user.name}}<i class="f_ml5">{{(new
            Date(msg.time)).toLocaleString()}}</i></div>
          <div v-html="showMsg(msg)"
               :class="{'uih-chat-msg-content':true, content:!checkImg(msg)}"></div>
        </div>
      </div>
    </li>
    <div v-transfer-dom>
      <previewer ref="previewer" :list="imgList"></previewer>
    </div>
  </ul>
</template>

<script>
  import {word2Emoji} from 'uih-emoji'
  import {MSG_TYPES, isWechat} from '../service/const'
  import {createNamespacedHelpers} from 'vuex'
  import {Previewer, TransferDom} from 'vux'

  const {mapState} = createNamespacedHelpers('uihChat')
  export default {
    name: 'message-body',
    components: {
      Previewer
    },
    props: {
      user: {
        type: Object
      }
    },
    data () {
      return {
        imgList: [],
        bodyWidth: document.body.clientWidth
      }
    },
    directives: {
      TransferDom
    },
    methods: {
      checkImg (msg, hasfile) {
        if (hasfile && isWechat && msg.msgType === MSG_TYPES.FILE_TYPE) {
          return msg.content.includes('alt="图片文件"')
        }
        let isImg = msg.content.substr(msg.content.length - 30).match(/alt.?=.+图片/)
        return !!isImg
      },
      showMsg (msg) {
        let color = this.platform === 'pc' ? 'color: bisque' : 'color: blue'
        if (msg.content.match(/^https:\/\//) || msg.content.match(/^http:\/\//)) {
          msg.content = '<a href="' + msg.content + '" style="' + color + '">' + msg.content + '</a>'
        }
        let tMsg = this.msgTransfer(msg.content)
        // 替换[表情]为img
        return tMsg.replace(/\[.*?\]/g, i => {
          return word2Emoji(i)
        })
      },
      msgTransfer (msg) {
        return msg.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      },
      showImg (msrc) {
        let index = this.imgList.findIndex((item) => item.src === msrc)
        this.$refs.previewer.show(index)
      },
      showTime (msgs, index) {
        if (this.platform === 'pc') return false
        if (index === 0) return true
        if (msgs[index].time - msgs[index - 1].time > 300000) {
          return true
        }
        return false
      },
      calcTime (index) {
        let the = new Date(this.user.msgs[index].time)
        let theH = the.getHours()
        let theM = (the.getMinutes() < 10 ? '0' : '') + the.getMinutes()
        let today = new Date()
        if (the.toLocaleDateString() === today.toLocaleDateString()) {
          return theH + ':' + theM
        }
        let yesterday = new Date(today - 1000 * 3600 * 24)
        if (the.toLocaleDateString() === yesterday.toLocaleDateString()) {
          return '昨天 ' + theH + ':' + theM
        }
        if (the.getFullYear() !== today.getFullYear()) {
          return the.getFullYear() + '年' + (the.getMonth() + 1) + '月' + the.getDate() + '日' + ' ' + theH + ':' + theM
        }
        return (the.getMonth() + 1) + '月' + the.getDate() + '日' + ' ' + theH + ':' + theM
      },
      addPreviewList (msg, unshift) {
        if (!this.checkImg(msg, true)) return
        if (msg.msgType === MSG_TYPES.FILE_TYPE && !isWechat) return
        // href暂无，先用缩略图代替
        let msrc
        if (msg.msgType !== MSG_TYPES.FILE_TYPE || !isWechat) {
          msrc = msg.content.substr(0, 20).indexOf('&lt;') < 0 ? msg.content.split('"')[1] : msg.content.split('&quot;')[1]
        } else {
          msrc = this.msgTransfer(msg.content).match(/data-src=".+?"/)[0].replace('data-src=', '').replace(/"/g, '')
        }
        if (unshift) {
          this.imgList.unshift({src: msrc, width: this.bodyWidth})
        } else {
          this.imgList.push({src: msrc, width: this.bodyWidth})
        }
      }
    },
    computed: {
      ...mapState([
        'curUser',
        'uiCore',
        'platform'
      ])
    },
    watch: {
      user (newVal, oldVal) {
        this.imgList = []
        if (newVal.msgs && newVal.msgs.length > 0) {
          for (let i = 0; i < newVal.msgs.length; i++) {
            this.addPreviewList(newVal.msgs[i])
          }
        }
        this.$emit('reset-scroller')
      },
      'user.msgs': {
        handler: function (newVal, oldVal) {
          if (newVal.length === 0 && oldVal.length === 0) { return }
          // 及时聊天消息
          if (newVal[0] === oldVal[0]) {
            this.$emit('reset-scroller')
            let curMsg = newVal[newVal.length - 1]

            // 本地发送的图片在发送时添加到previewer
            if (curMsg.from.split('/')[0] !== this.curUser.jid.split('/')[0]) {
              this.addPreviewList(newVal[newVal.length - 1])
            }
          } else {
            // 历史聊天消息
            if (oldVal.length === 0) { this.$emit('reset-scroller') }
            for (let idx = newVal.length - oldVal.length - 1; idx >= 0; idx--) {
              this.addPreviewList(newVal[idx], true)
            }
          }
        },
        immediate: false
      }
    }
  }
</script>

<style lang="less">
  .voc-file{
    display: flex;
    .voc-bar{
      flex:1;
      height: 25px;
      border-radius: 15px;
      background-color: #FFFFFF;
    }
  }
</style>
