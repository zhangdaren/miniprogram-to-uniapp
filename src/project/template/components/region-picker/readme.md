#### 特性说明
1. 行政区用的是2018还是2019年的全国标准行政区划, 也可以定义远端的 json 地址, 格式看使用文档
2. 返回的 detail.value 和官方的 mode=region 比缺少了 post_code, 主要是我的数据库中没有邮编, 剩下的 code/value 格式和官方保持一致
3. 传参支持官方的 value, disabled, 暂不支持 custom-item
4. 事件支持 change / cancel
5. value 的传值支持
- 行政区号数组 [省,市,区]
- 行政区号字符串 "省,市,区" / "区"
- 暂不支持城市名设置value, 有需要可以自己改造, 很简单的代码

#### 使用方式
```javascript
import regionPicker from "@/components/region-picker/region-picker.vue"
```
```javascript
components: {  
    regionPicker  
},
```
将
```html
<picker mode="region"
```
替换为
```html
<region-picker
```
即可
```html
<region-picker @change="region_change" :value="350104">
	<view class="picker">请选择地区</view>
</region-picker>
```
#### Value 传值说明
```html
<!-- 单传区级行政区号 -->
<region-picker @change="region_change" value="350104">
<!-- 传省市区级行政区号(字符串) -->
<region-picker @change="region_change" value="350000,350100,350104">
<!-- 传省市区级行政区号(数组) -->
<region-picker @change="region_change" :value="[350000,350100,350104]">
<!-- 字符串/整形均可, 没具体测试, 如果报错, 就试着改一下类型 -->
```
#### 使用远端 json
```html
<region-picker jsonPath="远端json文件或者其他返回json格式的数据源">
```
返回json数据应符合格式如下
```json
[{
	name: '福建省',
	code: '350000',
	children: [{
		name: '福州市',
		code: '350100',
		children: [{
			name: '仓山区',
			code: '350104',
			// id: xxx,
			// post_code: xxx
			// 其他自定义的数据键值对: 值
			// change 事件的 detail.data 属性会返回所选区域的完整的对象
		},
		{
		//...第二个区域
		}]
	},
	{
	//...第二个城市
	}]
},
{
//...第二个省份
}]
```