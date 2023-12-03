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
        // uni.onWindowResize(CALLBACK)  监听窗口尺寸变化事件
        // 平台差异说明
        // App	H5	微信小程序	支付宝小程序	百度小程序	抖音小程序	飞书小程序	QQ小程序
        // √	√	√	x	x	x	√	√

		// #ifdef H5 || MP-LARK || MP-QQ
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
        //onResize	监听窗口尺寸变化	App、微信小程序、快手小程序

		// #ifdef APP || MP-WEIXIN || MP-KUAISHOU
		handlePageLifetime(this, "handlePageResize")
		// #endif
	}
};
