<template>
  <div class="uih-chat-panel-users">
    <contact-search class="uih-chat-panel-search" @submit="nameSubmit"></contact-search>
    <div class="uih-chat-panel-user-content">
      <ul class="uih-chat-panel-user-list">
        <card v-for="(user,i) in contacts" v-show="isCardShow(user)" :user="user" :index="i" :key="user.id" @item-click="userItemClick"></card>
      </ul>
    </div>
  </div>
</template>

<script>
  // import {Search} from 'vux'
  import ContactSearch from './ContactSearch'
  import Card from '../../components/PanelCard'
  import {createNamespacedHelpers} from 'vuex'
  import CardMixin from '../../mixin/CardMixin'
  const { mapState, mapMutations } = createNamespacedHelpers('uihChat')
  export default {
    name: 'conversation-panel',
    components: {
      ContactSearch,
      Card
    },
    mixins: [CardMixin],
    created () {
      this.updateChattingUser(null)
      let _admin
      if (this.contacts[0].id === 'chatadmin') {
        _admin = this.contacts.shift()
      }
      this.contacts.sort((itemA, itemB) => {
        // ios上即使chatadmin不参与排序，有时也会被排序项挤到最后一位，因此前面排除chatadmin
        if (itemB.id === 'chatadmin' || itemA.id === 'chatadmin') {
          return false
        }
        return itemB.msgTime - itemA.msgTime
      })
      if (_admin) this.contacts.unshift(_admin)
    },
    data () {
      return {
        keyword: ''
      }
    },
    computed: {
      ...mapState([
        'uiCore',
        'contacts'
      ])
    },
    methods: {
      ...mapMutations([
        'updateChattingUser'
      ]),
      nameSubmit (val) {
        this.keyword = val
      },
      userItemClick (index) {
        this.$emit('on-item-click', this.contacts[index].jid)
        // this.$router.push({path: '/dialogue', query: {loginId: this.contacts[index].jid.split('@')[0]}})
      }
    }
  }
</script>

<style lang="less">
  @import "../../style/common";

  .uih-chat-panel-users {
    height: 100%;
    width: 100%;

    .uih-chat-panel-search {
      box-sizing: border-box;
      height: 52px;
      /*<!--border-bottom: 1px solid @divider-color !important; !*no*!-->*/
    }

    .uih-chat-panel-user-content {
      height: calc(~"100% - 52px");
      display: flex;
      overflow-y: auto;
      overflow-x: hidden;
      background: @bgContent;
      /*滚动条样式*/
      /*&::-webkit-scrollbar {!*滚动条整体样式*!*/
        /*width: 10px;     !*高宽分别对应横竖滚动条的尺寸*!*/
        /*!*height: 4px;*!*/
        /*background-color: #f5f7fa;*/
        /*box-shadow: inset 1px 0 0 0 #d0d4d9;*/
      /*}*/
      /*&::-webkit-scrollbar-button {!*滚动条里面小方块*!*/
        /*display: none;*/
      /*}*/
      /*&::-webkit-scrollbar-thumb{*/
        /*background:#d0d4d9;*/
      /*}*/
      .uih-chat-panel-user-list {
        width: 100%;
        height: 100%;
        background: @bgContent;
        list-style: none;
        .uih-chat-panel-card{
          margin-right: 15px;
          margin-left: 15px;

          .uih-chat-panel-avatar {
            .msg-num-pc {
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
