import {getIdFromJid} from '../service/const'

export default {
  methods: {
    isCardShow (contact) {
      if (window.enableSysMsg) {
        return contact.name.indexOf(this.keyword) >= 0
      } else {
        return contact.name.indexOf(this.keyword) >= 0 && getIdFromJid(contact.jid) !== 'chatadmin'
      }
    }
  }
}
