<template>
  <div class="chat-way" v-press>
    <!--v-press>-->
    <div :class="{'chat-say':true,'say-active':sendVoice}">
      <span class="one">按住 说话</span>
      <span class="two">松开 结束</span>
    </div>

    <div class="recording" v-show="sendVoice">
      <div class="recording-voice" v-show="isSend">
        <div class="voice-inner">
          <div class="voice-icon"></div>
          <div class="voice-volume">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <p>手指上划,取消发送</p>
      </div>
      <div class="recording-cancel" v-show="!isSend">
        <div class="cancel-inner"></div>
        <p>松开手指,取消发送</p>
      </div>
    </div>
  </div>
</template>

<script>
  import {isWechat} from '../service/const'

  export default {
    name: 'send-voice-btn',
    data () {
      return {
        sendVoice: false,
        isSend: true,
        voice: {}
      }
    },
    mounted () {
      window.wx.config({
        debug: false,
        appId: 'wxf8b4f85f3a794e77',
        timestamp: parseInt(new Date().getTime() / 1000),
        nonceStr: 'g8WZcC0q3iZFVSCm',
        signature: '882a19e91bef30cd94e66c72e27186ef11987909',
        jsApiList: [
          'checkJsApi',
          'onMenuShareTimeline',
          'onMenuShareAppMessage',
          'onMenuShareQQ',
          'onMenuShareWeibo',
          'onMenuShareQZone',
          'hideMenuItems',
          'showMenuItems',
          'hideAllNonBaseMenuItem',
          'showAllNonBaseMenuItem',
          'translateVoice',
          'startRecord',
          'stopRecord',
          'onVoiceRecordEnd',
          'playVoice',
          'onVoicePlayEnd',
          'pauseVoice',
          'stopVoice',
          'uploadVoice',
          'downloadVoice',
          'chooseImage',
          'previewImage',
          'uploadImage',
          'downloadImage',
          'getNetworkType',
          'openLocation',
          'getLocation',
          'hideOptionMenu',
          'showOptionMenu',
          'closeWindow',
          'scanQRCode',
          'chooseWXPay',
          'openProductSpecificView',
          'addCard',
          'chooseCard',
          'openCard'
        ]
      })
      window.wx.ready(function () {
      })
      window.wx.error(function (res) {
        alert(res.errMsg)
      })
    },
    methods: {
      startEvt () {
        if (isWechat) {
          window.wx.startRecord({
            cancel: function () {
              alert('用户拒绝')
            }
          })
        } else {
          let nav = window.navigator
          nav.getUserMedia = nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia
          console.log(nav)
          nav.getUserMedia({
            audio: true
          }, (stream) => {
            console.log(stream)
          }, err => {
            console.log(err)
          })
        }
      },
      endEvt () {
        if (isWechat) {
          window.wx.stopRecord({
            success: function (res) {
              this.voice.localId = res.localId
              console.log(this.voice)
            },
            fail: function (res) {
              alert(JSON.stringify(res))
            }
          })
        }
      }
    }
  }
</script>

<style lang="less" scoped>
  .recording{
    position: fixed;
  }
</style>
