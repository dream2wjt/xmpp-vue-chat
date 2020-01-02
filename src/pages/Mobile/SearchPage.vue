<template>
  <div class="search-page"
       v-show="show">
    <form class="search-area vux-1px-b"
          @submit.prevent="submit()"
          action=".">
      <img class="search-icon" src="../../assets/search.svg"/>
      <input v-model="curVal"
             ref="search"
             type="search"
             class="search-input"
             placeholder="联系人搜索"
             autocomplete="off"/>
      <icon type="clear" class="clear-icon"
            v-show="curVal"
            @click.native="onClearKeyWord">
      </icon>
      <span @click="submit">搜索</span>
    </form>
    <div class="history">
      <div class="history__title">
        <span>搜索历史</span>
        <icon type="android-close" size="18" class="closeIcon" @click="clearHistory"></icon>
      </div>

      <div v-for="record in searchHistory">
        <div class="history__item" @click="choose(record)">{{record}}</div>
      </div>
    </div>

  </div>
</template>

<script>
  import {Icon} from 'vux'
  import {createNamespacedHelpers} from 'vuex'
  const { mapState, mapMutations } = createNamespacedHelpers('uihChat')

  export default {
    name: 'search-page',
    components: {Icon},
    props: {
      placeholder: String,
      value: String,
      type: {
        required: true,
        type: String
      },
      userRefid: {
        required: true,
        type: String
      }
    },
    data () {
      return {
        show: false,
        curVal: ''
      }
    },
    computed: {
      ...mapState(['searchHistoryMap']),
      searchHistory () {
        if (this.searchHistoryMap[this.type] === undefined || this.searchHistoryMap[this.type][this.userRefid] === undefined) {
          return []
        } else {
          return this.searchHistoryMap[this.type][this.userRefid]
        }
      }
    },
    watch: {
      show: function (newVal, oldVal) {
        this.curVal = this.value
        this.$nextTick(() => {
          newVal ? this.$refs.search.focus() : this.$refs.search.blur()
        })
      }
    },
    methods: {
      submit () {
        this.addSearchHistory({type: this.type, userRefid: this.userRefid, record: this.curVal})
        this.hidePage()
        this.$emit('submit', {search: this.curVal})
        this.$refs.search.blur()
      },
      clearHistory () {
        this.clearSearchHistory({type: this.type, userRefid: this.userRefid})
      },
      choose (record) {
        this.hidePage()
        this.$emit('submit', {search: record})
        this.$refs.search.blur()
      },
      showPage () {
        this.show = true
      },
      hidePage () {
        this.show = false
      },
      isActive () {
        return this.show
      },
      onClearKeyWord () {
        this.curVal = ''
        this.$emit('submit', {search: this.curVal})
      },
      ...mapMutations([
        'addSearchHistory',
        'clearSearchHistory'
      ])
    },
    beforeRouteLeave (to, from, next) {
      if (this.show) {
        this.show = false
        next(false)
      } else {
        next()
      }
    }
  }
</script>

<style lang="less">
  @import "../../style/theme";
  @import "../../style/common";

  .search-page {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: @popup-background-color;
    z-index: 1000;  // 盖过tabbar

    .search-area {
      padding: 0 15px;
      display: flex;
      align-items: center;
      height: 46px;
      border-bottom: 1px solid @divider-color !important; /*no*/

      input {
        height: 24px;
        font-size: 14px;
        line-height: 24px;
        margin: 0 20px;
        flex: 1;
        border: none;
        outline: none;

        &::-webkit-search-cancel-button {
          display: none;
        }
      }

      span {
        font-size: 14px;
        text-align: right;
        color: @theme-color;
        letter-spacing: 2px;
      }
    }

    .history {
      padding: 0 15px;
    }

    .history__title {
      height: 50px;
      line-height: 50px;
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;

      span {
        flex: 1;
      }
    }

    .history__item {
      display: inline-block;
      background: #ededed;
      float: left;
      margin: 0 15px 15px 0;
      padding: 6px 15px;
      font-size: 14px;
      line-height: 20px;
      border-radius: 2px;
    }

    .clear-icon {
      margin-right: 20px;
    }
  }
</style>
