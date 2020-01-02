import {isPC, isIOS, MSG_TYPES} from '../service/const'

class EditorBase {
  constructor (textEditor) {
    this.editorEle = textEditor
    this.lastRange = null
    // 记录光标位置，表情插入至光标处
    if (isIOS) {
      // ios移动端不能自动触发blur
      document.body.ontouchstart = e => {
        if (!this.lastRange && !this.editorEle.contains(e.target)) {
          let selection = window.getSelection()
          if (this.editorEle.contains(selection.focusNode)) {
            this.lastRange = selection.getRangeAt(0)
          }
        }
      }
    } else {
      this.editorEle.addEventListener('blur', (e) => {
        let rangeAt = window.getSelection().getRangeAt(0)
        if (rangeAt) {
          this.lastRange = rangeAt
        }
      })
    }
  }
  paste (e) {
    e.preventDefault()
    let clipData = e.clipboardData
    let ele = clipData.items
    if (isPC) {
      // 截图
      if (clipData.types[0] === 'Files') {
        if (ele[0].kind === MSG_TYPES.FILE_TYPE && ele[0].type.indexOf('image/') !== -1) {
          let blob = ele[0].getAsFile()
          let reader = new FileReader()
          reader.onload = e => {
            let base64Img = e.target.result
            let isInsert = document.execCommand('InsertHtml', false, `<img src="${base64Img}" />`)
            if (!isInsert) {
              this.editorEle.focus()
              document.execCommand('InsertHtml', false, `<img src="${base64Img}" />`)
            }
          }
          reader.readAsDataURL(blob)
        }
        return
      }
      // 图片+文字
      if (clipData.types.includes('text/html')) {
        let content = clipData.getData('text/html')
        let trans = content.replace(/style=".*?"/g, '').replace(/<!--.*?-->/g, '')
        document.execCommand('InsertHtml', false, trans)
        return
      }
    }
    // 文字
    if (clipData.types.includes('text/plain')) {
      document.execCommand('insertText', false, clipData.getData('text/plain'))
    }
  }
  attachEvent (eventName, args, isCapture) {
    let tempFun
    let self = this
    switch (eventName) {
      case 'paste':
        tempFun = (e) => {
          self.paste(e)
        }
        this.editorEle.addEventListener(eventName, tempFun, isCapture)
        break
      case 'enter':
        // args=[callback, tempMsg]
        tempFun = (e) => {
          if (e.key === 'Enter') {
            self.sendMsg(e, args[0])
          }
        }
        this.editorEle.addEventListener('keydown', tempFun, true) // 必须在捕获阶段执行
        break
    }
  }
  sendMsg (a, b, c) {
    let e, callback, tempMsg
    // 根据参数个数判断方法执行内容，达到方法重载的效果
    if (arguments.length === 1) {
      callback = a
    } else {
      e = a
      callback = b
      tempMsg = c
    }
    if (e) {
      e.preventDefault()
      if (!callback) return
      if (e.ctrlKey) {
        document.execCommand('InsertParagraph')
        return false
      }
    }
    let content = ''
    let contentArr = []
    if (!tempMsg) {
      let tArr = this.editorEle.childNodes
      if (this.checkIsBr(tArr)) {
        callback()
        return
      }
      let frag = new DocumentFragment() // 内存中操作DOM，避免不必要的渲染
      // 将图片和消息截断，XXX[图片]DDD拆分为三条消息，即XXX、[图片]、DDD
      for (let i = 0, len = tArr.length; len > 0; len--) {
        let ele = tArr[i]
        frag.appendChild(ele)
        let imgLsit = []
        if (ele.tagName === 'IMG') {
          imgLsit = [ele]
        } else {
          if (ele.querySelectorAll) { // 避免text文本报错
            imgLsit = ele.querySelectorAll('img')
          }
        }
        for (let i = 0, len = imgLsit.length; i < len; i++) {
          let img = imgLsit[i]
          if (img.className.includes('emoji')) {
            let repStr = `[${img.getAttribute('alt')}]`
            img.replaceWith(repStr)
          } else {
            if (frag.childNodes.length > 0) {
              img.replaceWith()
              contentArr.push(frag)
            }
            frag = new DocumentFragment()
            contentArr.push(img)
            continue
          }
        }
        if (i === len - 1) {
          if (frag.childNodes.length > 0) contentArr.push(frag)
          frag = new DocumentFragment()
        }
      }
      // 将拆分后的消息分开发送
      if (contentArr.length > 0) {
        for (let item of contentArr) {
          let tDiv = document.createElement('div')
          if (item.nodeType === 11) {
            tDiv.append(item)
            this.sendMsg(e, callback, tDiv.innerHTML)
          } else {
            // 发送图片
            if (item.blobUrl) {
              this.sendMsg(e, callback, item.blobUrl)
            } else {
              tDiv.appendChild(item)
              this.sendMsg(e, callback, tDiv.innerHTML)
            }
          }
        }
      }
    } else {
      content = tempMsg
    }
    if (!content) {
      return false
    }
    this.editorEle.innerHTML = ''
    callback(content)
  }
  checkIsBr (nodes) {
    if (typeof nodes === 'string') {
      let replaced = nodes.replace(/<div><br><\/div>/g, '').replace(/&nbsp;/g, '').replace(/\s/g, '').replace(/<div><\/div>/g, '')
      return replaced === ''
    }
    let isBr = true
    for (let item of nodes) {
      if (checkBlank(item)) {
        continue
      }
      if (item.nodeName.toUpperCase() === 'DIV') {
        if (item.childNodes[0].nodeName.toUpperCase() === 'BR' || checkBlank(item.childNodes[0])) {
          continue
        }
      }
      if (item.nodeName.toUpperCase() !== 'DIV') {
        isBr = false
        return isBr
      }
      if (item.childNodes.length !== 1 || item.childNodes[0].nodeName.toUpperCase() !== 'BR') {
        isBr = false
        return isBr
      }
    }
    return isBr
  }
}
// 检验发送内容是否为空
function checkBlank (item) {
  return item.nodeType === 3 && item.nodeValue.replace(/\s/g, '') === ''
}
export default EditorBase
