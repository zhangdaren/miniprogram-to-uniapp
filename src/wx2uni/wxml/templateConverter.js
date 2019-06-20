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
	'wx:for': {
		key: 'v-for',
		value: (str) => {
			return str.replace(/{{ ?(.*?) ?}}/, '(item,key) in $1')
		}
	},
	'wx:if': {
		key: 'v-if',
		value: (str) => {
			return str.replace(/{{ ?(.*?) ?}}/, '$1')
		}
	},
	'wx:else': {
		key: 'v-else',
	},
	'wx:elif': {
		key: 'v-else-if',
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
// style="color: {{step === index + 1 ? 'red': 'black'}}; font-size:{{abc}}">
// <view style="width : {{item.dayExpressmanEarnings / maxIncome * 460 + 250}}rpx;"></view>

//替换入口方法
const templateConverter = function (ast) {
	var reg_tag = /{{.*?}}/; //注：连续test时，这里不能加/g，因为会被记录上次index位置
	for (let i = 0; i < ast.length; i++) {
		let node = ast[i];
		//检测到是html节点
		if (node.type === 'tag') {
			//进行标签替换  
			if (tagConverterConfig[node.name]) {
				node.name = tagConverterConfig[node.name];
			}
			//进行属性替换
			let attrs = {};
			for (let k in node.attribs) {
				let target = attrConverterConfigUni[k];
				if (target) {
					//分别替换属性名和属性值

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
						while (tempR = reg.exec(value)) {
							attrs['class'] = tempR[1];
							attrs[':class'] = tempR[2];
						}
					} else {
						attrs['class'] = node.attribs[k];
					}
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
		}
		//因为是树状结构，所以需要进行递归
		if (node.children) {
			templateConverter(node.children);
		}
	}
	return ast;
}

module.exports = templateConverter;
