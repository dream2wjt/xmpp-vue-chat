<template>
  <div class="uih-chat-mobile-body-msg">
    <scroller :on-refresh="refresh"
              ref="scroller"
              height="100%"
              loading-layer-color="#999999"
              refresh-text=''>
      <p class="uih-chat-body-msg-load" v-show="isloading">
        <inline-loading></inline-loading>
      </p>
      <div ref="msgBody" class="uih-chat-msg-body" @click="MenuOutsideClick">
        <message-content :user="user" @reset-scroller="scroll2Pos" ref="msgContent"></message-content>
      </div>
    </scroller>
    <!-- 好友消息 -->
    <!--<span class="msg-more" id="msg-more"><ul>-->
                    <!--<li>复制</li>-->
                    <!--<li>转发</li>-->
                    <!--<li>收藏</li>-->
                    <!--<li>删除</li>-->
                <!--</ul></span>-->
  </div>
</template>

<script>
  import {InlineLoading} from 'vux'
  import {createNamespacedHelpers} from 'vuex'
  import MessageContent from '../../components/MessageContent'

  const {mapState} = createNamespacedHelpers('uihChat')
  export default {
    name: 'message-body',
    components: {
      InlineLoading,
      MessageContent
    },
    props: {
      user: {
        type: Object
      }
    },
    data () {
      return {
        isloading: true,
        content: null,
        oriH: null
      }
    },
    created () {
      if (!this.user.msgs || this.user.msgs.length > 1) { return }

      this.uiCore.loadHistoryMessage(this.user).then((len) => {
        this.isloading = false
        if (len < 1) { this.$vux.toast.text('没有更多消息', 'middle') }
      })
    },
    mounted () {
      this.content = this.$el.querySelector('._v-content')
      this.oriH = document.body.clientHeight
      if (window.navigator.userAgent.includes('Android')) {
        window.onresize = () => {
          if (!this.oriH) return // 防止连续触发
          let thisH = document.body.clientHeight
          // 组件scrollBy方法在某些情况滚动时位置会出错，因此每次触发事件时，先计算位置，再使用scrollTo
          let newPos = this.$refs.scroller.getPosition().top + this.oriH - thisH
          this.oriH = null
          this.$refs.scroller.resize()
          this.$refs.scroller.scrollTo(0, newPos, false)
          this.$nextTick(() => {
            this.oriH = thisH
          })
        }
      }
      if (this.user.msgs && this.user.msgs.length > 0) {
        for (let i = 0; i < this.user.msgs.length; i++) {
          this.$refs.msgContent.addPreviewList(this.user.msgs[i])
        }
        this.isloading = false
      }
      // 既无远程消息或本地消息，6s后将loading取消并提示
      setTimeout(() => {
        if (this.isloading) {
          this.isloading = false
          this.$vux.toast.text('没有更多消息', 'middle')
        }
      }, 6000)
    },
    destroyed () {
      if (window.onresize) {
        window.onresize = null
      }
    },
    methods: {
      MenuOutsideClick (e) {
        let container = document.querySelectorAll('.uih-chat-text')
        // let msgMore = document.getElementById('msg-more')
        if (!e.target.className.includes('uih-chat-text')) {
          // msgMore.style.display = 'none'
          container.forEach((item) => {
            item.style.backgroundColor = '#fff'
            return 0
          })
        }
      },
      refresh (resolve) {
        this.$nextTick(() => {
          this.uiCore.loadHistoryMessage(this.user).then((len) => {
            if (len < 1) { this.$vux.toast.text('没有更多消息', 'middle') }

            this.$nextTick(() => {
              resolve()
            })
          })
        })
      },
      scroll2Pos (y) {
        // 滚动至y处，无参数时默认滚动至底部
        this.$nextTick(() => {
          let newH = this.content.scrollHeight
          let animate = y === undefined
          // scroller组件的mounted阶段，会调用resize方法，监听元素变化时，事件触发是在created和mounted之间，
          // 因此等待50ms，等待至moutuned加载，此时组件内部会更新滚动条高度，更新后才能滚动至正确位置
          setTimeout(() => {
            this.$refs.scroller.scrollTo(0, newH, animate)
          }, 100)
        })
      },
      updatePreviewList (val) {
        this.$refs.msgContent.imgList.push(val)
      }
    },
    computed: {
      ...mapState([
        'platform',
        'uiCore'
      ])
    }
  }
</script>

<style lang="less">
  @import "../../style/common";
  @import "../../assets/css/message-body.css";

  .uih-chat-mobile-body-msg {
    height: 100%;

    .uih-chat-body-msg-load {
      text-align:center;
      margin-top: 15px;
    }
    .weui-loading {
      width: 32px;
      height: 32px;
    }
  }
  .load-img{
    width: 24px;
    height: 24px;
    margin:10px 20px 0 0;
  }
  .uih-chat-msg-body{
    padding: 20px 20px 0 20px;
    .uih-chat-text{
      margin-top: 5px;
      margin-bottom: 10px;
    }
    .msg-more{
      display: none;
      z-index: 150;
      position: fixed;
    }
    .content{
      border:0 !important;
      border-radius:4px;
      max-width: 250px;
      img{
        max-width: 150px;
        max-height: 150px;
      }
      &:after{
        content: '';
        position: absolute;
        width: 0;
        height: 0;
      }
    }

    .uih-chat-mine .content{
      background-color: #303a60;
      border-radius: 4px 4px 4px 4px ;
      color: @bgContent;
      /*&:after{*/
        /*top: 8px;*/
        /*border: 6px solid transparent;*/
        /*right: -12px;*/
        /*transform: rotate(180deg);*/
        /*border-right-color: #3399ff;*/
      /*}*/
      a,a:hover{
        color: @bgContent;
      }
    }
    .uih-chat-user .content{
      color: @gray33;
      font-size: @font14;
      background-color: #ededed;
      border-radius: 4px 4px 4px 4px ;
      /*&:after{*/
        /*top: 8px;*/
        /*border: 6px solid transparent;*/
        /*left: -12px;*/
        /*transform: rotate(0deg);*/
        /*border-right-color: #ebf5ff;*/
      /*}*/
    }
  }
</style>
