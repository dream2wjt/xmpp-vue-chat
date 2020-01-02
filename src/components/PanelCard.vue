<template>
  <li  @click="chattingUserChoose(user.jid)" :class="{'uih-chat-panel-card': true, }" :id="id">
    <div class="uih-chat-panel-avatar">
      <img :src="user.avatar" alt="">
      <badge class="msg-num-pc" v-if="user.msgPrompt > 0" :text="user.msgPrompt > 99 ? '99+' : user.msgPrompt"></badge>
    </div>
    <div class="uih-chat-panel-body">
      <div class="uih-chat-name-time">
        <span class="uih-chat-panel-userName">{{user.name}}</span>
        <span class="msg-time">{{calcTime(user.msgTime)}}</span>
      </div>
      <div class="uih-chat-lsMsg-num">
        <p v-html="msgTrans(user.lastMsg)"></p>
        <badge class="msg-num-mb" v-if="user.msgPrompt > 0" :text="user.msgPrompt > 99 ? '99+' : user.msgPrompt"></badge>
      </div>
    </div>
  </li>
</template>

<script>
  import { Badge } from 'vux'
  import {PubEvent} from '../service/eventEngine'
  import {getIdFromJid} from '../service/const'
  import deepCopy from 'deep-copy'
  import {createNamespacedHelpers} from 'vuex'
  const { mapState, mapMutations } = createNamespacedHelpers('uihChat')
  export default {
    name: 'card',
    components: {
      Badge
    },
    props: {
      user: {
        type: Object
      },
      index: {
        type: Number
      },
      uType: {
        type: Number, // 0--address book; 1--contact
        default () {
          return 0
        }
      }
    },
    created () {
      if (this.uType === 1 || this.platform === 'mobile') {
        if (getIdFromJid(this.user.jid) === 'chatadmin') { return this.user }

        this.uiCore.queryAddressBook(getIdFromJid(this.user.jid), (contact) => {
          for (let p in contact) {
            if (contact.hasOwnProperty(p)) { this.user[p] = contact[p] }
          }
          return this.user
        })
      } else {
        return this.user
      }
    },
    computed: {
      ...mapState([
        'platform',
        'uiCore'
      ]),
      id () {
        return this.user.id ? `chat${this.user.id}` : `chat${getIdFromJid(this.user.jid)}`
      }
    },
    methods: {
      ...mapMutations([
        'updateChattingUser'
      ]),
      chattingUserChoose (jid) {
        let cpUser = deepCopy(this.user)
        PubEvent.publishOperateUserChoose(cpUser)

        if (jid) {
          this.updateChattingUser(jid)
        }

        this.$emit('item-click', this.index)
      },
      msgTrans (msgOri) {
        return msgOri.replace(/&amp;/g, '&').replace(/&nbsp;/g, '').replace(/&lt;.*?&gt;/g, ' ').replace(/<.*?>/g, ' ')
      },
      calcTime (time) {
        if (!time) return time
        let the = new Date(time)
        let theH = the.getHours()
        let theM = (the.getMinutes() < 10 ? '0' : '') + the.getMinutes()
        let today = new Date()
        if (the.toLocaleDateString() === today.toLocaleDateString()) {
          return theH + ':' + theM
        }
        let yesterday = new Date(today - 1000 * 3600 * 24)
        if (the.toLocaleDateString() === yesterday.toLocaleDateString()) {
          return '昨天 '
        }
        if (the.getFullYear() !== today.getFullYear()) {
          return the.getFullYear() + '-' + (the.getMonth() + 1) + '-' + the.getDate()
        }
        return (the.getMonth() + 1) + '-' + the.getDate()
      }
    }
  }
</script>

<style lang="less">
  @import "../style/common";

  .uih-chat-panel-card {
    display: inline-flex;
    box-sizing: border-box;
    width: calc(~"100% - 30px");
    height: 77px;
    padding: 17px 0;
    cursor: pointer;
    box-shadow: 0px -0.5px 0px 0px #ededed inset;

    &:hover {
      background-color: rgba(244,244,244,.9);
    }

    .uih-chat-panel-avatar {
      width: 42px;
      height: 42px;
      img {
        width: 100%;
        height: 100%;
        border-radius: 100%;
      }
      .msg-num-pc {
        position: relative;
        top: -50px;
        left: 30px;
      }
    }
    .uih-chat-panel-body {
      width: calc(~"100% - 57px");
      padding-left: 15px;
      display: block;
    }
    .uih-chat-name-time {
      width: 100%;

      .msg-time {
        float: right;
        font-size: @font12;
        color:@gray99;
        width: auto;
        text-align: right;
      }
    }
    .uih-chat-panel-userName {
      display: inline-block;
      width: 190px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: @font16;
      color: @gray33;
    }

    .uih-chat-lsMsg-num {
      width:100%;
      p {
        width: 258px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 14px;
        color:@gray99;
      }
      .msg-num-mb{
        position: relative;
        float: right;
        top: -16px;
        clear:both;
      }
    }
  }
</style>
