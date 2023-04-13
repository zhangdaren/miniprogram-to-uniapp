/**
 * 接管getTabBar函数，默认uni-app是没有这个函数的
 * 适用于使用custom-tab-bar自定义导航栏的小程序项目
 * 需注意：
 * 1.custom-tab-bar下面仍是小程序文件
 * 2.pages.json里面需使用条件编译区分好小程序和非小程序的tabBar配置
 */
export function getTabBar() {
	return {
		setData(obj) {
			if (typeof this.$mp?.page?.getTabBar === 'function' &&
				this.$mp?.page?.getTabBar()) {
				this.$mp.page.getTabBar().setData(obj)
			} else {
				console.log("当前平台不支持getTabBar()，已稍作处理，详细请参见相关文档。")
			}
		}
	}
}
