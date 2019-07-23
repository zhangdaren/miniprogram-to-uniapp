const path = require('path');



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
			return str.replace(/{{ ?(.*?) ?}}/, '$1')
		}
	},
	'wx:key': {
		key: ':key',
		value: (str) => {
			return str.replace(/{{ ?(.*?) ?}}/, '$1')
		}
	},
	'wx:else': {
		key: 'v-else',
	},
	'wx:elif': {
		key: 'v-else-if',
		value: (str) => {
			return str.replace(/{{ ?(.*?) ?}}/, '$1')
		}
	},
	'scrollX': {
		key: 'scroll-x'
	},
	'scrollY': {
		key: 'scroll-y'
	},
	'bindtap': {
		key: '@tap'
	},
	'bindinput': {
		key: '@input'
	},
	'bindgetuserinfo': {
		key: '@getuserinfo'
	},
	'catch:tap': {
		key: '@tap.native.stop'
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
 * wmxml转换
 * // style="color: {{step === index + 1 ? 'red': 'black'}}; font-size:{{abc}}">
 * // <view style="width : {{item.dayExpressmanEarnings / maxIncome * 460 + 250}}rpx;"></view>
 * 
 * @param {*} ast 抽象语法树
 * @param {Boolean} isChildren 是否正在遍历子项目
 */
const templateConverter = function (ast, isChildren) {
	var reg_tag = /{{.*?}}/; //注：连续test时，这里不能加/g，因为会被记录上次index位置
	for (let i = 0; i < ast.length; i++) {
		let node = ast[i];
		//检测到是html节点
		if (node.type === 'tag') {
			//template标签上面的属性不作转换 // <template is="head" data="{{title: 'addPhoneContact'}}"/>
			if (node.name == "template") continue;
			//进行标签替换  
			if (tagConverterConfig[node.name]) {
				node.name = tagConverterConfig[node.name];
			}
			//进行属性替换
			let attrs = {};
			for (let k in node.attribs) {
				let target = attrConverterConfigUni[k];
				if (target) {
					//单独判断style的绑定情况
					var key = target['key'];
					var value = node.attribs[k];
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
					var hasBind = reg_tag.test(value);
					if (hasBind) {
						var reg = /(.*?) +{{(.*?)}}/g;
						let tempR;
						while (tempR = reg.exec(value)) {
							attrs['class'] = tempR[1];
							attrs[':class'] = tempR[2];
						}
					} else {
						attrs['class'] = node.attribs[k];
					}
				} else if (k == 'wx:for') {
					//wx:for单独处理
					var value = node.attribs[k];
					value = value.replace(/{{ ?(.*?) ?}}/, '(item, index) in $1" :key="index');
					attrs['v-for'] = value;
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
						attrs[":" + k] = value;
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
			templateConverter(node.children, true);
		}
	}
	return ast;
}

module.exports = templateConverter;
