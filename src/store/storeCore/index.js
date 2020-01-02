/**
 * Create by jingtian.wang on 2018/7/17.
 */
import getters from './getters'
import mutations from './mutations'
import actions from './action'

const state = {
  platform: 'pc',
  keepAlive: [],
  lastUser: null,
  curUser: null,
  uiCore: null,
  addressBooks: [],
  contacts: [],
  chattingUser: null,
  searchHistoryMap: {}
}

export default {
  namespaced: true,
  // store personal state data
  state: state,
  // change state in a Vuex store is by committing a mutation
  mutations: mutations,
  // similar to mutations, commit mutations & contain arbitrary asynchronous operations
  actions: actions,
  //  compute derived state based on store state
  getters: getters
}
