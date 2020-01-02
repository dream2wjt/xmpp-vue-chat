/**
 * Create by jingtian.wang on 2018/7/17.
 */

export default {
  connect: function () {

  },
  removeUser: function ({commit, state}, jid) {
    return new Promise((resolve, reject) => {
      state.uiCore.removeUser(jid, function () {
        resolve()
      })
    })
  },
  addFriend: function ({commit, state}, jid) {
    state.uiCore.addFriend(jid)
  },
  shield_user: function ({commit, state}, jid) {
    state.uiCore.shield_user(jid)
  },
  unshield_user: function ({commit, state}, jid) {
    state.uiCore.unshield_user(jid)
  }
}
