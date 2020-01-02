import {isIOS} from '../service/const'
export default {
  data () {
    return {
      tempEvt: null, // 若原先有默认事件，存入此变量，退出时恢复
      isManual: true,
      spManual: false
    }
  },
  mounted () {
    this.addKeyboardEvents()
    this.keyboardHandler()
  },
  methods: {
    addKeyboardEvents () {
      // IOS和安卓触发事件不同，进行不同处理
      if (isIOS) {
        let fTime, tTime
        this.tempEvt = document.body.onscroll
        document.body.onscroll = e => {
          if (this.isManual || this.spManual) {
            let body = document.body
            if (!body.scrollTop || body.scrollTop === body.scrollHeight) return
            if (this.spManual) {
              body.scrollTop = body.scrollHeight - window.innerHeight - 5
              this.spManual = false
              return
            }
            body.scrollTop = body.scrollHeight
            if (!fTime) {
              fTime = setTimeout(() => {
                this.isManual = false
                clearTimeout(fTime)
                fTime = null
              }, 50)
            }
            if (!tTime) {
              tTime = setTimeout(() => {
                this.isManual = true
                clearTimeout(tTime)
                tTime = null
              }, 150)
            }
          }
        }
      }
    },
    rmvKeyboardEvents () {
      if (isIOS) {
        document.body.onscroll = this.tempEvt
      }
    },
    keyboardHandler () {
      if (isIOS) {
        this.$refs.chatContent.addEventListener('input', () => {
          let toTop = document.body.scrollHeight - window.innerHeight
          if (document.body.scrollTop !== toTop - 5) {
            this.spManual = true
            document.body.scrollTop = toTop
          }
        })
      }
    }
  },
  beforeDestroy () {
    this.rmvKeyboardEvents()
  }
}
