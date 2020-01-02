<template>
  <div class="uih-extra-func-list list-not-close">
    <div v-show="!showCamera">
      <img @click="$refs.imgFile.click()" class="needsclick" src="../../assets/picture.svg"/>
      <input type="file" ref="imgFile" accept="image/*" @change="uploadImg" style="display: none"/>
      <span>图片</span>
    </div>
    <div v-show="showCamera">
      <img src="../../assets/photo.svg" @click="openPhotoLibary"/>
      <!--<span>相册</span>-->
    </div>
    <div v-show="showCamera">
      <img src="../../assets/camera.svg" @click="openCamera"/>
      <!--<span>拍摄</span>-->
    </div>
    <div>
      <img @click="$refs.file.click()" class="needsclick" src="../../assets/picture.svg"/>
      <input type="file" ref="file" @change="uploadFile" style="display: none"/>
      <span>文件</span>
    </div>
  </div>
</template>

<script>
  import {createNamespacedHelpers} from 'vuex'

  const {mapState} = createNamespacedHelpers('uihChat')

  // BASE64转BLOB
  function dataURLtoBlob (dataurl) {
    let arr = dataurl.split(',')
    let mime = arr[0].match(/:(.*?);/)[1]
    let bstr = atob(arr[1])
    let n = bstr.length
    let u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], {type: mime})
  }

  function getRegExp (testStr) {
    return new RegExp(testStr)
  }

  export default {
    name: 'extra-fun-list',
    data () {
      return {
        showCamera: window.MediaPicker
      }
    },
    computed: {
      ...mapState([
        'uiCore',
        'chattingUser'
      ])
    },
    methods: {
      uploadImg () {
        let file = this.$refs.imgFile.files[0]
        this.$refs.imgFile.value = ''
        this.$emit('send-img', file)
      },
      uploadFile () {
        let file = this.$refs.file.files[0]
        this.$refs.file.value = ''
        this.$emit('send-file', file)
      },
      fileToBlob (media) {
        if (!media) {
          this.$emit('send-img', media)
          return
        }

        let parThis = this

        let uri = media.uri
        if (!getRegExp('^file://').test(uri)) { uri = 'file://' + uri }

        window.resolveLocalFileSystemURL(uri, (fileEntry) => {
          fileEntry.file(file => {
            console.log('uihChat get photo picture', file)

            let reader = new FileReader()
            reader.onloadend = function () {
              parThis.$emit('send-img', dataURLtoBlob(this.result))
            }
            reader.readAsDataURL(file)
          })
        }, (error) => {
          console.log('uihChat get File error: ', error)
        })
      },
      openPhotoLibary () {
        let args = {
          'selectMode': 100,
          'maxSelectCount': 1,
          'maxSelectSize': 5 * 1024 * 1024
        }
        window.MediaPicker.getMedias(args, (medias) => {
          console.log('uihChat get medias: ', medias)
          medias.forEach((media, key) => {
            let re = getRegExp('(.jpg|.JPG|.png|.PNG|.jpeg|.JPEG)$')
            if (!re.test(media.uri)) {
              console.log('uihChat mediaPicker: 非jpg, png, jpeg图片格式。')
              this.fileToBlob(null)
              return
            }

            this.fileToBlob(media)
          })
        }, (error) => {
          console.log('uihChat can not get photo picture: ', error)
        })
      },
      openCamera () {
        navigator.camera.getPicture((imageData) => {
          let data = 'data:image/jpg;base64,' + imageData
          this.$emit('send-img', dataURLtoBlob(data))
        }, (error) => {
          console.log('uihChat can not get camera picture: ' + error)
        }, {
          sourceType: window.Camera.PictureSourceType.CAMERA,
          destinationType: window.Camera.DestinationType.DATA_URL,
          correctOrientation: true
        })
      }
    }
  }
</script>

<style lang="less">
  .uih-extra-func-list {
    width: 100%;
    box-sizing: border-box;
    display: flex;
    position: fixed;
    height: 256px; /*no*/
    bottom: 0;
    padding: 20px 18px; /*no*/
    background-color: #f8f8f8;
    overflow-y: auto;
    z-index: 800;
    & > div {
      margin: 0 10px;
      width: 60px;
      height: 60px;
      text-align: center;
    }
  }
</style>
