/**
 * @name VueJS vChatScroll (vue-chat-scroll)
 * @description Monitors an element and scrolls to the bottom if a new child is added
 * @author Theodore Messinezis <theo@theomessin.com>
 * @file v-chat-scroll  directive definition
 */
const scrollToBottom = el => {
  el.scrollTop = el.scrollHeight
}
const vChatScroll = {
  bind: (el, binding) => {
    let timeout
    let scrolled = false

    el.addEventListener('scroll', e => {
      if (timeout) window.clearTimeout(timeout)
      timeout = window.setTimeout(function () {
        scrolled = el.scrollTop + el.clientHeight + 1 < el.scrollHeight
      }, 200)
    });

    (new MutationObserver(e => {
      let config = binding.value || {}
      let pause = config.always === false && scrolled
      if (pause || e[e.length - 1].addedNodes.length !== 1) return
      scrollToBottom(el)
    })).observe(el, {childList: true})
  },
  inserted: scrollToBottom,
  update: scrollToBottom
}

/**
 *
 * 拖动元素
 * @param 移动元素id
 */
const drag = {
  bind: function (el, binding) {
    let mouseDownX, mouseDownY, initX, initY, docOnmousemove, docOnmouseup
    var flag = false
    var isMoving = false

    el.onmousedown = function (e) {
      var obj = document.getElementById(binding.value)// 移动目标元素
      // 表示鼠标已按下
      flag = true

      // 鼠标按下时的鼠标所在的X，Y坐标
      mouseDownX = e.clientX
      mouseDownY = e.clientY

      // 初始位置的X，Y 坐标
      initX = obj.offsetLeft
      initY = obj.offsetTop

      // 保存原来绑定在document的事件
      docOnmousemove = document.onmousemove
      docOnmouseup = document.onmouseup

      document.onmousemove = move
      document.onmouseup = obj.onMouseOut = stop

      function move (e) {
        if (flag && !isMoving) {
          obj.style.left = parseInt(e.clientX) - parseInt(mouseDownX) + parseInt(initX) + 'px'
          obj.style.top = parseInt(e.clientY) - parseInt(mouseDownY) + parseInt(initY) + 'px'

          isMoving = true
          setTimeout(function () {
            isMoving = false
          }, 10)
        }
        return false
      }

      function stop () {
        flag = false
        document.onmousemove = docOnmousemove  // 原来的事件回复绑定
        document.onmouseup = docOnmouseup
      }

      return false// 可以防止在拖动的时候选中文本
    }
  }
}

const typ = ['marginTop', 'marginLeft']
var rangeN = 3
var timeout = 90

function _shake (el) {
  const range = Math.floor((Math.random() - 0.5) * rangeN)
  const typN = Math.floor(Math.random() * typ.length)
  el['style'][typ[typN]] = '' + range + 'px'
  el['style']['-webkit-transition-duration'] = '60'

  el.shakeTimer = setTimeout(function () {
    _shake(el)
  }, timeout)
}

const shake = {
  update: function (el, binding) {
    if (el.shakeTimer) {
      clearTimeout(el.shakeTimer)
    }
    if (!!binding.value || binding.value > 0) {
      _shake(el)
    }
  }
}

/**
 * 闪烁动画
 * @type {{}}
 */
const flashing = {
  bind: function (el, binding) {
    if (el.shakeTimer) {
      clearTimeout(el.shakeTimer)
    }
    if (!!binding.value || binding.value > 0) {
      _flashing(el)
    }
  }
}

const press = {
  inserted (element, binding, vnode) {
    let self = vnode.context
    // let startTx, startTy
    let startTy

    element.addEventListener('touchstart', function (e) {
      // 用bind时，vue还没插入到dom,故dom获取为 undefine，用 inserted 代替 bind,也可以开个0秒的定时器
      self.sendVoice = true
      self.startEvt()
      // console.log('start')
      let touches = e.touches[0]
      // startTx = touches.clientX
      startTy = touches.clientY
      e.preventDefault()
    }, false)
    element.addEventListener('touchend', function (e) {
      let touches = e.changedTouches[0]
      let distanceY = startTy - touches.clientY
      if (distanceY > 50) {
        console.log('取消发送信息')
      } else {
        self.endEvt()
      }
      self.sendVoice = false
      self.isSend = true
      // console.log('end')
      e.preventDefault()
    }, false)
    element.addEventListener('touchmove', function (e) {
      let touches = e.changedTouches[0]
      // let endTx = touches.clientX
      let endTy = touches.clientY
      // let distanceX = startTx - endTx
      let distanceY = startTy - endTy

      if (distanceY > 50) {
        self.isSend = false
      } else {
        self.isSend = true
      }
      // 阻断事件冒泡 防止页面被一同向上滑动
      e.preventDefault()
    }, false)
  }
}
const more = {
  bind (element, binding) {
    let startTx, startTy
    element.addEventListener('touchstart', function (e) {
      let msgMore = document.getElementById('msg-more')
      let touches = e.touches[0]
      startTx = touches.clientX
      startTy = touches.clientY

      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        // 控制菜单的位置
        msgMore.style.left = ((startTx - 18) > 180 ? 180 : (startTx - 18)) + 'px'
        msgMore.style.top = (element.getBoundingClientRect().top - 33) + 'px'
        msgMore.style.display = 'block'
        element.style.backgroundColor = '#e5e5e5'
      }, 500)
    }, false)
    element.addEventListener('touchmove', function (e) {
      let touches = e.changedTouches[0]
      let disY = touches.clientY
      if (Math.abs(disY - startTy) > 10) {
        clearTimeout(this.timer)
      }
    }, false)
    element.addEventListener('touchend', function (e) {
      clearTimeout(this.timer)
    }, false)
  }
}

function _flashing (el) {
  if (el.style.visibility && el.style.visibility === 'visible') {
    el.style.visibility = 'hidden'
  } else {
    el.style.visibility = 'visible'
  }
  el.shakeTimer = setTimeout(function () {
    _flashing(el)
  }, 800)
}

export default {
  'chat-scroll': vChatScroll,
  'drag': drag,
  'shake': shake,
  'flashing': flashing,
  press,
  more
}
