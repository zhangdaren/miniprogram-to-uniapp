const createTraverse = () => {
	let stop = false;
	return function traverse(root, callback) {
		if (!stop && typeof callback === 'function') {
			let children = root.$children;
			for (let index = 0; !stop && index < children.length; index++) {
				let element = children[index];
				stop = callback(element) === true;
				traverse(element, callback);
			}
		}
	};
};

/**
 * 安全的JSON.stringify
 * @param {Object} node
 */
function safeStringify(node) {
	var cache = [];
	var str = JSON.stringify(node, function(key, value) {
		if (typeof value === 'object' && value !== null) {
			if (cache.indexOf(value) !== -1) {
				// 移除
				return;
			}
			// 收集所有的值
			cache.push(value);
		}
		return value;
	});
	cache = null; // 清空变量，便于垃圾回收机制回收
	return str
}

const match = (node, selector) => {
	var vnode = node._vnode;

	//好家伙，在微信小程序里，node里面根本找不到class，因此这种方式没法搞了

	//关键之处！
	// console.log("attrs", (vnode.context.$vnode.data));
	vnode = vnode?.context?.$vnode ?? ""
	//console.log(vnode.data) -->  [Object] {"staticClass":"bar","attrs":{"_i":0}}  at selectComponent.js:72
	if (!vnode || !vnode.data) {
		return false
	}

	let attrs = vnode.data.attrs || {};
	let staticClass = vnode.data.staticClass || '';

	const id = attrs.id || '';
	if (selector[0] === '#') {
		return selector.substr(1) === id;
	} else {
		staticClass = staticClass.trim().split(' ');
		selector = selector.substr(1).split('.');
		return selector.reduce((a, c) => a && staticClass.includes(c), true);
	}
};

const selectorBuilder = (selector) => {
	selector = selector.replace(/>>>/g, '>');
	selector = selector.split('>').map(s => {
		return s.trim().split(' ').join(`').descendant('`);
	}).join(`').child('`);

	// 替换掉new Function方式，因为小程序不支持new Function和eval
	//return new Function('Selector', 'node', 'all', `return new Selector(node, all).descendant('` + selector + `')`);
	return function(Selector, node, all) {
		return new Selector(node, all).descendant(selector)
	}
};

class Selector {
	constructor(node, all = false) {
		this.nodes = [node];
		this.all = all;
	}

	child(selector) {
		let matches = [];
		if (this.all) {
			this.nodes.forEach(node => {
				matches.push(...node.$children.filter(node => match(node, selector)));
			});
		} else {
			if (this.nodes.length > 0) {
				let node = this.nodes[0].$children.find(node => match(node, selector));
				matches = node ? [node] : [];
			}
		}
		this.nodes = matches;
		return this;
	}

	descendant(selector) {
		let matches = [];
		this.nodes.forEach(root => {
			createTraverse()(root, (node) => {
				if (match(node, selector)) {
					matches.push(node);
					return !this.all;
				}
			});
		});
		this.nodes = matches;
		return this;
	}
}
////////////////////////////////////////////selectComponent//////////////////////////////////////////////////
/**
 * 其他平台，如APP
 * @param {Object} selector
 */
function selectComponentOther(selector) {
	const selectors = selector.split(',').map(s => s.trim());
	if (!selectors[0]) {
		return null;
	}
	const querySelector = selectorBuilder(selectors[0]);
	return querySelector(Selector, this, false, selector).nodes[0];
}


/**
 * 还是用这个微信小程序的实现吧
 * @param {Object} selector
 */
var selectComponentWeiXin2 = function(selector) {
		console.log(".$scope",this.$scope.selectComponent(selector))
	return this.$scope.selectComponent(selector)?.data || undefined
}

/**
 * selectComponent
 * @param {Object} args
 */
export function selectComponent(args) {
	// console.log(".$scope",this.$scope)
	// #ifdef MP
	//H5和小程序能正常使用这个函数
	//重写selectComponent函数，因为默认会多一层$vm
	return selectComponentWeiXin2.call(this, args)
	// #endif

	// #ifndef MP
	// 因App的结构略有差异,此函数无法正常使用
	// function(e){return function e(t,n){if(n(t.$vnode||t._vnode))return t;for(var r=t.$children,i=0;i<r.length;i++){var o=e(r[i],n);if(o)return o}}(this,ov(e))}
	// return selectComponentOther(args)
	return selectComponentOther.call(this, args)
	// #endif
}

////////////////////////////////////////////selectAllComponents//////////////////////////////////////////////////
/**
 * 其他平台，如APP
 * @param {Object} selector
 */
function selectAllComponentsOther(selector) {
	const selectors = selector.split(',').map(s => s.trim());
	let selected = [];
	selectors.forEach(selector => {
		const querySelector = selectorBuilder(selector);
		selected = selected.concat(querySelector(Selector, this, true, selector).nodes);
	});
	return selected;
}


/**
 * 还是用这个微信小程序的实现吧
 * @param {Object} selector
 */
var selectAllComponentsWeiXin2 = function(selector) {
	var list = this.$scope.selectAllComponents(selector) || []
	list = list.map(item => item.data)
	return list
}

/**
 * selectAllComponents
 * @param {Object} args
 */
export function selectAllComponents(args) {
	// #ifdef MP
	//H5和小程序能正常使用这个函数
	//重写selectComponent函数，因为默认会多一层$vm
	return selectAllComponentsWeiXin2.call(this, args)
	// #endif

	// #ifndef MP
	// 因App的结构略有差异,此函数无法正常使用
	return selectAllComponentsOther.call(this, args)
	// #endif
}
