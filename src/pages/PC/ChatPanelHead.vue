<template>
  <div class="uih-chat-panel-header">
    <button-tab style="height: 100%">
      <button-tab-item v-for="(item,index) in list" :selected="index===selected" :key='item.id' @on-item-click="onItemClick" :ref="'headTab' + index">
        <img :src="require('../../../src/assets/' + item + (selectIndex===index?'_select':'') + '.svg')"/>
      </button-tab-item>
    </button-tab>
  </div>
</template>

<script>
  import { ButtonTab, ButtonTabItem } from 'vux'

  export default {
    name: 'chat-panel-head',
    components: {
      ButtonTab,
      ButtonTabItem
    },
    data () {
      return {
        selectIndex: 0
      }
    },
    props: {
      list: {
        type: Array,
        default () {
          return ['addressBook', 'contact', 'group']
        }
      },
      selected: {
        type: Number,
        default () {
          return 0
        }
      }
    },
    created () {
      this.onItemClick(this.selected)
    },
    mounted () {
      // listen header tab change from external
      this.$root.$on('headerChange', (index) => {
        if (this.$refs.hasOwnProperty('headTab' + index)) {
          let idx = 'headTab' + index
          this.$refs[idx][0].onItemClick()
        }
      })
    },
    methods: {
      onItemClick (index) {
        this.selectIndex = index
        this.$emit('on-item-click', index)
      }
    },
    destroyed () {
      this.$root.$off('headerChange')
    }
  }
</script>

<style lang="less">
  @import "../../style/common";
  .uih-chat-panel-header {
    width: 100%;
    height: 100%;
    .vux-button-tab-item{
      height:100%;
      border-radius: 0 !important;
      color:#d9d9d9;
      background: #0d47a1 !important;
      &:after{
        border: 0!important;
      }
    }
    img{
      margin-top: 12px;
    }
  }
</style>
