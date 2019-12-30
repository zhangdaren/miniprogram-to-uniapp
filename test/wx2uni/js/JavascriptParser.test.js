const expect = require('chai').expect;
const JavascriptParser = require('../../../src/wx2uni/js/JavascriptParser');
const javascriptParser = new JavascriptParser();

describe('javascriptParser.getAliasThisNameList()的测试', function () {
    //var let const
    it('javascriptParser.getAliasThisNameList("const that = this;") = {"that":true}', function () {
        expect(javascriptParser.getAliasThisNameList("const that = this;")).to.be.deep.equal({ that: true })
    });
    it('javascriptParser.getAliasThisNameList("let that = this;") = {"that":true}', function () {
        expect(javascriptParser.getAliasThisNameList("let that = this;")).to.be.deep.equal({ that: true })
    });
    it('javascriptParser.getAliasThisNameList("var that = this;") = {"that":true}', function () {
        expect(javascriptParser.getAliasThisNameList("var that = this;")).to.be.deep.equal({ that: true })
    });
    //分号
    it('javascriptParser.getAliasThisNameList("const that = this") = {"that":true}', function () {
        expect(javascriptParser.getAliasThisNameList("const that = this")).to.be.deep.equal({ that: true })
    });
    it('javascriptParser.getAliasThisNameList("const _this = this;") = {"that":true}', function () {
        expect(javascriptParser.getAliasThisNameList("const _this = this;")).to.be.deep.equal({ _this: true })
    });
    it('javascriptParser.getAliasThisNameList("const a = this;") = {"that":true}', function () {
        expect(javascriptParser.getAliasThisNameList("const a = this;")).to.be.deep.equal({ a: true })
    });

    //变态检测
    it('javascriptParser.getAliasThisNameList("const computed = this.$options();") = {}', function () {
        expect(javascriptParser.getAliasThisNameList("const computed = this.$options();")).to.be.deep.equal({})
    });
    
    it('javascriptParser.getAliasThisNameList("const { computed } = this.$options();") = {}', function () {
        expect(javascriptParser.getAliasThisNameList("const { computed } = this.$options();")).to.be.deep.equal({})
    });

    it('javascriptParser.getAliasThisNameList("const { computed } = this;") = {}', function () {
        expect(javascriptParser.getAliasThisNameList("const { computed } = this;")).to.be.deep.equal({})
    });

    it('javascriptParser.getAliasThisNameList("const computed = this["abc"]") = {}', function () {
        expect(javascriptParser.getAliasThisNameList("const computed = this['abc']")).to.be.deep.equal({})
    });
});
