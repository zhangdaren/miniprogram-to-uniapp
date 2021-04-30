class Vistor {
    constructor () {
        this.data = []
    }
    handle (path) {
        this.save(path)
    }
    save (path) {
        this.data.push(path)
    }
    getData () {
        return this.data
    }
    check (keyName) {
        return this.data.some(function (item) {
            return item.key.name === keyName
        })
    }
    findPathByName (keyName) {
        return this.data.find((item, index) => {
            return item.key.name === keyName
        })
    }
    removeItemByKeyName (keyName) {
        this.data = this.data.filter(item => item.key.name !== keyName)
    }
}
module.exports = Vistor
