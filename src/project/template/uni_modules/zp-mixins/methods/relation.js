/**
 * 组件间关系
 * 注意：须与p-f-unicom配合使用！！！
 * @param {*} name
 * @returns
 */
export function getRelationNodes(name) {
	if(!this.$unicom) throw "this.getRelationNodes()需与p-f-unicom配合使用！"
	return this.$unicom('@' + name)
}
