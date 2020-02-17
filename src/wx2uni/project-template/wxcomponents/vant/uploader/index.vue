<template>
<uni-shadow-root class="vant-uploader-index"><view class="van-uploader">
  <view class="van-uploader__wrapper">
    
    <view v-for="(item,index) in (lists)" :key="item.index" v-if="previewImage" class="van-uploader__preview">
      <image v-if="item.isImage" :mode="imageFit" :src="item.url || item.path" :alt="item.name || ('图片' + index)" class="van-uploader__preview-image" :style="'width: '+(utils.addUnit(previewSize))+'; height: '+(utils.addUnit(previewSize))+';'" :data-url="item.url || item.path" @click="doPreviewImage"></image>
      <view v-else class="van-uploader__file" :style="'width: '+(utils.addUnit(previewSize))+'; height: '+(utils.addUnit(previewSize))+';'">
        <van-icon name="description" class="van-uploader__file-icon"></van-icon>
        <view class="van-uploader__file-name van-ellipsis">{{ item.name || item.url || item.path }}</view>
      </view>
      <van-icon v-if="deletable" name="clear" class="van-uploader__preview-delete" :data-index="index" @click.native="deleteItem"></van-icon>
    </view>

    
    <block v-if="isInCount">
      <view class="van-uploader__slot" @click="startUpload">
        <slot></slot>
      </view>

      
      <view :class="'van-uploader__upload '+(disabled ? 'van-uploader__upload--disabled': '')" :style="'width: '+(utils.addUnit(previewSize))+'; height: '+(utils.addUnit(previewSize))+';'" @click="startUpload">
        <van-icon name="plus" class="van-uploader__upload-icon"></van-icon>
        <text v-if="uploadText" class="van-uploader__upload-text">{{ uploadText }}</text>
      </view>
    </block>
  </view>
</view></uni-shadow-root>
</template>
<wxs src="../wxs/utils.wxs" module="utils"></wxs>
<script>
import VanIcon from '../icon/index.vue'
global['__wxVueOptions'] = {components:{'van-icon': VanIcon}}

global['__wxRoute'] = 'vant/uploader/index'
import { VantComponent } from '../common/component';
import { isImageFile, isVideo } from './utils';
VantComponent({
    props: {
        disabled: Boolean,
        multiple: Boolean,
        uploadText: String,
        useBeforeRead: Boolean,
        previewSize: {
            type: null,
            value: 90
        },
        name: {
            type: [Number, String],
            value: ''
        },
        accept: {
            type: String,
            value: 'image'
        },
        sizeType: {
            type: Array,
            value: ['original', 'compressed']
        },
        capture: {
            type: Array,
            value: ['album', 'camera']
        },
        fileList: {
            type: Array,
            value: [],
            observer: 'formatFileList'
        },
        maxSize: {
            type: Number,
            value: Number.MAX_VALUE
        },
        maxCount: {
            type: Number,
            value: 100
        },
        deletable: {
            type: Boolean,
            value: true
        },
        previewImage: {
            type: Boolean,
            value: true
        },
        previewFullImage: {
            type: Boolean,
            value: true
        },
        imageFit: {
            type: String,
            value: 'scaleToFill'
        },
        camera: {
            type: String,
            value: 'back'
        },
        compressed: {
            type: Boolean,
            value: true
        },
        maxDuration: {
            type: Number,
            value: 60
        }
    },
    data: {
        lists: [],
        computedPreviewSize: '',
        isInCount: true
    },
    methods: {
        formatFileList() {
            const { fileList = [], maxCount } = this.data;
            const lists = fileList.map(item => (Object.assign(Object.assign({}, item), { isImage: typeof item.isImage === 'undefined' ? isImageFile(item) : item.isImage })));
            this.setData({ lists, isInCount: lists.length < maxCount });
        },
        startUpload() {
            if (this.data.disabled)
                return;
            const { name = '', capture, maxCount, multiple, maxSize, accept, sizeType, lists, camera, compressed, maxDuration, useBeforeRead = false // 是否定义了 beforeRead
             } = this.data;
            let chooseFile = null;
            const newMaxCount = maxCount - lists.length;
            // 设置为只选择图片的时候使用 chooseImage 来实现
            if (accept === 'image') {
                chooseFile = new Promise((resolve, reject) => {
                    wx.chooseImage({
                        count: multiple ? (newMaxCount > 9 ? 9 : newMaxCount) : 1,
                        sourceType: capture,
                        sizeType,
                        success: resolve,
                        fail: reject
                    });
                });
            }
            else if (accept === 'video') {
                chooseFile = new Promise((resolve, reject) => {
                    wx.chooseVideo({
                        sourceType: capture,
                        compressed,
                        maxDuration,
                        camera,
                        success: resolve,
                        fail: reject
                    });
                });
            }
            else {
                chooseFile = new Promise((resolve, reject) => {
                    wx.chooseMessageFile({
                        count: multiple ? newMaxCount : 1,
                        type: 'file',
                        success: resolve,
                        fail: reject
                    });
                });
            }
            chooseFile
                .then((res) => {
                let file = null;
                if (isVideo(res, accept)) {
                    file = Object.assign({ path: res.tempFilePath }, res);
                }
                else {
                    file = multiple ? res.tempFiles : res.tempFiles[0];
                }
                // 检查文件大小
                if (file instanceof Array) {
                    const sizeEnable = file.every(item => item.size <= maxSize);
                    if (!sizeEnable) {
                        this.$emit('oversize', { name });
                        return;
                    }
                }
                else if (file.size > maxSize) {
                    this.$emit('oversize', { name });
                    return;
                }
                // 触发上传之前的钩子函数
                if (useBeforeRead) {
                    this.$emit('before-read', {
                        file,
                        name,
                        callback: (result) => {
                            if (result) {
                                // 开始上传
                                this.$emit('after-read', { file, name });
                            }
                        }
                    });
                }
                else {
                    this.$emit('after-read', { file, name });
                }
            })
                .catch(error => {
                this.$emit('error', error);
            });
        },
        deleteItem(event) {
            const { index } = event.currentTarget.dataset;
            this.$emit('delete', { index, name: this.data.name });
        },
        doPreviewImage(event) {
            if (!this.data.previewFullImage)
                return;
            const curUrl = event.currentTarget.dataset.url;
            const images = this.data.lists
                .filter(item => item.isImage)
                .map(item => item.url || item.path);
            this.$emit('click-preview', { url: curUrl, name: this.data.name });
            wx.previewImage({
                urls: images,
                current: curUrl,
                fail() {
                    wx.showToast({ title: '预览图片失败', icon: 'none' });
                }
            });
        }
    }
});
export default global['__wxComponents']['vant/uploader/index']
</script>
<style platform="mp-weixin">
@import '../common/index.css';.van-uploader{position:relative;display:inline-block}.van-uploader__wrapper{display:-webkit-flex;display:flex;-webkit-flex-wrap:wrap;flex-wrap:wrap}.van-uploader__slot:empty{display:none}.van-uploader__slot:not(:empty)+.van-uploader__upload{display:none!important}.van-uploader__upload{position:relative;display:-webkit-flex;display:flex;-webkit-flex-direction:column;flex-direction:column;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;box-sizing:border-box;width:80px;height:80px;margin:0 8px 8px 0;background-color:#fff;border:1px dashed #ebedf0;border-radius:4px}.van-uploader__upload-icon{display:inline-block;width:24px;height:24px;color:#969799;font-size:24px}.van-uploader__upload-text{margin-top:8px;color:#969799;font-size:12px}.van-uploader__upload--disabled{opacity:.5;opacity:var(--uploader-disabled-opacity,.5)}.van-uploader__preview{position:relative;margin:0 8px 8px 0}.van-uploader__preview-image{display:block;width:80px;height:80px;border-radius:4px}.van-uploader__preview-delete{position:absolute;top:-8px;right:-8px;color:#969799;font-size:18px;background-color:#fff;border-radius:100%}.van-uploader__file{display:-webkit-flex;display:flex;-webkit-flex-direction:column;flex-direction:column;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;width:80px;height:80px;background-color:#f7f8fa;border-radius:4px}.van-uploader__file-icon{display:inline-block;width:20px;height:20px;color:#646566;font-size:20px}.van-uploader__file-name{box-sizing:border-box;width:100%;margin-top:8px;padding:0 5px;color:#646566;font-size:12px;text-align:center}
</style>