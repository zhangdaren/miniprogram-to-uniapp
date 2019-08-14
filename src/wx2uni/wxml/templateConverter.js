const path = require('path');
const {
	isURL
} = require('../../utils/utils.js');
const {
	getFileNameNoExt, getParentFolderName
} = require('../../utils/pathUtil.js');



//html标签替换规则，可以添加更多
const tagConverterConfig = {
	// 'image': 'img'
}
//属性替换规则，也可以加入更多
const attrConverterConfigVue = {
	'wx:for': {
		key: 'v-for',
		value: (str) => {
			return str.replace(/{{(.*)}}/, '(item,key) in $1')
		}
	},
	'wx:if': {
		key: 'v-if',
		value: (str) => {
			return str.replace(/{{(.*)}}/, '$1')
		}
	},
	'@tap': {
		key: '@click'
	},
}

const attrConverterConfigUni = {
	// 'wx:for': {
	// 	key: 'v-for',
	// 	value: (str) => {
	// 		return str.replace(/{{ ?(.*?) ?}}/, '(item, index) in $1" :key="index')
	// 	}
	// },
	'wx:if': {
		key: 'v-if',
		value: (str) => {
			return str.replace(/{{ ?(.*?) ?}}/, '$1').replace(/\"/g, "'")
		}
	},
	// 'wx:key': {
	// 	key: ':key',
	// 	value: (str) => {
	// 		return str.replace(/{{ ?(.*?) ?}}/, '$1').replace(/\"/g, "'")
	// 	}
	// },
	'wx:else': {
		key: 'v-else',
		value: (str) => {
			return str.replace(/{{ ?(.*?) ?}}/, '$1').replace(/\"/g, "'")
		}
	},
	'wx:elif': {
		key: 'v-else-if',
		value: (str) => {
			return str.replace(/{{ ?(.*?) ?}}/, '$1').replace(/\"/g, "'")
		}
	},
	'scrollX': {
		key: 'scroll-x'
	},
	'scrollY': {
		key: 'scroll-y'
	},
	'bindtap': {
		key: '@tap',
		value: (str) => {
			return str.replace(/{{ ?(.*?) ?}}/, '$1').replace(/\"/g, "'")
		}
	},
	'catchtap': {
		key: '@click.stop',
		value: (str) => {
			return str.replace(/{{ ?(.*?) ?}}/, '$1').replace(/\"/g, "'")
		}
	},
	'bindinput': {
		key: '@input'
	},
	'bindgetuserinfo': {
		key: '@getuserinfo'
	},
	'catch:tap': {
		key: '@tap.native.stop',
		value: (str) => {
			return str.replace(/{{ ?(.*?) ?}}/, '$1').replace(/\"/g, "'")
		}
	},
	// 'style': {
	// 	key: 'style', //这里需要根据绑定情况来判断是否增加:
	// 	value: (str) => {
	// 		// var tmpStr = str.replace(/}}rpx/g, " + 'rpx'");
	// 		// tmpStr = tmpStr.replace(/[({{)(}})]/g, '');
	// 		// return '{' + tmpStr + '}';

	// 		let reg = /"(.*?){{(.*?)}}(.*?)"/g;

	// 		// style="background-image: url({{avatarUrl}})"
	// 	}
	// }
}

/**
 * 遍历往上查找祖先，看是否有v-for存在，存在就返回它的:key，不存在返回空
 */
function findParentsWithFor(node) {
	if (node.parent) {
		if (node.parent.attribs["v-for"]) {
			return node.parent.attribs[":key"];
		} else {
			return findParentsWithFor(node.parent);
		}
	}
}


/**
 * wmxml转换
 * // style="color: {{step === index + 1 ? 'red': 'black'}}; font-size:{{abc}}">
 * // <view style="width : {{item.dayExpressmanEarnings / maxIncome * 460 + 250}}rpx;"></view>
 * 
 * @param {*} ast 抽象语法树
 * @param {Boolean} isChildren 是否正在遍历子项目
 */
const templateConverter = function (ast, isChildren, file_wxml, onlyWxmlFile) {
	var reg_tag = /{{.*?}}/; //注：连续test时，这里不能加/g，因为会被记录上次index位置
	var props = [];
	for (let i = 0; i < ast.length; i++) {
		let node = ast[i];
		//检测到是html节点
		if (node.type === 'tag') {
			//处理import标签
			if (node.name == "import") {
				let src = node.attribs["src"];

				//当前处理文件所在目录
				let wxmlFolder = path.dirname(file_wxml);
				//src资源完整路径
				let filePath = path.resolve(wxmlFolder, src);
				//src资源文件相对于src所在目录的相对路径
				let relativePath = path.relative(global.miniprogramRoot, filePath);
				relativePath = relativePath.replace(/^\//g, "./"); //相对路径处理
				//相对路径里\\替换为/
				relativePath = relativePath.split("\\").join("/");

				if (!/^\./.test(relativePath)) {
					//路径前面不是以.开始，总不能是网络路径和绝对路径吧！
					relativePath = "./" + relativePath;
				}

				let name = getFileNameNoExt(src);

				global.globalUsingComponents[name] = relativePath;

				// console.log(src, relativePath);
				delete ast[i];
				continue;
			}

			//template标签<template is="head" data="{{title: 'addPhoneContact'}}"/>
			//转换为组件，并添加到全局组件里
			if (node.name == "template") {
				// 	//包含is属性的才是页面里面的<template/>标签，否则为被引入的那个组件
				let componentName = node.attribs.is;
				// console.log(componentName);
				if (componentName) {
					node.name = componentName;

					let data = node.attribs.data;
					if (!data) continue;
					// 		//这里分两种情况，有:号和没:号的
					// 		//有:号-->转为object对象传过去
					// 		//没:号-->转为数组传过去
					// 		data = data.replace(/{{ ?(.*?) ?}}/, '$1').replace(/'/g, "\"");
					// 		if (data.indexOf(":") > -1) {
					// 			data = JSON.parse("{" + data + "}");
					// 			console.log(data);
					// 		} else {

					// 		}

					/* *	```<template is="msgItem"  data="{{'这是一个参数'}}"/>```
					*	```<template is="t1" data="{{newsList,type}}"/>```
					*	```<template is="head" data="{{title: 'action-sheet'}}"/>```
					*	```<template is="courseLeft" wx:if="{{index%2 === 0}}" data="{{...item}}"></template>```
					*	```<template is="{{index%2 === 0 ? 'courseLeft' : 'courseRight'}}" data="{{...item}}"></template>```
					* ```<template is="stdInfo" wx:for="{{stdInfo}}" data="{{...stdInfo[index], ...{index: index, name: item.name} }}"></template>``` */

					//目前仅支持语法 data="{{title: 'action-sheet'}}" ，JSON.parse转换不成功的，保持原样
					// console.log(data);

					//替换{{xxx}}为xxx-->替换'为"-->为key添加双引号
					let test = data.replace(/{{ ?(.*?) ?}}/, '$1').replace(/'/g, "\"").replace(/([a-zA-Z_-]+):/g, '"$1":');

					// console.log(test);
					try {
						obj = JSON.parse("{" + test + "}");
						for (const key in obj) {
							let val = obj[key];
							if (val.indexOf("\"") > -1) {
								node.attribs[":" + key] = val;
							} else {
								node.attribs[key] = val;
							}
						}
						//删除data属性
						delete node.attribs["data"];
						continue;
					} catch (e) {
						console.log(e);
						//如果报错，那就随意了，不管了。
					}
					// console.log(node);
				}
			}

			//进行标签替换  
			if (tagConverterConfig[node.name]) {
				node.name = tagConverterConfig[node.name];
			}

			//进行属性替换
			let attrs = {};

			//处理template image标签下面的src路径(这里要先进行转换，免得后面src可能转换为:src了)
			//e:\zpWork\Project_self\miniprogram-to-uniapp\test\test2\index\images\ic_detail_blue.png
			//e:\zpWork\Project_self\miniprogram-to-uniapp\test\test2\static\images\ic_detail_blue.png
			//处理规则：
			//将所有素材转换为static目录下的路径，以当前正在处理的文件所在的目录作为参照，切为相对路径
			//直接提取父目录的目标名加文件名作为static下面的相对路径
			if (node.name == "image") {
				let reg = /\.(jpg|jpeg|gif|svg|png)$/;  //test时不能加/g

				//image标签，处理src路径
				var src = node.attribs.src;
				//这里取巧一下，如果路径不是以/开头，那么就在前面加上./
				if (!/^\//.test(src)) {
					src = "./" + src;
				}
				//忽略网络素材地址，不然会转换出错
				if (src && !isURL(src) && reg.test(src)) {
					//static路径
					let staticPath = path.join(global.miniprogramRoot, "static");

					// <image src="/page/cloud/resources/kind/database.png"

					//当前处理文件所在目录
					let wxmlFolder = path.dirname(file_wxml);
					var pFolderName = getParentFolderName(src);
					// console.log("pFolderName ", pFolderName)
					var fileName = path.basename(src);
					// console.log("fileName ", fileName)

					//src资源完整路径
					// let filePath = "";
					// if (/^\//.test(src)) {
					// 	console.log("-" + src)
					// 	filePath = path.resolve(staticPath, "./" + pFolderName + "/" + fileName);
					// 	console.log("--" + filePath)
					// } else if (/^\./.test(src)) {
					// 	//以.开头表示为相对路径，直接将前面的..或../去掉
					// 	console.log("-" + src)
					// 	filePath = path.resolve(staticPath, "./" + pFolderName + "/" + fileName);
					// 	console.log("--" + filePath)

					// 	//下面为以前的逻辑，先放在这里
					// 	// filePath = path.resolve(wxmlFolder, src);
					// 	// console.log("22-", filePath);
					// 	// //src资源文件相对于src所在目录的相对路径
					// 	// let relativePath = path.relative(global.miniprogramRoot, filePath);
					// 	// //处理images或image目录在pages下面的情况 
					// 	// relativePath = relativePath.replace(/^pages\\/, "");
					// 	// //资源文件路径
					// 	// let newImagePath = path.join(global.miniprogramRoot, "static/" + relativePath);
					// 	// newImagePath = path.relative(wxmlFolder, newImagePath);
					// 	// //修复路径
					// 	// newImagePath = newImagePath.split("\\").join("/");
					// 	// console.log("22--", newImagePath);
					// } else {
					// 	//既无/又无.，表示为当前路径
					// 	filePath = path.resolve(staticPath, "./" + pFolderName + "/" + fileName);
					// }

					filePath = path.resolve(staticPath, "./" + pFolderName + "/" + fileName);
					newImagePath = path.relative(wxmlFolder, filePath);

					attrs.src = newImagePath;
				} else {
					console.log("wxml漏网之鱼: --> src=\"" + src + "\"，所在文件：" + path.relative(global.miniprogramRoot, file_wxml))
				}
			}

			for (let k in node.attribs) {
				let target = attrConverterConfigUni[k];
				if (target) {
					//单独判断style的绑定情况
					var key = target['key'];
					var value = node.attribs[k];
					//将双引号转换单引号
					value = value.replace(/\"/g, "'");

					// if (k == 'style') {
					// 	var hasBind = value.indexOf("{{") > -1;
					// 	key = hasBind ? ':style' : this.key;
					// } else 
					if (k == 'url') {
						var hasBind = value.indexOf("{{") > -1;
						key = hasBind ? ':url' : this.key;
					}
					attrs[key] = target['value'] ?
						target['value'](node.attribs[k]) :
						node.attribs[k];
				} else if (k == 'class') {
					//class单独处理
					var value = node.attribs[k];
					//将双引号转换单引号
					value = value.replace(/\"/g, "'");
					var hasBind = reg_tag.test(value);
					if (hasBind) {
						var reg = /(.*?) +{{(.*?)}}/g;
						let tempR = reg.exec(value);
						if (tempR) {
							attrs['class'] = tempR[1];
							attrs[':class'] = tempR[2];
						} else {
							attrs[':class'] = value.replace(/{{ ?(.*?) ?}}/, '$1');
						}
					} else {
						attrs['class'] = node.attribs[k];
					}
				} else if (k == 'wx:for' || k == 'wx:for-items') {
					//wx:for单独处理
					//wx:key="*item" -----不知道vue支持不
					/**
					 * wx:for规则:
					 * 
					 * 情况一：
					 * <block wx:for="{{uploadImgsArr}}" wx:key="">{{item.savethumbname}}</block>
					 * 解析规则：
					 * 1.没有key时，设为index
					 * 2.没有wx:for-item时，默认设置为item
					 * 
					 * 情况二：
					 * <block wx:for="{{hotGoodsList}}" wx:key="" wx:for-item="item">
           			 * 		<block wx:for="{{item.markIcon}}" wx:key="" wx:for-item="subItem">
          			 *   		<text>{{subItem}}</text>
          			 *  	</block>
         			 * </block>
					 * 解析规则：同上
					 * 
					 * 
					 * 情况三：
					 * <block wx:for-items="{{countyList}}" wx:key="{{index}}">
					 *     <view data-index="{{index}}" data-code="{{item.cityCode}}">
					 *     		<view>{{item.areaName}}</view>
					 *     </view>
					 * </block>
					 * 解析规则：同上
					 * 
					 * 情况四：
					 * <view wx:for="{{list}}" wx:key="{{index}}">
					 *		<view wx:for-items="{{item.child}}" wx:key="{{index}}" data-id="{{item.id}}" wx:for-item="item">
					 *		</view>
					 * </view>
					 * 解析规则：
					 * 1.wx:for同上
					 * 2.遍历到wx:for-items这一层时，如果有wx:for-item属性，且parent含有wx:for时，将wx:for-item的值设置为parent的wx:for遍历出的子元素的别称
					 */

					//这里预先设置wx:for是最前面的一个属性，这样会第一个被遍历到
					let wx_key = node.attribs["wx:key"];

					//如果wx:key="*this" 或wx:key="*item"时，那么直接设置为空
					if (wx_key && wx_key.indexOf("*") > -1) wx_key = "";
					let wx_for = node.attribs["wx:for"];
					let wx_forItem = node.attribs["wx:for-item"];
					let wx_forItems = node.attribs["wx:for-items"];
					//wx:for与wx:for-items互斥
					var value = wx_for ? wx_for : wx_forItems;

					//替换{{}}
					if (wx_key) {
						wx_key = wx_key.trim();
						wx_key = wx_key.replace(/{{ ?(.*?) ?}}/, '$1').replace(/\"/g, "'");
					}
					//------------处理wx:key------------
					//查找父级的key
					let pKey = findParentsWithFor(node);
					if (pKey && pKey.indexOf("index") > -1) {
						var count = pKey.split("index").join("");
						if (count) {
							count = parseInt(count);
						} else {
							count = 1; //如果第一个找到的父级的key为index时，则默认为1
						}
						count++; //递增
						wx_key = (wx_key && pKey != wx_key) ? wx_key : "index" + count;
					} else {
						wx_key = wx_key ? wx_key : "index";
					}
					//修复index，防止使用的item.id来替换index
					let newKey = wx_key.indexOf(".") == -1 ? wx_key : "index";

					//设置for-item默认值
					wx_forItem = wx_forItem ? wx_forItem : "item";

					//将双引号转换单引号
					value = value.replace(/\"/g, "'");
					value = value.replace(/{{ ?(.*?) ?}}/, '(' + wx_forItem + ', ' + newKey + ') in $1');
					if (value == node.attribs[k]) {
						//奇葩!!! 小程序写起来太自由了，相比js有过之而无不及，{{}}可加可不加……我能说什么？
						//这里处理无{{}}的情况
						value = '(' + wx_forItem + ', ' + newKey + ') in ' + value;
					}

					attrs['v-for'] = value;
					attrs[':key'] = newKey;
					if (node.attribs.hasOwnProperty("wx:key")) delete node.attribs["wx:key"];
					if (node.attribs.hasOwnProperty("wx:for-item")) delete node.attribs["wx:for-item"];
					if (node.attribs.hasOwnProperty("wx:for-items")) delete node.attribs["wx:for-items"];
				} else {
					// "../list/list?type={{ item.key }}&title={{ item.title }}"
					// "'../list/list?type=' + item.key ' + '&title=' + item.title"

					//其他属性
					//处理下面这种嵌套关系的样式或绑定的属性
					//style="background-image: url({{avatarUrl}});color:{{abc}};font-size:12px;"
					var value = node.attribs[k];
					var hasBind = reg_tag.test(value);
					if (hasBind) {
						var reg1 = /(?!^){{ ?/g; //中间的{{
						var reg2 = / ?}}(?!$)/g; //中间的}}
						var reg3 = /^{{ ?/; //起始的{{
						var reg4 = / ?}}$/; //文末的}}
						value = value.replace(reg1, "' + ").replace(reg2, " + '");

						//单独处理前后是否有{{}}的情况
						if (reg3.test(value)) {
							//有起始的{{的情况
							value = value.replace(reg3, "");
						} else {
							value = "'" + value;
						}
						if (reg4.test(value)) {
							//有结束的}}的情况
							value = value.replace(reg4, "");
						} else {
							value = value + "'";
						}
						//将双引号转换单引号
						value = value.replace(/\"/g, "'");

						attrs[":" + k] = value;
						delete attrs[k];
					} else {
						attrs[k] = node.attribs[k];
					}
				}
			}

			node.attribs = attrs;
		} else if (node.type === 'text') {
			// var hasBind = reg_tag.test(node.data);
			// if (hasBind) {
			// 	var tmpStr = node.data.replace(/[({{)(}})]/g, '');
			// 	node.data = '{{' + tmpStr + '}}';
			// }

			if (onlyWxmlFile) {
				let value = node.data;
				if (reg_tag.test(value)) {
					value = value.replace(/{{ ?(.*?) ?}}/, '$1');
					if (!global.props[file_wxml]) global.props[file_wxml] = [];
					global.props[file_wxml].push('"' + value + '"');
				}
			}

		} else if (node.type === 'Literal') {
			//处理wxml里导入wxml的情况
			//暂未想好怎么转换
			// node.value = node.value.replace(/.wxml/g, ".css");

		} else if (node.type === 'img') {
			//正则匹配路径
			// let reg = /^\.\/.*?\.(jpg|jpeg|gif|svg|png)/;
			// let key = path.node.key;
			// let valueTxt = path.node.value.value;

			// //判断是否含有当前目录的文件路径
			// //微信的页面是多页面的，即单独启动某个文件，而vue是单页面的，转换后导致原有资源引用报错。
			// if (reg.test(valueTxt)) {
			// 	//js文件所在目录
			// 	let fileDir = nodePath.dirname(file_js);
			// 	let filePath;
			// 	if (/^\//.test(valueTxt)) {
			// 		//如果是以/开头的，表示根目录
			// 		filePath = nodePath.join(miniprogramRoot, valueTxt);
			// 	} else {
			// 		filePath = nodePath.join(fileDir, valueTxt);
			// 	}
			// 	filePath = nodePath.relative(miniprogramRoot, filePath);
			// 	filePath = filePath.split("\\").join("/");
			// 	//手动组装
			// 	let node = t.objectProperty(key, t.stringLiteral(filePath));
			// 	vistors.data.handle(node);
			// } else {
			// 	vistors.data.handle(path.node);
			// }
		}
		//因为是树状结构，所以需要进行递归
		if (node.children) {
			templateConverter(node.children, true, file_wxml, onlyWxmlFile);
		}
	}
	return ast;
}

module.exports = templateConverter;
