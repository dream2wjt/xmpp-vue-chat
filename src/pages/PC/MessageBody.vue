<template>
  <div class="uih-chat-msg-body">
    <load-more :show-loading="loadMsg === ''" :tip="loadMsg" @click.native="loadHistory"></load-more>
    <message-content :user="user" @reset-scroller="scroll2Pos" ref="msgContent"></message-content>
  </div>
</template>

<script>
  import {createNamespacedHelpers} from 'vuex'
  import {LoadMore} from 'vux'
  import MessageContent from '../../components/MessageContent'

  const {mapState, mapMutations} = createNamespacedHelpers('uihChat')
  export default {
    name: 'message-body',
    components: {
      LoadMore,
      MessageContent
    },
    props: {
      user: {
        type: Object
      }
    },
    data () {
      return {
        loadMsg: '点击查看更多聊天消息'
      }
    },
    methods: {
      ...mapMutations([
        'clearMessage'
      ]),
      loadHistory () {
        let msgArr = ['无更多消息记录', '点击查看更多聊天消息']
        if (this.loadMsg === '' || this.loadMsg === msgArr[0]) return
        let hOri = this.$el.scrollHeight
        let top = this.$el.scrollTop
        this.loadMsg = ''
        this.$nextTick(() => {
          this.$el.scrollTo(0, top)
          this.uiCore.loadHistoryMessage(this.user).then((len) => {
            this.$nextTick(() => {
              let hNew = this.$el.scrollHeight
              if (len > 0) {
                this.loadMsg = msgArr[1]
              } else {
                this.loadMsg = msgArr[0]
              }
              this.$nextTick(() => {
                this.$el.scrollTo(0, hNew - hOri)
              })
            })
          })
        })
      },
      scroll2Pos () {
        this.$nextTick(() => {
          this.$nextTick(() => {
            this.$el.scrollTo(0, this.$el.scrollHeight)
          })
        })
      },
      updatePreviewList (val) {
        this.$refs.msgContent.imgList.push(val)
      }
    },
    watch: {
      user (newVal, oldval) {
        this.loadMsg = '点击查看更多聊天消息'
        this.clearMessage(oldval.jid)
        if (newVal.msgs.length < 1) {
          this.uiCore.loadHistoryMessage(newVal).then(() => {
            this.scroll2Pos()
          })
        }
      }
    },
    computed: {
      ...mapState([
        'uiCore'
      ])
    }
  }
</script>

<style lang="less">
  @import "../../style/common";
  @import "../../assets/css/message-body.css";
  .uih-chat-msg-body{
    .vux-loadmore{
      margin-top: 0;
      margin-bottom: -10px;
      .weui-loadmore__tips{
        top:0;
      }
    }
  }
  .load-img{
    width: 24px;
    height: 24px;
    margin:10px 20px 0 0;
  }
  .uih-chat-mine .content:before {
    content: '';
    position: absolute;
    top: -7px;
    right: 6px;
    z-index: 100;
    width: 0;
    height: 0;
    border-style: solid dashed dashed;
    border-color: #FFFFFF transparent transparent;
    overflow: hidden;
    border-width: 4px;
    transform: rotate(180deg);
  }
  .content:after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border-style: solid dashed dashed;
    border-color: #e2e2e2 transparent transparent;
    overflow: hidden;
    border-width: 5px;
    transform: rotate(180deg);
  }
  .uih-chat-user .content:after {
    left: 5px;
    top: -10px;
    border-top-color: #0d47a1;
  }
  .uih-chat-mine .content:after {
    right: 5px;
    top: -10px;
    border-top-color: #d0d4d9;
  }
  .file-content{
    width: 250px;
    height: 60px;
    margin: 5px 0;
    position: relative;
    background-color: #fafafa;
    .progress-bar{
      height: 100%;
      position: absolute;
      /* margin: 5px 0; */
      background-color: #0b58d8;
      /*width: 100%;*/ //随着下载变化
      opacity: 0.3;
    }
  }
</style>
