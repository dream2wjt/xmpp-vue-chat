<template>
  <div class="page-login">
    <group gutter="0">
      <x-input v-model="username"
               title="账号"
               placeholder="请输入用户名"></x-input>
      <x-input v-model="password"
               title="密码"
               type="password"
               placeholder="请输入密码"
               :show-clear="false"></x-input>
    </group>

    <div style="margin: 20px 10px">
      <x-button type="primary" @click.native="login()">登录</x-button>
    </div>
  </div>
</template>

<script>
  import {Group, XInput, XButton} from 'vux'
  import {createNamespacedHelpers} from 'vuex'
  const { mapState, mapMutations } = createNamespacedHelpers('uihChat')

  export default {
    name: 'login',
    components: {
      Group,
      XInput,
      XButton
    },
    mounted () {
      document.body.onclick = () => {
        let dom = document.getElementById('app')
        if (dom) dom.setAttribute('style', 'display: -webkit-box')
      }
    },
    data () {
      return {
        username: '',
        password: ''
      }
    },
    computed: {
      ...mapState([
        'uiCore',
        'contacts',
        'platform'
      ])
    },
    methods: {
      ...mapMutations([
        'updateAddressBooks',
        'updateContacts',
        'updateCurUser'
      ]),
      login () {
        let userJid = ''
        if (this.username.match(/@(.*)$/)) {
          userJid = this.username.toLowerCase()
        } else {
          userJid = this.username.toLowerCase() + '@' + window.xmppdomain
        }
        // log in user info
        let lgInfo = {
          jid: userJid,
          name: '我',
          avatar: require('../../assets/default.png')
        }
        this.uiCore.login({jid: userJid, pass: this.password}, (response) => {
          if (response.state !== 'success') {
            console.log(response.content)
            return
          }
          // get contact list
          this.uiCore.getContacts((contacts) => {
            this.updateContacts(contacts)
            this.platform === 'pc' ? this.$router.push('/chatwin') : this.$router.push('/chatpanel')
          })
          // send presence
          this.uiCore.sendPresence('online')
          this.updateCurUser(lgInfo)
        })
        // get address book list
        this.uiCore.getAddressBook({id: lgInfo.jid, name: lgInfo.name}, (addressBooks) => {
          this.updateAddressBooks(addressBooks)
        })
      }
    }
  }
</script>
<style lang="less">
</style>

