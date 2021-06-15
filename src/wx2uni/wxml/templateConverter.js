const path = require('path')
const fs = require('fs-extra')
const clone = require('clone')
const utils = require('../../utils/utils.js')
const pathUtil = require('../../utils/pathUtil.js')
const objectStringToObject = require('object-string-to-object')
// const paramsHandle = require('../paramsHandle');

/**
 * 小程序类型
 * 默认为wx
 */
var mpType = 'wx'

/**
 * 小程序类型扩展
 * 默认为wx:  百度为s-
 */
var mpTypeExt = 'wx:'

/**
 * 去掉属性的值的双括号，然后将值里面的双引号改为单引号
 * @param {*} attr
 */
function repairAttr (attr) {
    return attr.replace(/{{ ?(.*?) ?}}/, '$1').replace(/\"/g, "'")
}


//html标签替换规则，可以添加更多
var attrConverterConfigUni = null

/**
 * 根据attr的值进行相应替换
 * @param {*} key
 * @param {*} value
 */
function getAttrConverterConfig (key, value) {
    if (attrConverterConfigUni === null) {
        attrConverterConfigUni = {
            bindtap: {
                key: '@tap',
                value: (str) => {
                    return repairAttr(str)
                },
            },
            //参考：https://www.cnblogs.com/baohanblog/p/12457490.html
            'capture-bind:tap': {
                key: '@tap',
                value: (str) => {
                    return repairAttr(str)
                },
            },
            'bind:tap': {
                key: '@tap',
                value: (str) => {
                    return repairAttr(str)
                },
            },
            bindinput: {
                key: '@input',
            },
            bindgetuserinfo: {
                key: '@getuserinfo',
            },
            catchtap: {
                key: '@tap.stop',
                value: (str) => {
                    return repairAttr(str)
                },
            },
            'capture-catch:tap': {
                key: '@tap.stop',
                value: (str) => {
                    return repairAttr(str)
                },
            },
            'catch:tap': {
                key: '@tap.stop',
                value: (str) => {
                    return repairAttr(str)
                },
            },
            'data-ref': {
                key: 'ref',
                value: (str) => {
                    return repairAttr(str)
                },
            },
            //支付宝小程序
            'onTap': {
                key: '@tap',
                value: (str) => {
                    return repairAttr(str)
                },
            },
            'reportSubmin': {
                key: 'report-submit',
                value: (str) => {
                    return repairAttr(str)
                },
            },
            'model:value': {
                key: 'v-model',
                value: (str) => {
                    return repairAttr(str)
                },
            },
        }

        attrConverterConfigUni[mpType + ':if'] = {
            key: 'v-if',
            value: (str) => {
                return repairAttr(str)
            },
        }
        attrConverterConfigUni[mpType + '-if'] = {
            key: 'v-if',
            value: (str) => {
                return repairAttr(str)
            },
        }
        attrConverterConfigUni[mpType + ':else'] = {
            key: 'v-else',
            value: (str) => {
                return repairAttr(str)
            },
        }
        attrConverterConfigUni[mpType + ':elif'] = {
            key: 'v-else-if',
            value: (str) => {
                return repairAttr(str)
            },
        }
        attrConverterConfigUni[mpType + '-else'] = {
            key: 'v-else',
            value: (str) => {
                return repairAttr(str)
            },
        }
        attrConverterConfigUni[mpType + '-elif'] = {
            key: 'v-else-if',
            value: (str) => {
                return repairAttr(str)
            },
        }
    }

    var obj = attrConverterConfigUni[key]
    if (!obj) {
        var newKey = ""
        switch (key) {
            case "openType":
                newKey = "open-type"
                break
            case "formType":
                newKey = "form-type"
                break
            case "scrollX":
                newKey = "scroll-x"
                break
            case "scrollY":
                newKey = "scroll-y"
                break
        }
        if (newKey) {
            if (value.indexOf("{{") > -1) {
                newKey = ":" + newKey
            }
            obj = {
                key: newKey,
                value: (str) => {
                    return repairAttr(str)
                },
            }
        }
    }
    return obj
}

/**
 * 替换bind为@，有两种情况：bindtap="" 和 bind:tap=""
 */
function replaceBindToAt (attr) {
    return attr.replace(/^bind:*/, '@')
}

/**
 * 替换wx:abc为:abc
 */
function replaceWxBind (attr) {
    let reg = ""
    switch (global.mpType) {
        case 'weixin':
        case 'qq':
            reg = new RegExp('^' + mpType + ':')
            break
        case 'toutiao':
            reg = /^tt:/
            break
        case 'alipay':
            reg = /^a:/
            break
        case 'baidu':
            reg = /^s-/
            break
    }
    return attr.replace(reg, ':')
}

/**
 * 遍历往上查找祖先，看是否有v-for存在，存在就返回它的key，不存在返回空
 */
function findParentsWithFor (node) {
    if (node.parent) {
        if (node.parent.attribs['v-for']) {
            return node.parent.attribs[':key']
        } else {
            return findParentsWithFor(node.parent)
        }
    }
}

/**
 * 遍历往上查找祖先，看是否有同名的item存在，存在就返回true, 不存在返回false
 */
function findParentsWithItemName (node) {
    if (node.parent) {
        if (node.parent.attribs['v-for']) {
            return node.parent.attribs[':key']
        } else {
            return findParentsWithFor(node.parent)
        }
    }
}


//表达式列表
const expArr = ['+', '-', '*', '/', '?']
/**
 * 查找字符串里是否包含加减乘除以及？等表达式
 * @param {*} str
 */
function checkExp (str) {
    let result = false
    if (str) {
        result = expArr.some(function (exp) {
            return str.indexOf(exp) > -1
        })
    }
    return result
}

/**
 * 疑难代码处理(暂时处理一下)sss
 * htmlparse2在解析<view>{{a<1?2:0}}<text>{{chigua}}</text></view>时，会将小于号解析为标签的开头，导致解析出问题
 */
function difficultCodeHandle (node) {
    if (node.type === 'tag') {
        //如果tag的name里包含?时
        if (node.name.indexOf('?') > -1) {
            var txt = ''
            if (node.children) {
                for (const key in node.children) {
                    const item = node.children[key]
                    txt += item.data + '</' + item.type + '>'
                    difficultCodeHandle(item)
                }
            }
            delete node.children
            //修改tag类型
            node.type = 'text'
            node.data = '<' + node.name + '>' + txt
        }
    }
}

/**
 * 含有wx:for的标签处理
 * @param {*} node
 */
function forTagHandle (node, attrs, file_wxml) {
    //wx:for单独处理
    //wx:key="*item" -----不知道vue支持不
    /**
     * wx:for规则:
     *
     * 情况一：
     * <block wx:for="{{uploadImgsArr}}" wx:key="">{{item.savethumbname}}</block>
     * 解析规则：
     * 1.没有key时，设为index
     * 2.没有wx:for-item时，默认设置为item
     *
     * 情况二：
     * <block wx:for="{{hotGoodsList}}" wx:key="" wx:for-item="item">
     * 		<block wx:for="{{item.markIcon}}" wx:key="" wx:for-item="subItem">
     *   		<text>{{subItem}}</text>
     *  	</block>
     * </block>
     * 解析规则：同上
     *
     *
     * 情况三：
     * <block wx:for-items="{{countyList}}" wx:key="{{index}}">
     *     <view data-index="{{index}}" data-code="{{item.cityCode}}">
     *     		<view>{{item.areaName}}</view>
     *     </view>
     * </block>
     * 解析规则：同上
     *
     * 情况四：
     * <view wx:for="{{list}}" wx:key="{{index}}">
     *		<view wx:for-items="{{item.child}}" wx:key="{{index}}" data-id="{{item.id}}" wx:for-item="item">
     *		</view>
     * </view>
     * 解析规则：
     * 1.wx:for同上
     * 2.遍历到wx:for-items这一层时，如果有wx:for-item属性，且parent含有wx:for时，将wx:for-item的值设置为parent的wx:for遍历出的子元素的别称
     *
     * 情况五：
     * <view wx:for="{{giftList}}" wx:key="item" wx:for-index="idx"></view>
     * 解析规则：
     * 1. wx:key和wx:for-index共存时，优先使用wx:for-index作为key（错误！！！！）
     * 1. 直接忽略wx:key
     *
     */

    //这里预先设置wx:for是最前面的一个属性，这样会第一个被遍历到
    // let wx_key = node.attribs['wx:key'];
    let wx_key = ""
    let wx_forIndex = node.attribs[mpTypeExt + 'for-index']

    //有定义for-index时，优先使用wx_forIndex
    if (wx_forIndex) {
        wx_key = wx_forIndex
    } else {
        wx_key = "index"
    }

    //处理wx:key="this"或wx:key="*this"的情况
    //如果wx:key="*this"、wx:key="*item"或wx:key="*"时，那么直接设置为空
    // if (wx_key && (wx_key === 'this' || wx_key.indexOf('*') > -1)) {
    //     wx_key = '';
    // } else if (checkExp(wx_key)) {
    //     //处理<block wx:for="{{5-num}}" wx:key="{{num + index}}"></block>的情况
    //     wx_key = 'index';
    // } else if (/<|>/.test(wx_key)) {
    //     //<block wx:for="{{rechargelist}}" wx:for-item="items" wx:key="index<=6">
    //     wx_key = wx_key.split(/<|>/)[0];
    // }

    let wx_for = node.attribs[mpTypeExt + 'for']
    let wx_forItem = node.attribs[mpTypeExt + 'for-item']
    let wx_forItems = node.attribs[mpTypeExt + 'for-items']
    //wx:for与wx:for-items互斥
    let value = wx_for ? wx_for : wx_forItems

    if (wx_forItem === "in") {
        const code = templateParser.astToString([node])
        let logStr = "[Error] 检测到wx:for-item的值为in，in为uniapp系统变量，请转换后自行调整代码   file-> " + path.relative(global.miniprogramRoot, file_wxml) + "   code-> " + code
        global.log.push(logStr)
        utils.log(logStr)
    }

    if (value) {
        //处理<view wx:for="{{ dates }}" wx:key="dates"></view>
        if (value.replace(/{{\s*(.*?)\s*}}/, '$1').trim() === wx_key)
            wx_key = 'index'

        //替换{{}}
        if (wx_key) {
            wx_key = wx_key.trim()
            wx_key = wx_key.replace(/{{\s*(.*?)\s*}}/, '$1').replace(/\"/g, "'")
            //修复index，防止使用的item.id来替换index
            wx_key = wx_key.indexOf('.') === -1 ? wx_key : 'index'

            //修复for-item与key值相等的情况
            // <view wx:for="{{goods}}" wx:for-item="good" wx:key="{{good}}"></view>
            if (wx_forItem === wx_key) wx_key = 'index'
        }

        //有种情况是直接将item设置为key，如：<view wx:for="{{school}}" wx:key="{{item}}"></view>
        if (wx_key === 'item' || wx_key === 'id') wx_key = 'index'

        //居然有把in设置为wx:for-index的 || wx_key === 'in'
        // <block wx:for="{{adds}}" wx:for-index="in" wx:for-item="it">
        //     <view class="address2" data-id="{{in}}" bindtap="address2" style="{{ in== tid ? 'background: #f45b36; color:white;' : '' }}">
        //         {{ it }} </view>
        // </block>
        //虽然可以直接将wx:for-index修改为index，但要再将底下面的引用到的变量一并修改时，过于繁琐，因此令作提示

        if (wx_key === "in") {
            const code = templateParser.astToString([node])
            let logStr = "[Error] 检测到wx:for-index的值为in，in为uniapp系统变量，请转换后自行调整代码   file-> " + path.relative(global.miniprogramRoot, file_wxml) + "   code-> " + code
            global.log.push(logStr)
            utils.log(logStr)
        }

        //------------处理wx:key------------
        //查找父级的key
        let pKey = findParentsWithFor(node)
        if (pKey && pKey.indexOf('index') > -1) {
            let count = pKey.split('index').join('')
            if (count) {
                count = parseInt(count)
            } else {
                count = 1 //如果第一个找到的父级的key为index时，则默认为1
            }
            count++ //递增
            wx_key = wx_key && pKey != wx_key ? wx_key : 'index' + count
        } else {
            wx_key = wx_key ? wx_key : 'index'
        }

        //设置for-item默认值
        wx_forItem = wx_forItem ? wx_forItem : 'item'

        if (value) {
            //判断是wx:for里是否已经包含in了
            if (value.indexOf(' in ') == -1) {
                //将双引号转换单引号
                value = value.replace(/\"/g, "'")
                value = value.replace(
                    /{{\s*(.*?)\s*}}/,
                    '(' + wx_forItem + ', ' + wx_key + ') in $1'
                )

                if (
                    value == node.attribs[mpTypeExt + 'for'] ||
                    value == node.attribs[mpTypeExt + 'for-items']
                ) {
                    //奇葩!!! 小程序写起来太自由了，相比js有过之而无不及，{{}}可加可不加……我能说什么？
                    //这里处理无{{}}的情况
                    value = '(' + wx_forItem + ', ' + wx_key + ') in ' + value
                }
            } else {
                //处理包含in的情况，如：wx:for="item in 12"
                //这里粗糙处理一下，官方也没有这种写法
                let tmpArr = value.split(' in ')
                let str1 = tmpArr[0]
                if (str1.indexOf(',') == -1) {
                    str1 += ', ' + wx_key
                }
                value = '(' + str1 + ') in ' + tmpArr[1]
            }

            attrs['v-for'] = value

            if (node.attribs.hasOwnProperty(mpTypeExt + 'for'))
                delete node.attribs[mpTypeExt + 'for']
            if (node.attribs.hasOwnProperty(mpTypeExt + 'for-index'))
                delete node.attribs[mpTypeExt + 'for-index']
            if (node.attribs.hasOwnProperty(mpTypeExt + 'for-item'))
                delete node.attribs[mpTypeExt + 'for-item']
            if (node.attribs.hasOwnProperty(mpTypeExt + 'for-items'))
                delete node.attribs[mpTypeExt + 'for-items']
        }
    } else {
        const code = templateParser.astToString([node])
        utils.log('当前这个标签只有一个' + mpType + +':key --> ' + code)
    }
    attrs[':key'] = wx_key
    if (node.attribs.hasOwnProperty(mpTypeExt + 'key'))
        delete node.attribs[mpTypeExt + 'key']
}

/**
 * include tag 处理
 * @param {*} node
 * @param {*} file_wxml
 */
function includeTagHandle (node, file_wxml) {
    if (node.name === 'include') {
        const wxmlFolder = path.dirname(file_wxml)

        let fileKey = pathUtil.getFileKey(file_wxml)
        let src = node.attribs.src
        src = pathUtil.relativePath(src, global.miniprogramRoot, wxmlFolder)
        let absSrc = path.join(wxmlFolder, src)
        let includeFileKey = pathUtil.getFileKey(absSrc)
        //
        let tempStr = templateParser.astToString([node])
        let attrsStr = ''
        for (const key in node.attribs) {
            const value = node.attribs[key]
            if (key == 'src') {
                attrsStr += ' data-' + key + '="' + value + '"'
            } else {
                attrsStr += ' ' + key + '="' + value + '"'
            }
        }

        let obj = {
            attrs: attrsStr,
            curFileKey: fileKey,
            includeTag: tempStr,
            includeWxmlAbsPath: absSrc,
            includeFileKey: includeFileKey
        }

        global.includeInfo.push(obj)
    }
}
/**
 * 在处理之前先把变量处理一下
 * 20200418->减少侵入，也因为修复不完全，不再进行重名！
 */
function beforeTemplateConverter (node, file_wxml, isComponent) {
    for (const k in node.attribs) {
        //试运行：修复template里id或default变量
        let oldValue = node.attribs[k]
        let newValue = paramsHandle(oldValue, isComponent)
        node.attribs[k] = newValue
    }
}

/**
 * template tag 处理
 * @param {*} node
 */
function templateTagHandle (node, file_wxml, onlyWxmlFile) {
    let newNode = null
    //处理template标签<template is="head" data="{{title: 'addPhoneContact'}}"/>
    if (node.name == 'template') {
        // 	包含is属性的才是页面里面的<template/>标签，否则为被引入的那个组件
        let templateName = node.attribs.is
        let fileKey = pathUtil.getFileKey(file_wxml)
        if (templateName) {
            let dataAttr = node.attribs.data
            if (templateName === 'wxParse') {
                // wxParse单独处理，鉴于wxParse的data造型都是非常规律，在这里直接使用正则搞定就不花里胡哨了。
                //<template is="wxParse" data="{{ wxParseData:content.nodes }}"></template>
                var reg_val = /wxParseData:(.*?)\.nodes/i
                if (dataAttr) {
                    let varName = ''
                    if (reg_val.test(dataAttr)) {
                        let val = dataAttr.match(reg_val)[1]
                        if (/\[|\]/.test(val)) {
                            varName = dataAttr.match(reg_val)[1]
                        } else {
                            varName = dataAttr.match(reg_val)[1]
                            if (varName !== "article") {
                                //加个前缀以防冲突
                                varName = "article_" + varName
                            }

                            //处理：<template is="wxParse" data="{{wxParseData: (goodsDetail.nodes || '无描述')}}" />
                            //仅提取变量，"或"操作符和三元运算符暂不考虑。
                            varName = varName.replace(/[\s\(\[]/g, '') //替换掉空格和括号
                        }
                    } else {
                        varName = dataAttr
                            .replace(/wxParseData:/, '')
                            .replace(/{{(.*?)}}/, '$1')

                        //处理：<template is="wxParse" data="{{wxParseData: (goodsDetail.nodes || '无描述')}}" />
                        //仅提取变量，"或"操作符和三元运算符暂不考虑。
                        varName = varName.replace(/[\s\(\[]/g, '') //替换掉空格和括号
                    }

                    if (global.hasVant) {
                        newNode = {
                            type: 'tag',
                            name: 'view',
                            attribs: {
                                'v-html': varName
                            }
                        }
                    } else {
                        newNode = {
                            type: 'tag',
                            name: 'mp-html',
                            attribs: {
                                ':content': varName
                            }
                        }
                    }

                    isContinue = true
                }
            } else {
                // utils.log("template is=", templateName);
                //有is属性的<template/>是用来渲染的元素
                if (dataAttr) {
                    let replacePropsMap = utils.parseTemplateAttrParams(
                        dataAttr
                    )
                    let logStr =
                        'template里的data属性 ==> "' +
                        dataAttr +
                        '"     需要替换的属性 ==> ' +
                        JSON.stringify(replacePropsMap)
                    // utils.log(logStr);

                    let tagList = global.templateInfo['tagList']
                    let info = {
                        name: templateName,
                        templateTag: node,
                        curFileKey: fileKey,
                        replacePropsMap: replacePropsMap
                    }
                    tagList.push(info)
                }
            }
        } else {
            //有name属性时，它就是一个类似于include的对象
            const nameAttr = node.attribs.name
            if (nameAttr) {
                if (!onlyWxmlFile) {
                    //如果当前文件不是单个wxml文件，而是在某个页面里面的话，那就将它提取出来并放入components里，作为单独文件
                    if (!global.globalTemplateComponents[nameAttr])
                        global.globalTemplateComponents[nameAttr] = {}
                    //
                    global.globalTemplateComponents[nameAttr].path = file_wxml
                    const alias = utils.getComponentAlias(nameAttr)
                    global.globalTemplateComponents[nameAttr].alias = alias
                    // utils.log(node, node.children)
                    global.globalTemplateComponents[nameAttr].ast = node
                }

                //有可能同时含有data属性
                // node.attribs["data-bak"] = node.attribs["data"];
                delete node.attribs["data"]

                let templateList = global.templateInfo['templateList']
                if (!templateList[nameAttr]) templateList[nameAttr] = {}
                templateList[nameAttr]['curFileKey'] = fileKey
                templateList[nameAttr]['ast'] = node.children
                templateList[nameAttr]['oldAst'] = [node] //加[]是为了包含当前标签
            }
        }
    }
    return newNode
}

/**
 * wxs tag 处理
 * @param {*} node
 * @param {*} file_wxml
 */
function wxsTagHandle (node, file_wxml) {
    const wxmlFolder = path.dirname(file_wxml)
    const fileName = pathUtil.getFileNameNoExt(file_wxml)

    // key为文件路径 + 文件名(不含扩展名)组成
    let key = path.join(wxmlFolder, fileName)
    //
    if (!global.pageWxsInfo[key]) global.pageWxsInfo[key] = []

    //处理wxs标签 <wxs src="./../logic.wxs" module="logic" />
    let module = node.attribs.module
    let src = node.attribs.src //src不一有值

    //
    let tmpObj = {}
    if (src) {
        //说明是外链的
        // utils.log("src---", src);
        src = pathUtil.relativePath(src, global.miniprogramRoot, wxmlFolder)
        tmpObj = {
            module: module,
            type: 'link',
            src: src,
            content: ''
        }
    } else {
        //说明是有内容的，需要将内容写入到文件里
        let content = ''
        let children = node.children
        children.forEach(obj => {
            content += obj.data || ''
        })
        // utils.log("content---", content);
        tmpObj = {
            module: module,
            type: 'insert',
            src: './' + module + '.wxs',
            content: content
        }
    }
    global.pageWxsInfo[key].push(tmpObj)
}

/**
 * 其它标签属性处理
 * @param {*} node
 * @param {*} attrs
 * @param {*} k
 * @returns 返回修改后的key
 */
function otherTagHandle (node, attrs, k) {
    const reg_tag = /{{.*?}}/ //注：连续test时，这里不能加/g，因为会被记录上次index位置

    // "../list/list?type={{ item.key }}&title={{ item.title }}"
    // "'../list/list?type=' + item.key ' + '&title=' + item.title"

    //替换带有bind前缀的key，避免漏网之鱼，因为实在太多情况了。
    let wx_key = replaceBindToAt(k)
    attrs[wx_key] = node.attribs[k]

    //替换xx="xx:'{{}}';" 为xx="xx:{{}};"
    //测试用例：
    //<view style="width:'{{width}}'"></view>
    //<view style="background-image:url('{{iconURL}}')"></view>
    //<view style="background-image:url('{{iconURL}}/invitation-red-packet-btn.png')"></view>
    //<view style='font-weight:{{item.b==1? "bold": "normal"}};'></view>
    //<view style="width:{{percent}}% }};"></view> //原始代码有问题
    //<view class="span goods-alter-video {{selectType=='video'?'on':''}}}}">视频</view>  //原始代码有问题，难得一遇。。。

    //首先，如果碰到有四个括号的，先转换为两个括号
    attrs[wx_key] = attrs[wx_key].replace(/\}\}\}\}/, "}}")
        .replace(/url\(['"](.*?{{.*?}}.*?)['"]\)/g, 'url($1)')
        .replace(/['"]{{(.*?)}}['"]/g, '{{$1}}')

    if (wx_key == k) {
        wx_key = replaceWxBind(k)
        if (wx_key != k) {
            attrs[wx_key] = attrs[k]
            delete attrs[k]
        }
    }

    //其他属性
    //处理下面这种嵌套关系的样式或绑定的属性
    //style="background-image: url({{avatarUrl}});color:{{abc}};font-size:12px;"
    let value = attrs[wx_key]
    //将双引号转换单引号
    value = value.replace(/\"/g, "'")

    //<navigator class="slist" url="{{(!items.status && !items.reward)?'../notes/notes':items.active_type == 1?'../active/active?id='+items.id:'../active1/active1?id='+items.id}}"></navigator>
    //查找{{}}里是否有?，有就加个括号括起来
    //处理这种情况：<view class="abc abc-d-{{item.id}} {{selectId===item.id?'active':''}}"></view>
    value = value.replace(/{{(.*?)}}/g, function (match, $1) {
        if (checkExp(match) && match !== value) {
            match = '{{(' + $1 + ')}}'
        }
        return match
    })

    let hasBind = reg_tag.test(value)
    let isObject = /^\{['"].*?\}$/.test(value)
    if (isObject) {
        //试处理类似于下面这种，绑定的是一个大的对象
        //<button sessionFrom="{'nickname': '{{userInfo.nickname}}', 'avatarUrl': '{{userInfo.avatar}}'}"></button>

        let reg1 = /^(.*?){{|}}(.*?){{|}}(.*?)$/g //除去{{}}之外的内容
        let reg2 = /{{(.*?)}}/g //{{}}里的内容，不知为啥两个正则没法写成一个。

        value = value.replace(reg2, function (match, $1) {
            if (checkExp($1)) {
                match = '" + (' + $1 + ') + "'
            } else {
                match = '" + ' + $1 + ' + "'
            }
            return match
        })

        //试处理：<view url="/page/url/index={{item.id}}&data='abc'"></view>
        //<view style="{{iphoneXBottom=='68rpx'?'padding-bottom:150rpx':''}}"></view>
        let tmpArr = value.split(' + ')
        let tmpReg = /([a-zA-Z0-9])='(.*?)'(?!\?)/g
        tmpArr.forEach((str, index) => {
            tmpArr[index] = str.replace(tmpReg, function (match, $1, $2) {
                return $2 ? $1 + '=' + $2 : match
            })

            //去除引号
            tmpArr[index] = tmpArr[index].replace(/'/g, '')
        })
        value = tmpArr.join(' + ')

        //替换引号为单引号
        value = value.replace(/"/g, "'")
        value = "'" + value + "'"

        value = utils.removeSingleQuote(value)

        attrs[':' + wx_key] = value
        delete attrs[wx_key]
    } else if (hasBind) {
        let reg1 = /(?!^){{ ?/g //中间的{{
        let reg2 = / ?}}(?!$)/g //中间的}}
        let reg3 = /^{{ ?/ //起始的{{
        let reg4 = / ?}}$/ //文末的}}

        value = value.replace(reg1, "' + ").replace(reg2, " + '")

        //单独处理前后是否有{{}}的情况
        if (reg3.test(value)) {
            //有起始的{{的情况
            value = value.replace(reg3, '')
        } else {
            value = "'" + value
        }
        if (reg4.test(value)) {
            //有结束的}}的情况
            value = value.replace(reg4, '')
        } else {
            value = value + "'"
        }

        //试处理：<view url="/page/url/index={{item.id}}&data='abc'"></view>
        //<view style="{{iphoneXBottom=='68rpx'?'padding-bottom:150rpx':''}}"></view>
        let tmpArr = value.split(' + ')
        let tmpReg = /([a-zA-Z0-9])='(.*?)'(?!\?)/g
        tmpArr.forEach((str, index) => {
            tmpArr[index] = str.replace(tmpReg, function (match, $1, $2) {
                let result = match
                //规避切出来是d='+items.id:'而解析不对
                if (!/['"]\+|\+['"]/.test(match)) {
                    result = $2 ? $1 + '=' + $2 : match
                }
                return result
            })
        })
        value = tmpArr.join(' + ')

        value = utils.removeSingleQuote(value)

        if (wx_key == k) {
            //处理<view style="display:{{}}"></view>，转换后，可能末尾多余一个+，编译会报错
            if (/\+$/.test(value)) value = value.replace(/\s*\+$/, '')
            //
            attrs[':' + wx_key] = value
            delete attrs[wx_key]
        } else {
            attrs[wx_key] = value
        }
    } else {
        value = utils.removeSingleQuote(value)

        attrs[wx_key] = value
    }

    return wx_key
}

/**
 * image 标签的src属性处理
 * @param {*} node
 * @param {*} file_wxml
 */
function imageTagHandle (node, file_wxml) {
    const reg_tag = /{{.*?}}/ //注：连续test时，这里不能加/g，因为会被记录上次index位置
    const reg_src = /(['"])(.*?)(['"])/g
    /**
     * 严格匹配
     * 仅匹配以.或/开头，且含图片后缀名的字符串，如"/hyb_o2o/resource/images/icon-love-1.png"
     * 因为template里可能会有拼接的路径，如果放开，可能会有风险！
     * 现在先这么试行着~
     */
    const reg_file = /^[\.\/].*?\.(jpg|jpeg|gif|svg|png)$/
    const wxmlFolder = path.dirname(file_wxml)

    //处理template image标签下面的src路径(这里要先进行转换，免得后面src可能转换为:src了)
    //e:\zpWork\Project_self\miniprogram-to-uniapp\test\test2\index\images\ic_detail_blue.png
    //e:\zpWork\Project_self\miniprogram-to-uniapp\test\test2\static\images\ic_detail_blue.png
    //处理规则：
    //将所有素材转换为static目录下的路径，以当前正在处理的文件所在的目录作为参照，切为相对路径
    //直接提取父目录的目标名加文件名作为static下面的相对路径
    // if (node.name === 'image') {
    //可能有<cover-image class="photoImg" mode="aspectFit" src="../../images/41.png"></cover-image>
    if (node.attribs && node.attribs.src) {
        let reg = /\.(jpg|jpeg|gif|svg|png)$/ //test时不能加/g

        //image标签，处理src路径
        let src = node.attribs.src.trim()
        if (reg_tag.test(src)) {
            // {{这里是拼接的路径}}
            node.attribs.src = src.replace(reg_src, function (match, $1, $2, $3) {
                if (reg_file.test($2)) {
                    $2 = pathUtil.replaceAssetPath(
                        $2,
                        global.miniprogramRoot,
                        wxmlFolder
                    )
                }
                return $1 + $2 + $3
            })
        } else {
            if (reg.test(src)) {
                if (global.isVueAppCliMode) {
                    node.attribs.src = src
                } else {
                    // //当前处理文件所在目录
                    node.attribs.src = pathUtil.replaceAssetPath(
                        src,
                        global.miniprogramRoot,
                        wxmlFolder
                    )
                }
            } else {
                if (reg.test(src) && !global.isVueAppCliMode) {
                    let logStr =
                        '[Tip] image漏网之鱼:    src--> "' +
                        node.attribs.src +
                        '"     file--> ' +
                        path.relative(global.miniprogramRoot, file_wxml)
                    // utils.log(logStr);
                    global.logArr.fish.push(logStr)
                }
            }
        }


    }
}

/**
 * wmxml转换
 *  style="color: {{step === index + 1 ? 'red': 'black'}}; font-size:{{abc}}">
 *  <view style="width : {{item.dayExpressmanEarnings / maxIncome * 460 + 250}}rpx;"></view>
 *
 * @param {*} ast 抽象语法树
 */
const templateConverter = async function (
    ast,
    file_wxml,
    onlyWxmlFile,
    templateParser
) {
    const fileKey = pathUtil.getFileKey(file_wxml)
    let extname = path.extname(file_wxml)
    mpType = utils.getAttrPrefixExtname(extname)
    mpTypeExt = utils.getAttrPrefixExtname(extname, true)

    const isComponent =
        (global.pagesData[fileKey] &&
            global.pagesData[fileKey]['data'] &&
            global.pagesData[fileKey]['data']['component']) ||
        false

    if (!global.pagesData[fileKey]['data']['attribs']) {
        global.pagesData[fileKey]['data']['attribs'] = []
    }
    for (let i = ast.length - 1;i >= 0;i--) {
        let node = ast[i]

        //处理标签上面的属性
        //20200418->减少侵入，也因为修复不完全，不再进行重名！
        // beforeTemplateConverter(node, file_wxml, isComponent);

        //检测到是html节点
        if (node.type === 'tag') {
            //处理import标签
            if (node.name === 'import') {
                //<import src="../plugin/plugin.wxml"/>这类标签，注释
                const code = templateParser.astToString([node])
                let newNode = {
                    data: code,
                    type: "comment"
                }
                ast[i] = newNode
                continue
            } else if (node.name === 'wxs') {
                //wxs标签处理
                wxsTagHandle(node, file_wxml)
                delete ast[i]
                continue
            } else if (node.name === 'official-account') {
                //公众号关注组件 仅微信小程序支持， 条件编译
                const comment = { type: "comment", data: "[miniprogram-to-uniapp] 公众号关注组件 仅微信小程序支持" }
                const platformStartOld = { type: "comment", data: " #ifdef MP-WEIXIN " }
                const platformStartNew = { type: "comment", data: " #ifndef MP-WEIXIN " }
                const breakWord = { type: "text", data: "\r\n" }
                const platformEnd = { type: "comment", data: " #endif " }
                const oldNode = node
                const newNode = { type: "tag", name: "view", children: [{ type: "text", data: "当前为非微信小程序环境，不支持公众号关注组件，请自行调整当前弹窗内容！" }] }
                ast.splice(i, 1,
                    breakWord,
                    comment, breakWord,
                    platformStartOld, breakWord,
                    oldNode, breakWord,
                    platformEnd, breakWord,
                    breakWord,

                    platformStartNew, breakWord,
                    newNode, breakWord,
                    platformEnd, breakWord,
                    breakWord,
                )

                let logStr = "[Tip] 检测到公众号关注组件<official-account/>，仅微信小程序支持，已作条件编译处理。        file-> " + path.relative(global.miniprogramRoot, file_wxml)
                global.log.push(logStr)
                utils.log(logStr)
            } else {
                //疑难代码处理
                difficultCodeHandle(node)
            }

            if (node.name == "picker" && node.attribs.mode === "region") {
                //TODO：使用第三方替代,如uview（因template代码复杂，目测有点难度）
                // let logStr = "[Tip] 检测到组件picker的mode为 region ，在App和H5里未实现，请转换后自行作兼容处理。        file-> " + path.relative(global.miniprogramRoot, file_wxml)
                // utils.log(logStr)
                // global.log.push(logStr)

                //使用 https://ext.dcloud.net.cn/plugin?id=1536 替换
                node.name = "region-picker"
                delete node.attribs.mode

                let logStr = "[Tip] 检测到组件picker的mode为 region ，在App和H5里未实现，已使用组件region-picker进行替换。        file-> " + path.relative(global.miniprogramRoot, file_wxml)
                utils.log(logStr)
                global.log.push(logStr)
            }

            if (node.name == "image" && /\/$/.test(node.attribs.src)) {
                //TODO：使用第三方替代,如uview（因template代码复杂，目测有点难度）
                let logStr = `[Tip] 检测到组件image的src可能为无效路径: "${ node.attribs.src }" ，请转换后自行处理。        file-> ` + path.relative(global.miniprogramRoot, file_wxml)
                utils.log(logStr)
                global.log.push(logStr)
            }


            //将template标签进行注释
            // if (node.name == 'template' && node.attribs && node.attribs.is) {
            //     const code = templateParser.astToString([node]);
            //     let newNode = {
            //         data: code,
            //         type: "comment"
            //     }
            //     ast.splice(Math.max(i - 1, 0), 0, newNode);
            // }

            //处理template标签<template is="head" data="{{title: 'addPhoneContact'}}"/>
            let newNode = templateTagHandle(node, file_wxml, onlyWxmlFile)
            if (newNode) {
                ast[i] = newNode
                continue
            }

            if (global.isTransformAssetsPath) {
                // 资源src路径替换，虽然uni-app暂时已经支持复制资源到static，但似乎还不完善。pages.json里的就没管了。
                imageTagHandle(node, file_wxml)
            }

            //todo: 需要优化一下
            const reg = /\}\}$/      //检测是否含括号
            const reg2 = /{{|}}/g    //去除括号
            const itemReg = /\bitem\./
            var itemName = "item"
            for (let k in node.attribs) {
                if (node.attribs["wx:for-item"]) {
                    itemName = node.attribs["wx:for-item"]
                }

                //检测括号是否匹配
                var oldValue = node.attribs[k]
                oldValue = oldValue.trim()
                if (oldValue && reg.test(oldValue) && oldValue.indexOf(itemName) === -1) {
                    oldValue.replace(/{{(.*?)}}/g, function (match, $1) {
                        var minValue = $1
                        minValue = minValue.trim()
                        // var minValue = oldValue.replace(reg2, "").trim()
                        if ((minValue !== 'true' && minValue !== 'false') && utils.isJavascriptKeyWord(minValue)) {
                            const code = templateParser.astToString([node])
                            let logStr = `[Error] 检测到标签属性 ${ k } 绑定的变量 ${ minValue } 是Javascript关键字，不能作为变量名，请转换后手动重命名！   file-> ` + path.relative(global.miniprogramRoot, file_wxml) + "   code-> " + code
                            global.log.push(logStr)
                            utils.log(logStr)
                        } else {
                            // 排除item.xx
                            if (!itemReg.test(minValue)) {
                                var originalType = utils.getOriginalTypeByattrKey(k)
                                utils.saveAttribsBindObject(fileKey, oldValue, node, {}, k, originalType)
                            }
                        }
                    })
                }
            }

            //进行属性替换
            let attrs = {}
            if (
                node.attribs[mpTypeExt + 'for'] ||
                node.attribs[mpTypeExt + 'for-items']
            ) {
                //wx:for处理
                forTagHandle(node, attrs, file_wxml)
            }



            const oldNode = clone(node)
            const reg_num = /^([+-]?\d+(\.\d+)?)$/
            for (let k in node.attribs) {
                //检测括号是否匹配
                var oldValue = node.attribs[k]
                oldValue = oldValue.trim()
                var isBracketOk = utils.bracketsJudge(oldValue)
                //
                let target = getAttrConverterConfig(k, oldValue)

                let key = k
                if (target) {
                    //单独判断style的绑定情况
                    key = target['key']
                    let value = node.attribs[k]
                    //将双引号转换单引号
                    value = value.replace(/\"/g, "'")

                    let hasBind = value.indexOf('{{') > -1
                    if (k == 'url') {
                        key = hasBind ? ':url' : this.key
                    }

                    var newValue = target['value'] ? target['value'](node.attribs[k]) : node.attribs[k]
                    attrs[key] = newValue
                } else {
                    //给template上面的属性，如果是数字则添加冒号，还有问题，比如<input :placeholder="0.00"> 要不要过滤？
                    // if (reg_num.test(node.attribs[k])) {
                    //     var newKey = ":" + k
                    //     attrs[newKey] = node.attribs[k]
                    //     delete node.attribs[k]
                    // }else{
                    //其他属性处理
                    key = otherTagHandle(node, attrs, k)
                    // }
                }

                if (key.indexOf("@") > -1) {
                    //函数
                    // console.log("函数：", key, value)

                    if (!global.pagesData[fileKey]['data']['attribFunList']) {
                        global.pagesData[fileKey]['data']['attribFunList'] = []
                    }
                    global.pagesData[fileKey]['data']['attribFunList'].push({
                        key: key,
                        value: attrs[key],
                        node: node
                    })
                }

                //如果括号不匹配
                if (!isBracketOk) {
                    var newValue = attrs[key] || attrs[":" + key]
                    let logStr = "[Error] 检测代码 " + k + "=\"" + oldValue + "\" 里括号不匹配(转换后引号不匹配)，请转换后自行进入文件内进行修改，转换后代码：" + key + "=\"" + newValue + "\"    file-> " + path.relative(global.miniprogramRoot, file_wxml)
                    global.log.push(logStr)
                    utils.log(logStr)
                }
            }

            node.attribs = attrs

            if (node.name === "slot" && node.attribs[":name"]) {
                //处理动态slot
                const platformStartNew = { type: "comment", data: " #ifdef H5 " }
                const platformStartOld = { type: "comment", data: " #ifndef H5 " }
                const breakWord = { type: "text", data: "\r\n" }
                const platformEnd = { type: "comment", data: " #endif " }
                const newNode = clone(node)
                ast.splice(i, 1,
                    breakWord,
                    platformStartNew, breakWord,
                    newNode, breakWord,
                    platformEnd, breakWord,

                    breakWord,
                    platformStartOld, breakWord,
                    oldNode, breakWord,
                    platformEnd, breakWord, breakWord,
                )
            }

            //处理include标签
            includeTagHandle(node, file_wxml)
        } else if (node.type === 'text') {
            //替换变量
            //20200418->减少侵入，也因为修复不完全，不再进行重名！
            // if (node.data.trim())
            //     node.data = paramsHandle(node.data, isComponent);

            var oldValue = node.data.trim()
            if (oldValue) {
                utils.saveAttribsBindObject(fileKey, oldValue, node, {}, "", "")
            }
        }

        //因为是树状结构，所以需要进行递归
        if (node.children && node.children.length) {
            await templateConverter(
                node.children,
                file_wxml,
                onlyWxmlFile,
                templateParser
            )
        }
    }
    return ast
}



module.exports = templateConverter
