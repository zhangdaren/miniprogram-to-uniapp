/**
 * 组件pageLifetimes处理，需在页面生命周期里调用
 * @param {Object} node
 * @param {Object} lifeName
 */
function handlePageLifetime(node, lifeName) {
	node.$children.map(child => {
		if (typeof child[lifeName] == 'function') child[lifeName]()
		handlePageLifetime(child, lifeName)
	})
}

export const pageLifetimes = {
	onLoad() {
		// #ifndef APP || MP-MP-WEIXIN || MP-KUAISHOU
		uni.onWindowResize((res) => {
			handlePageLifetime(this, "handlePageResize")
		})
		// #endif
	},
	onShow() {
		handlePageLifetime(this, "handlePageShow")
	},
	onHide() {
		handlePageLifetime(this, "handlePageHide")
	},
	onResize() {
		// #ifdef APP || MP-MP-WEIXIN || MP-KUAISHOU
		handlePageLifetime(this, "handlePageResize")
		// #endif
	}
};
