<template>
  <div class="dialogue">
    <section :class="{'dialogue-section': !isSystem, 'dialogue-section-system': isSystem,'clearfix': true}" ref="chatBody">
      <message-body :user="chattingUser" ref="msgBody"></message-body>
    </section>
    <footer class="dialogue-footer" ref="chatFooter" v-show="!isSystem" v-transfer-dom>
      <div class="component-dialogue-bar-person">
        <div class="iconfont" @click="currentChatWay = !currentChatWay">
          <img title="语音" v-show="!currentChatWay" src="../../../src/assets/voice.svg"/>
          <img title="键盘" v-show="currentChatWay" src="../../../src/assets/close.svg"/>
        </div>
        <!--<send-voice-btn v-show="!currentChatWay"></send-voice-btn>-->
        <div class="chat-way" v-show="currentChatWay">
          <div class="chat-txt needsclick" autofocus="autofocus" ref="chatContent" contenteditable="true" @focus="focusIpt" @input="changeIpt"></div>
        </div>
        <div class="expression iconfont icon-dialogue-smile" @click="listOpen(0)">
          <img title="表情" class="list-not-close" src="../../../src/assets/emoji.svg"/>
        </div>
        <div class="more iconfont icon-dialogue-jia">
          <img title="添加" class="list-not-close" @click="listOpen(1)" v-show="showAdd" src="../../../src/assets/add.svg"/>
          <img title="发送" v-show="!showAdd" src="../../../src/assets/send.svg" @touchstart="sendTextMsg"/>
        </div>
      </div>
    </footer>
    <chat-emoji-list v-show="showList&&listType===0" :showList.sync="showList" editorName="chatContent" @emoji-click="emojiSelect" @list-close="listClose"></chat-emoji-list>
    <extra-fun-list v-show="showList&&listType===1" @send-img="sendImgMsg" @send-file="sendFileMsg"></extra-fun-list>
  </div>
</template>
<script>
  import MessageBody from './MessageBody'
  // import SendVoiceBtn from '../../components/SendVoiceBtn'
  import {ChatEmojiList} from 'uih-emoji'
  import ExtraFunList from './ExtraFunList'
  import ChatTool from '../../mixin/ChatToolMixin'
  import MobileTool from '../../mixin/MobileToolMixin'
  import {createNamespacedHelpers} from 'vuex'
  import {TransferDom} from 'vux'
  import EditorBase from '../../lib/EditorBase'
  import {isPC, Message} from '../../service/const'

  const {mapMutations, mapState} = createNamespacedHelpers('uihChat')
  export default {
    name: 'conversation-window',
    mixins: [ChatTool].concat(isPC ? [] : [MobileTool]),
    directives: {
      TransferDom
    },
    components: {
      MessageBody,
      // SendVoiceBtn,
      ChatEmojiList,
      ExtraFunList
    },
    props: {
      contactId: {
        type: String,
        default () {
          return ''
        }
      },
      name: {
        type: String,
        default () {
          return '未知'
        }
      }
    },
    data () {
      return {
        // pageName: this.$route.query.name,
        currentChatWay: true, // ture为键盘打字 false为语音输入
        showList: false,
        listType: 0, // 0::打开表情列表 1:附加功能列表
        editorBase: null,
        timer: null,
        showAdd: true
        // sayActive: false // false 键盘打字 true 语音输入
      }
    },
    created () {
      // 处理从其他页面（非会话列表页面）直接跳转到当前页面逻辑
      let contactId = this.$route.query.contactId || this.contactId
      let name = this.$route.query.name || this.name
      if (this.chattingUser && this.chattingUser.jid.split('@')[0] === contactId) {
        return
      }
      let contact = this.contacts.find((item) => {
        return item.jid.split('@')[0] === contactId
      })
      if (contact) {
        this.updateChattingUser(contact.jid)
      } else {
        // 此人不在常用回话列表中，先去通讯录中查找
        let contact = this.addressBooks.find((item) => {
          return item.id === contactId
        })
        // 依然不存在，构造一个
        if (!contact) {
          contact = {}
        }
        contact.jid = contactId + '@' + window.xmppdomain
        contact.name = name
        this.updateContact(contact)
        this.uiCore.addContact(contact.jid, contact.name)
        this.updateChattingUser(contact.jid)
      }
    },
    mounted () {
      this.editorBase = new EditorBase(this.$refs.chatContent)
      this.editorBase.attachEvent('paste')
      this.$refs.msgBody.scroll2Pos()
    },
    computed: {
      ...mapState([
        'addressBooks',
        'chattingUser',
        'uiCore',
        'contacts'
      ]),
      isSystem () {
        return this.contactId === 'chatadmin' || this.$route.query.contactId === 'chatadmin'
      }
    },
    methods: {
      ...mapMutations([
        'addMessage',
        'clearMessage',
        'updateContact',
        'updateChattingUser'
      ]),
      // 解决输入法被激活时 底部输入框被遮住问题
      focusIpt () {
        this.listClose()
      },
      // blurIpt () {
        // clearTimeout(this.timer)
      // },
      changeIpt () {
        let Nodes = this.$refs.chatContent.childNodes
        // ios清空内容后会剩下一个<br>标签
        if (Nodes.length > 0 && !(Nodes.length === 1 && Nodes[0].nodeName.toUpperCase() === 'BR') && !this.editorBase.checkIsBr(Nodes)) {
          this.showAdd = false
        } else {
          this.showAdd = true
        }
      },
      listOpen (openType) {
        if (this.listType === openType) {
          this.showList = !this.showList
        } else {
          this.listType = openType
          this.showList = true
        }
        if (this.showList) {
          this.$refs.chatFooter.style.bottom = '256px'
          this.$refs.chatBody.style.bottom = '256px'
        } else {
          this.listClose()
        }
      },
      emojiSelect (emoji) {
        this.editorBase.emojiSelect(emoji)
      },
      listClose () {
        this.showList = false
        this.$refs.chatFooter.style.bottom = '0px'
        this.$refs.chatBody.style.bottom = '0px'
      },
      msg2server (content) {
        if (content.length <= 400 ||
          content.match(/data:image\/png;base64,/) ||
          content.match(/data:image\/jpg;base64,/)) {
          let msg = new Message({
            type: 'chat',
            content: content,
            to: this.chattingUser.jid.split('/')[0]
          })
          this.addMessage(msg)
          this.uiCore.sendMessage(msg)
        } else {
          this.$vux.toast.text('文字一次限输入400字符以内！', 'middle')
        }
      },
      sendTextMsg () {
        let time = 0
        // 判断是否是输入完直接点发送，若是，等软键盘消失再发送，以免vue-scroller高度判定错误
        if (document.activeElement === this.$refs.chatContent) {
          time = 300
        }
        setTimeout(() => {
          this.editorBase.sendMsg(this.msg2server)
          this.changeIpt()
        }, time)
      },
      sendFileMsg (image) {
        this.sendFile(image)
        this.listClose()
      },
      sendImgMsg (image) {
        if (!image) {
          this.$vux.toast.text('无效的文件或不支持的文件格式！', 'middle')
          return
        }
        if (image.size > 5 * 1024 * 1024) {
          this.$vux.toast.text('文件过大，请重新选择！', 'middle')
          return
        }
        let nextCB = () => {
          this.$nextTick(() => {
            this.$refs.msgBody.scroll2Pos()
          })
        }
        this.sendPic(image, nextCB)
        this.listClose()
      }
    },
    beforeRouteLeave (to, from, next) {
      try {
        this.clearMessage(this.chattingUser.jid)
        next()
      } catch (e) {
        next()
      }
    },
    beforeDestroy () {  // 作为component时退出处理
      this.clearMessage(this.contactId + '@' + window.xmppdomain)
    }
  }
</script>
<style>
  @import '../../../src/assets/css/dialogue.css';
  @import '../../../src/assets/css/wx-header.css';
  .say-active {
    background: #c6c7ca;
  }
  .dialogue-section{
    height: calc(100% - 50px);
  }
  .dialogue-section-system{
    height: 100%;
  }
</style>
