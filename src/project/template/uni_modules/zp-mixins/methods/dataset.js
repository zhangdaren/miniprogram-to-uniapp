/**
 * 用于处理dataset
 * 自定义组件的事件里，是获取不到e.currentTarget.dataset的
 * 因此收集data-参数，手动传进去
 *
 * @param {*} event
 * @param {*} dataSet
 */
export function handleDataset(event, dataSet = {}) {
	if (event && !event.currentTarget) {
		if (dataSet.tagId) {
			event.currentTarget = {
				id: dataSet.tagId
			}
		} else {
			event.currentTarget = {
				dataset: dataSet
			}
		}
	}
}
