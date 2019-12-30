const expect = require('chai').expect;
const utils = require('../../src/utils/utils');


describe('utils.isURL()的测试', function () {
    //true
    it('utils.isURL("www.baidu.com") = true', function () {
        expect(utils.isURL("www.baidu.com")).to.be.equal(true)
    });
    it('utils.isURL("http://www.baidu.com") = true', function () {
        expect(utils.isURL("http://www.baidu.com")).to.be.equal(true)
    });
    it('utils.isURL("baidu.com/a.png") = true', function () {
        expect(utils.isURL("baidu.com/a.png")).to.be.equal(true)
    });
    it('utils.isURL("ftp://baidu.com/a.png") = true', function () {
        expect(utils.isURL("ftp://baidu.com/a.png")).to.be.equal(true)
    });
    it('utils.isURL("//www.baidu.com/xx.png") = true', function () {
        expect(utils.isURL("//www.baidu.com/xx.png")).to.be.equal(true)
    });
    //false
    it('utils.isURL("../xx/a.png") = false', function () {
        expect(utils.isURL("../xx/a.png")).to.be.equal(false)
    });
    it('utils.isURL("./xx/a.png") = false', function () {
        expect(utils.isURL("./xx/a.png")).to.be.equal(false)
    });
});

describe('utils.toCamel2()的测试', function () {
    //true
    it('utils.toCamel2("abc") = "abc"', function () {
        expect(utils.toCamel2("abc")).to.be.equal("abc")
    });
    it('utils.toCamel2("Abc") = "Abc"', function () {
        expect(utils.toCamel2("Abc")).to.be.equal("Abc")
    });
    it('utils.toCamel2("test-to-camel") = "testToCamel"', function () {
        expect(utils.toCamel2("test-to-camel")).to.be.equal("testToCamel")
    });
    it('utils.toCamel2("diy-imageSingle") = "diyImageSingle"', function () {
        expect(utils.toCamel2("diy-imageSingle")).to.be.equal("diyImageSingle")
    });
});


describe('utils.stringToObject()的测试', function () {
    it('utils.stringToObject("abc:xx") = {"abc":"xx"}', function () {
        expect(utils.stringToObject("abc:xx")).to.be.deep.equal({ "abc": "xx" })
    });
    it('utils.stringToObject("abc: xx") = {"abc":"xx"}', function () {
        expect(utils.stringToObject("abc: xx")).to.be.deep.equal({ "abc": "xx" })
    });
    it('utils.stringToObject("abc :  xx") = {"abc":"xx"}', function () {
        expect(utils.stringToObject("abc :  xx")).to.be.deep.equal({ "abc": "xx" })
    });
});

describe('utils.parseTemplateAttrParams()的测试', function () {

    it('utils.parseTemplateAttrParams("{{ item }}") = {}', function () {
        expect(utils.parseTemplateAttrParams("{{ item }}")).to.be.deep.equal({})
    });
    it('utils.parseTemplateAttrParams("{{ ...item }}") = {}', function () {
        expect(utils.parseTemplateAttrParams("{{ ...item }}")).to.be.deep.equal({})
    });
    it('utils.parseTemplateAttrParams("{{ item,dataType }}") = {}', function () {
        expect(utils.parseTemplateAttrParams("{{ item,dataType }}")).to.be.deep.equal({})
    });
    it('utils.parseTemplateAttrParams("{{ setting:setting }}") = {}', function () {
        expect(utils.parseTemplateAttrParams("{{ setting:setting }}")).to.be.deep.equal({})
    });
    it('utils.parseTemplateAttrParams("{{ diyform:order }}") = {"diyform":"order"}', function () {
        expect(utils.parseTemplateAttrParams("{{ diyform:order }}")).to.be.deep.equal({ "diyform": "order" })
    });
    it('utils.parseTemplateAttrParams("{{ listName:list,ImgRoot:imgroot }}") = { "listName":"list","ImgRoot":"imgroot" }', function () {
        expect(utils.parseTemplateAttrParams("{{ listName:list,ImgRoot:imgroot }}")).to.be.deep.equal({ "listName": "list", "ImgRoot": "imgroot" })
    });
    it('utils.parseTemplateAttrParams("{{ leftIndex:index+1,section3Title:item.title}}") = {"leftIndex":"index+1","section3Title":"item.title"}', function () {
        expect(utils.parseTemplateAttrParams("{{leftIndex:index+1,section3Title:item.title}}")).to.be.deep.equal({ "leftIndex": "index+1", "section3Title": "item.title" })
    });
    it('utils.parseTemplateAttrParams("{{ title: "action-sheet" }}") = {"title":"\"action-sheet\""}', function () {
        expect(utils.parseTemplateAttrParams('{{ title: "action-sheet" }}')).to.be.deep.equal({ "title": "\"action-sheet\"" })
    });

    it('utils.parseTemplateAttrParams("{{ isEnd:false,time:"[day, hour]" }}") = {"isEnd":"false","time":"[day, hour]"}', function () {
        expect(utils.parseTemplateAttrParams("{{ isEnd:false,time:[day, hour] }}")).to.be.deep.equal({ "isEnd": "false", "time": "[day, hour]" })
    });
    it('utils.parseTemplateAttrParams("{{ isEnd:false,time:{day:day,hour:hour}" }}") = {"isEnd":"false","time":"{day:day,hour:hour}"}}', function () {
        expect(utils.parseTemplateAttrParams("{{ isEnd:false,time:{day:day,hour:hour} }}")).to.be.deep.equal({ "isEnd": "false", "time": "{day:day,hour:hour}" })
    });
    let isShowPH = "test";
    it('utils.parseTemplateAttrParams("{{ type:isShowPH?\'ph\':\'list\',infos:item }}") = {type:"isShowPH?\'ph\':\'list\'",infos:item}', function () {
        expect(utils.parseTemplateAttrParams("{{ type:isShowPH?'ph':'list',infos:item }}")).to.be.deep.equal({ "type": "isShowPH?'ph':'list'", "infos": "item" })
    });
});