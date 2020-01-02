/**
 * Create by jingtian.wang on 2018/7/13.
 */

const Login = () => import('../pages/PC/login')
const chatWin = () => import('../pages/PC/ChatWindow')
const chatDialogue = () => import('../pages/Mobile/ConversationWindow')
// const chatPanel = () => import('../pages/Mobile/ConversationPanel')
const chatMix = () => import('../pages/Mobile/ConversationMix')

export default [
  {
    path: '/login',
    component: Login,
    meta: {title: '登录', keepAlive: false}
  },
  {
    path: '/chatwin',
    component: chatWin,
    meta: {title: '聊天窗口', keepAlive: false}
  },
  {
    path: '/dialogue',
    component: chatDialogue,
    meta: {title: '聊天窗口', keepAlive: false}
  },
  {
    path: '/chatpanel',
    component: chatMix,
    meta: {title: '消息', keepAlive: true}
  }
]
