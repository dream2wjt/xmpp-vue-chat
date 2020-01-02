<template>
  <div class="uih-chat-conversation">
    <conversation-panel v-if="bShow === 'panel'" @on-item-click="OnChatUserChoose"></conversation-panel>
    <conversation-window v-if="bShow === 'window'" :contactId="curJid.split('@')[0]" :name="chattingUser.name"/>
  </div>
</template>

<script>
  import conversationPanel from './ConversationPanel'
  import conversationWindow from './ConversationWindow'
  import {createNamespacedHelpers} from 'vuex'

  const {mapState, mapMutations} = createNamespacedHelpers('uihChat')

  export default {
    name: 'conversation-mix',
    components: {
      conversationPanel,
      conversationWindow
    },
    data () {
      return {
        bShow: localStorage.getItem('uihChatShowWindow') || 'panel',
        curJid: ''
      }
    },
    computed: {
      ...mapState([
        'chattingUser',
        'keepAlive'
      ])
    },
    methods: {
      ...mapMutations([
        'clearMessage'
      ]),
      OnChatUserChoose (jid) {
        this.curJid = jid
        this.bShow = 'window'
        this.$route.query.title = `与${this.chattingUser.name}消息`
        this.$emit('on-item-click', this.chattingUser)
        localStorage.setItem('uihChatShowWindow', this.bShow)
      }
    },
    beforeRouteLeave (to, from, next) {
      if (to.path.startsWith('/http')) {
        next(false)
        let src = to.path.replace('/', '')
        this.$router.push({path: '/showFile', query: {src}})
        return
      }
      if (to.path.includes('showFile')) {
        next()
        return
      }
      if (this.bShow === 'window') {
        this.bShow = 'panel'
        this.$route.query.title = `消息`
        localStorage.setItem('uihChatShowWindow', this.bShow)
        this.clearMessage(this.curJid)
        let index = this.keepAlive.indexOf('conversation-mix')
        if (index >= 0) {
          this.keepAlive.splice(index, 1)
        }
        next(false)
      } else {
        if (!this.keepAlive.includes('conversation-mix')) {
          this.keepAlive.push('conversation-mix')
        }
        next()
      }
    }
  }
</script>

<style lang="less">

  .uih-chat-conversation {
    width: 100%;
    height: 100%;
  }
</style>
