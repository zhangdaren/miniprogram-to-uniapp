class Vistor {
	constructor() {
		this.data = []
	}
	handle(path) {
		this.save(path)
	}
	save(path) {
		this.data.push(path);
	}
	getData() {
		return this.data
	}
}
module.exports = Vistor
