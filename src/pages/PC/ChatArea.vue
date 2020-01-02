<template>
  <div class="uih-chat-text-window">
    <div class="uih-chat-text-header">
      <p class="uih-chat-text-p">与{{chattingUser.name}}的会话</p>
      <img class="uih-chat-close" @click="chatClose" src="../../assets/close.svg">
    </div>
    <div class="uih-chat-text-content" ref="chatBody">
      <div class="uih-chat-text-body">
        <message-body ref="msgBody" :user="chattingUser"></message-body>
      </div>
      <div class="uih-chat-text-message">
        <div class="uih-chat-text-tool">
          <chat-emoji-list v-show="showList && !isSystem" :showList.sync="showList" editorName="chatContent" @emoji-click="emojiSelect"/>
          <ul>
            <li class="tool_item">
              <!--单个表情-->
              <img @click="showList = !showList" title="表情" class="list-not-close" src="../../assets/emoji.svg">
            </li>
            <li class="tool_item">
              <img title="图片" @click="$refs.imgFile.click()" src="../../assets/sendImg.svg"/>
              <input type="file" ref="imgFile" accept="image/*" @change="sendImgMsg" style="display: none" :disabled="isSystem"/>
            </li>
            <li class="tool_item">
              <img title="文件" @click="$refs.file.click()" src="../../assets/sendImg.svg"/>
              <input type="file" ref="file" @change="sendFileMsg" style="display: none" :disabled="isSystem"/>
            </li>
            <li class="tool_item"><a style="font-size: 20px" class="f_w100 iconfont icon-file"></a></li>
            <span class="tool_tips">按回车发送消息</span>
          </ul>
        </div>
        <div class="uih-chat-text-edit">
          <div>
            <!--@keydown.capture.enter="sendMsg()"-->
            <div :contenteditable="!isSystem" class="uih-chat-text-area" ref="chatContent"></div>
          </div>
        </div>
      </div>
    </div>
    <!--<image-previewer></image-previewer>-->
  </div>
</template>

<script>
  import MessageBody from './MessageBody'
  import ChatTool from '../../mixin/ChatToolMixin'
  import {createNamespacedHelpers} from 'vuex'
  import {ChatEmojiList} from 'uih-emoji'
  import {Message} from '../../service/const'
  import EditorBase from '../../lib/EditorBase'

  const {mapMutations, mapState} = createNamespacedHelpers('uihChat')

  export default {
    name: 'text-window',
    mixins: [ChatTool],
    components: {
      MessageBody,
      ChatEmojiList
    },
    computed: {
      ...mapState([
        'uiCore',
        'chattingUser'
      ]),
      isSystem () {
        return this.chattingUser.jid.split('@')[0] === 'chatadmin'
      }
    },
    data () {
      return {
        showList: false,
        editorBase: undefined,
        draft: {}
      }
    },
    mounted () {
      // 文本框相关事件
      this.editorBase = new EditorBase(this.$refs.chatContent)
      this.editorBase.attachEvent('paste')
      this.editorBase.attachEvent('enter', [this.msg2server])
    },
    methods: {
      ...mapMutations([
        'addMessage'
      ]),
      emojiSelect (emoji) {
        this.editorBase.emojiSelect(emoji)
      },
      msg2server (content) {
        if (!content) {
          this.$vux.toast.text('不能发送空白消息', 'middle')
        }
        let type = typeof content
        if (type === 'string') {
          let msg = new Message({
            type: 'chat',
            content: content,
            to: this.chattingUser.jid.split('/')[0]
          })
          this.addMessage(msg)
          this.uiCore.sendMessage(msg)
        }
        if (type === 'object') {
          this.sendImgMsg(content)
        }
        this.showList = false
        this.draft[this.chattingUser.jid] = ''
      },
      sendFileMsg () {
        let file = this.$refs.file.files[0]
        this.$refs.file.value = ''
        this.sendFile(file)
      },
      sendImgMsg (blob) {
        let file = (blob !== undefined && blob.target === undefined) ? blob : this.$refs.imgFile.files[0]
        this.$refs.imgFile.value = ''
        let nextCB = () => {
          this.$nextTick(() => {
            let msgBody = this.$refs.msgBody.$el
            msgBody.scrollTo(0, msgBody.scrollHeight)
          })
        }
        this.sendPic(file, nextCB)
      },
      chatClose () {
        setTimeout(() => {
          document.getElementById('app').setAttribute('style', 'display: none')
        }, 10)
      }
    },
    watch: {
      chattingUser (newVal, oldVal) {
        if (this.$refs.chatContent.innerHTML) {
          this.draft[oldVal.jid] = this.$refs.chatContent.innerHTML
          this.$refs.chatContent.innerHTML = ''
        }
        if (this.draft[newVal.jid]) {
          this.$refs.chatContent.innerHTML = this.draft[newVal.jid]
        }
      }
    }
  }
</script>

<style lang="less">
  @import "../../style/common";

  .uih-chat-text-window {
    width: 100%;
    height: 100%;
  }

  .uih-chat-img-preview {
    position:fixed;
    top:0;
    left:0;
    background-color: #999999b8;
    padding: 20px;
    z-index: 100;
    &>div{
      color:#ffffff;
      text-align: center;
      height: 30px;
      line-height: 30px;
    }
  }
  .uih-chat-text-header {
    height: 65px;
    width: 100%;
    color: @gray99;
    background-color: @themeGray;
    border-bottom: 1px solid @borderColor;
    text-align: center;
    display: block;
    padding: 7px 0;
    -webkit-box-pack: center;
    -webkit-box-align: center;
    -webkit-box-sizing:border-box;
  }

  .uih-chat-text-p {
    font-family:PingFangSC-Medium;
    font-size:18px;
    color:#ffffff;
    line-height:25px;
    text-align:center;
  }
  .uih-chat-close{
    position: absolute;
    top: 25px;
    right: 20px;
    width: 14px;
  }
  .uih-chat-text-content {
    width: 100%;
    height: 600px;
    .uih-chat-text-body {
      position: relative;
      width: 100%;
      height: 480px;
    }
    .uih-chat-text-message{
      min-height: 120px;
    }
    .uih-chat-text-tool {
      position: relative;
      width: 100%;
      height: 24px;
      border-top: 1px solid @grayDE;
      ul {
        display: flex;
        clear: both;
        overflow: hidden;
        padding: 5px 3px;
        .tool_item{
          margin-left: 15px;
          width:16px;
          height:14px;
          img{
            width:100%;
            height:100%;
            cursor: pointer;
          }
        }
        .tool_tips{
          position: absolute;
          color: #999999;
          right: 20px;
          cursor: default;
        }
      }
      .uih-chat-tool-img{

      }
    }
    .uih-chat-text-edit {
      position: relative;
      width: 100%;
      min-height: 95px;
      &>div{
        padding: 8px 18px;
      }
      .uih-chat-text-area {
        font-size: 14px;
        border: none;
        width: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        height: 70px;
        &:focus{
          outline: none;
        }
        img{
          max-height: 200px;
          max-width: 200px;
        }
      }
    }
  }
</style>
