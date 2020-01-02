/**
 * Create by jingtian.wang on 2018/7/13.
 */
import axios from 'axios'
import {Urls} from './const'

let base = window.containerBase
const Get = (data, url, successCB, errorCB) => {
  axios.get(base + url, {params: data}).then((response) => {
    if (successCB) {
      successCB(response.data)
    }
  }).catch((error) => {
    if (errorCB) {
      errorCB(error)
    }
  })
}

const Post = (data, url, successCB, errorCB, processCB) => {
  let config = {
    headers: {'Content-Type': 'multipart/from-data'},
    onUploadProgress: (prgEvt) => {
      if (processCB) processCB(prgEvt)
    }
  }
  axios.post(base + url, data, config).then((response) => {
    if (successCB) {
      successCB(response.data)
    }
  }).catch((error) => {
    if (errorCB) {
      errorCB(error)
    }
  })
}

export const Put = (data, url, successCB, errorCB, processCB) => {
  let config = {
    headers: {'Content-Type': 'application/octet-stream'},
    onUploadProgress: (prgEvt) => {
      if (processCB) processCB(parseInt(prgEvt.loaded * 100 / prgEvt.total))
    }
  }
  axios.put(url, data, config).then((response) => {
    if (successCB) {
      successCB(response.data)
    }
  }).catch((error) => {
    if (errorCB) {
      errorCB(error)
    }
  })
}

/** 2018/7/13
 *@param data {object}
 *  data {
 *        scope: //获取第三方系统用户范围条件
 *        todo...
 *       }
 *@param successCB
 *  success callback function
 *@param errorCB
 *  error callback function
 *@result {Array}
 *  item {
 *     name: ...,
 *     id: ...,
 *     gender: ...,
 *     telephone: ...,
 *     organization: ...,
 *     department: ...,
 *     office: ...,
 *     duty: ...,
 *     avatar: ..., // 'http://......./dafe432437e3d3e.jpg/png'
 *     others: {
 *
 *     }
 *  }
 */
export const GetThirdSystemUsers = (data, successCB, errorCB) => Get(data, Urls.getThirdSystemUsers, successCB, errorCB)
/** 2018/7/13
 *@param data {object}
 *  data {
 *        userId:
 *        userName:
 *       }
 *@param successCB
 *  success callback function
 *@param errorCB
 *  error callback function
 *@result {Object}
 *   {
 *     name: ...,
 *     id: ...,
 *     gender: ...,
 *     telephone: ...,
 *     organization: ...,
 *     department: ...,
 *     office: ...,
 *     duty: ...,
 *     avatar: ..., // 'http://......./dafe432437e3d3e.jpg/png'
 *     others: {
 *
 *     }
 *  }
 */
export const QueryThirdSystemUsers = (data, successCB, errorCB) => Get(data, Urls.queryThirdSystemUsers, successCB, errorCB)
/** 2018/7/13
 *@param data {object}
 *  todo...
 *@param successCB
 *  success callback function
 *@param errorCB
 *  error callback function
 *@param progressCB
 *  file upload progress callback function
 *@result {url}
 *    获取文件的Url
 */
export const UploadFile2ThirdSystem = (data, successCB, errorCB, progressCB) => Post(data, Urls.uploadFile2ThirdSystem, successCB, errorCB, progressCB)
