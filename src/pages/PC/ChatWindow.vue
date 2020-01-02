<template>
  <div class="uih-chat-MainWindow">
    <div class="uih-chat-MainWindow-panel">
      <!--<panel :list="[]"></panel>-->
      <chat-panel-head style="height: 64px;" :list="['addressBook', 'contact']" :selected="1" @on-item-click="onHeaderChange"></chat-panel-head>
      <chat-panel-users style="height: 600px;" :uType="headerIdx"></chat-panel-users>
    </div>
    <div class="uih-chat-MainWindow-window">
      <ChatArea v-if="chattingUser"></ChatArea>
    </div>
  </div>
</template>

<script>
  import ChatPanelHead from './ChatPanelHead'
  import ChatPanelUsers from './ChatPanelUsers'
  import ChatArea from './ChatArea'
  import {createNamespacedHelpers} from 'vuex'
  const { mapState } = createNamespacedHelpers('uihChat')

  export default {
    name: 'chat-window',
    components: {
      ChatPanelHead,
      ChatPanelUsers,
      ChatArea
    },
    data () {
      return {
        headerIdx: 0 // 0-address book; 1-contact; 2-group
      }
    },
    computed: {
      ...mapState(['chattingUser'])
    },
    methods: {
      onHeaderChange (index) {
        this.headerIdx = index
      }
    }
  }
</script>

<style lang="less">
  @import '../../style/common';

  .uih-chat-MainWindow {
    position: relative;
    /*margin-left: 250px;*/
    display: inline-flex;
    /*top:100px;*/
    width: 900px;
    height: 664px;
    box-shadow: 2px 7px 15px 5px @grayDE;
    background-color: @bgContent;
  }
  .uih-chat-MainWindow-panel {
    height: 100%;
    width: 30%;
  }

  .uih-chat-MainWindow-window {
    height: 100%;
    width: 70%;
  }
</style>
