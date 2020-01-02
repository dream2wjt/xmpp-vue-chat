/**
 * Create by jingtian.wang on 2018/7/17.
 */
export default {
  userNodeJid: state => {
    if (state.curUser) {
      return state.curUser.jid.split('/')[0]
    }
    return ''
  }
}
