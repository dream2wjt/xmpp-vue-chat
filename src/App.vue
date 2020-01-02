<template>
  <div :id="id">
    <transition name="router-fade" mode="out-in">
      <keep-alive :exclude="keepAlive">
        <router-view v-if="$route.meta.keepAlive"></router-view>
      </keep-alive>
    </transition>
    <transition name="router-fade" mode="out-in">
      <router-view v-if="!$route.meta.keepAlive"></router-view>
    </transition>
  </div>
</template>

<script>
  import UICore from './service/UIInterfaceCore.js'
  import './assets/css/base.css'
  import './assets/css/im.css'
  import {createNamespacedHelpers} from 'vuex'
  import {isPC} from './service/const'

  const { mapState, mapMutations } = createNamespacedHelpers('uihChat')

  export default {
    name: 'app',
    data () {
      return {
        id: ''
      }
    },
    computed: {
      ...mapState(['keepAlive'])
    },
    methods: {
      ...mapMutations([
        'updatePlatform',
        'updateUiCore',
        'addMessage',
        'loadMessage',
        'updateContact',
        'deleteContact'
      ])
    },
    created () {
      let uiCore = new UICore({boshUrl: window.boshUrl, xmppDomain: window.xmppdomain})
      // register handle
      uiCore.addMessageListener(this.addMessage, this.loadMessage)
      uiCore.addContactListener(this.updateContact, this.deleteContact)
      this.updateUiCore(uiCore)
    },
    mounted () {
      if (isPC) {
        this.id = 'app'
        this.updatePlatform('pc')
      } else {
        this.id = 'appM'
        this.updatePlatform('mobile')
      }
    },
    destroyed () {
      // remove all subscriptions
      window.PubSub.clearAllSubscriptions()
    }
  }
</script>

<style lang="less">

  #app {
    position: fixed;
    display: -webkit-box;
    -webkit-box-pack: center;
    -webkit-box-align: center;
    width: 900px;
    height: 664px;
    margin: -332px 0 0 -450px;
    top: 50%;
    left: 50%;
    z-index: 80;
  }
  #appM {
    position: fixed;
    display: -webkit-box;
    -webkit-box-pack: center;
    -webkit-box-align: center;
    width: 100%;
    height: 100%;
    margin: auto;
    z-index: 80;
  }

</style>
