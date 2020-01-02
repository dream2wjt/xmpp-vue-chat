<template>
  <div class="uih-chat-panel-users">
    <search class="uih-chat-panel-search" v-model="keyword" position="absolute" top="100px" :auto-fixed="false" :auto-scroll-to-top="true" ref="search"></search>
    <div class="uih-chat-panel-user-content">
      <ul class="uih-chat-panel-user-list">
        <card v-for="(user,i) in users" v-show="isCardShow(user)" :user="user" :index="i" :key="user.id" :uType="uType" @item-click="userChoose" :ref="'card' + i"></card>
      </ul>
    </div>
  </div>
</template>

<script>
  import {Search} from 'vux'
  import Card from '../../components/PanelCard'
  import CardMixin from '../../mixin/CardMixin'
  import {createNamespacedHelpers} from 'vuex'
  const { mapState } = createNamespacedHelpers('uihChat')
  export default {
    name: 'chat-panel-users',
    components: {
      Search,
      Card
    },
    mixins: [CardMixin],
    props: {
      uType: {
        type: Number, // 0--address book; 1--contact
        default () {
          return 0
        }
      }
    },
    data () {
      return {
        users: [],
        keyword: ''
      }
    },
    mounted () {
      this.$root.$on('contactChoose', (jid) => {
        if (this.type === 0) { return }

        let idx = this.users.findIndex((item) => {
          return jid.split('/')[0] === item.jid.split('/')[0]
        })
        this.$nextTick(() => {
          setTimeout(() => {
            let curEle = this.$el.querySelector(`#chat${jid.split('@')[0]}`)
            curEle.scrollIntoViewIfNeeded()

            let refIdx = `card${idx}`
            this.$refs[refIdx][0].chattingUserChoose(this.users[idx].jid)
          }, 100)
        })
      })
    },
    computed: {
      ...mapState([
        'uiCore',
        'contacts',
        'addressBooks'
      ])
    },
    methods: {
      userChoose (index) {
        let lis = document.getElementsByClassName('uih-chat-panel-card')
        for (let i = 0; i < lis.length; i++) {
          if (i === index) {
            lis[i].className = 'uih-chat-panel-card uih-chat-user-active'
          } else {
            lis[i].className = 'uih-chat-panel-card'
          }
        }
        // if uType === 0 add user to contact
        if (this.uType === 0) {
          let jid = this.users[index].id + '@' + window.xmppdomain
          this.uiCore.addContact(jid, this.users[index].name)
          // route to contact list
          this.$root.$emit('headerChange', '1')
        }
      }
    },
    watch: {
      uType (val) {
        if (val === 0) {
          this.users = this.addressBooks
        } else if (val === 1) {
          this.users = this.contacts
          this.$nextTick(() => { // default select the one
            if (this.users.length > 0) {
              this.$refs.card0[0].chattingUserChoose(this.users[0].jid)
            }
          })
        } else {
          return []
        }
      }
    },
    destroyed () {
      this.$root.$off('contactChoose')
    }
  }
</script>

<style lang="less">
  @import "../../style/common";

  .uih-chat-panel-users {
    height:100%;
    width: 100%;
    box-sizing: border-box;
    border-right: solid 1px #DEDEDE;
    .weui-search-bar {
      height: 40px;
      padding: 6px 12px;
      .weui-search-bar__label{
        border-radius: 100px;
        text-align: right;
        span{
          display: none;
        }
      }
      .weui-search-bar__form{
        background-color: #ffffff;
        border-radius: 100px;
        &::after{
          display: none;
        }
      }
    }
    .uih-chat-panel-user-content {
      height: calc(~"100% - 40px");
      display: flex;
      overflow-y: auto;
      overflow-x: hidden;
      background: #f5f7fa;
      /*滚动条样式*/
      &::-webkit-scrollbar {/*滚动条整体样式*/
        width: 10px;     /*高宽分别对应横竖滚动条的尺寸*/
        /*height: 4px;*/
        background-color: #f5f7fa;
        box-shadow: inset 1px 0 0 0 #d0d4d9;
      }
      &::-webkit-scrollbar-button {/*滚动条里面小方块*/
        display: none;
      }
      &::-webkit-scrollbar-thumb{
        background:#d0d4d9;
      }
      .uih-chat-panel-user-list {
        width: 100%;
        height: 100%;
        .uih-chat-panel-card{
          width: 100%;
          padding-left: 15px;
          .uih-chat-name-time {
            .msg-time {
              display: none;
            }
          }

          .uih-chat-panel-body {
            .msg-num-mb {
              display: none;
            }
          }
        }
        .uih-chat-user-active {
          background: #fffde6;
          box-shadow: inset 2px 0 0 0 #0d47a1, inset 0 -1px 0 0 #dce2e6;
        }
      }
    }
  }
</style>
