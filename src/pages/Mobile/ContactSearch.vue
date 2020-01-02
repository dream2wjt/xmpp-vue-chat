<template>
  <div class="audit-search">
    <div class="left-input-box">
      <img class="search-icon" src="../../assets/search.svg"/>
      <input v-model="name"
             class="search-input"
             placeholder="联系人搜索"
             @focus="$refs.searchPage.showPage()"/>
      <icon type="clear" class="clear-icon"
            v-show="name"
            @click.native="onClearKeyWord"></icon>
    </div>

    <search-page v-transfer-dom
                 :value="name"
                 type="chat"
                 :user-refid="userNodeJid"
                 @submit="submit"
                 ref="searchPage">
    </search-page>
  </div>
</template>

<script>
  import {createNamespacedHelpers} from 'vuex'
  import {TransferDom, Icon} from 'vux'
  import SearchPage from './SearchPage'
  const { mapGetters } = createNamespacedHelpers('uihChat')

  export default {
    components: {SearchPage, Icon},
    directives: {TransferDom},
    name: 'contact-search',
    data () {
      return {
        name: ''
      }
    },
    methods: {
      submit (val) {
        this.name = val.search
        this.$emit('submit', this.name)
      },
      isActive () {
        return this.$refs.searchPage.isActive()
      },
      deActive () {
        this.$refs.searchPage.hidePage()
      },
      onClearKeyWord () {
        this.name = ''
        this.$emit('submit', this.name)
      }
    },
    computed: {
      ...mapGetters([
        'userNodeJid'
      ])
    }
  }
</script>

<style lang="less">
  @import "../../style/theme";
  @import "../../style/common";

  .audit-search {
    width: 100%;
    padding: 8px 15px;
    height: 100%;
    background-color: @popup-background-color !important;
    display: flex;
    align-items: center;

    &:after {
      content: " ";
      position: absolute;
      left: 0;
      top: 50px;
      right: 0;
      height: 1px;
      border-bottom: 1px solid #C7C7C7;
      color: #C7C7C7;
      -webkit-transform-origin: 0 100%;
      transform-origin: 0 100%;
      -webkit-transform: scaleY(0.5);
      transform: scaleY(0.5);
    }

    .left-input-box {
      height: 35px;
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;

      .search-icon {
        position: relative;
        width: 35px;
        height: 20px;
        left: -2px;
        top: 1px;
      }

      .search-input {
        font-size: 14px;
        height: 35px;
        line-height: 35px;
        width: 100%;
        border: none;
        outline: none;
      }

      .clear-icon {
        margin-right: 5px;
      }
    }
  }
</style>
