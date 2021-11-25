/*
 * @Author: zhang peng
 * @Date: 2021-08-19 11:15:31
 * @LastEditTime: 2021-11-22 15:27:34
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\transformers\variable\variable-transformer.js
 *
 */

const $ = require('gogocode')
const t = require("@babel/types")
const clone = require("clone")


var appRoot = "../../.."
const utils = require(appRoot + '/src/utils/utils.js')
const ggcUtils = require(appRoot + '/src/utils/ggcUtils.js')

const {
    renameScriptVariable,
    renameTemplateVariable,
} = require(appRoot + "/src/utils/renameUtils")

const {
    getTypeByAstNode,
    getTypeDefaultAst,
    setDataByPathList,
    getExpressionVariableList,
} = require(appRoot + '/src/utils/variableUtils')

const { parseMustache } = require(appRoot + "/src/utils/mustacheUtils")

/**
 * 创建空函数
 * @param {*} funName  函数名
 */
function createEmptyFunction (funName) {
    if (!funName) throw new Error("createEmptyFunction: funName is null")

    //构建空函数
    // xxxx() {
    //     console.log("xxx函数不存在，创建空函数代替");
    // },
    var meExp = t.memberExpression(t.identifier("console"), t.identifier("log"))
    var tip = "占位：函数 " + funName + " 未声明"
    var callExp = t.callExpression(meExp, [t.stringLiteral(tip)])
    var expStatement = t.expressionStatement(callExp)
    var blockStatement = t.blockStatement([expStatement])
    var opExp = t.objectMethod("method", t.identifier(funName), [], blockStatement)

    //这种也行
    // var newFun = $(`${ funName }() {
    //         console.log("${ funName }函数不存在，创建空函数代替");
    //     }`).node
    // methods.push(newFun)

    //TODO: 输出日志
    // let logStr = `[Tip] 检测到${ obj.key }绑定的函数 ${ funName } 不存在，已添加空函数占位   file-> ` + fileKey
    // console.log(logStr)
    // global.log.push(logStr)

    return opExp
}


/**
 * 获取ast里面所有的setData里面的变量列表
 * @param {*} $jsAst
 * @returns
 */
function getSetDataVariableList ($jsAst) {
    if (!$jsAst) return []

    var list = []

    $jsAst
        .find('$_$.setData($_$list)')
        .each(function (item) {
            var properties = item.match['list'][0].node.properties

            if (properties) {
                var nameList = properties.map(function (item) {
                    //例外：
                    // let param = {};
                    // param[name] = !that.data[name];
                    // that.setData({
                    //     ...param
                    // })
                    return item.key && (item.key.name || item.key.value)
                })

                list.push(...nameList)
            } else {
                // console.log("setData骚写法: ", item.generate())
            }
        }).root()

    //去重
    list = [...new Set(list)]

    return list || []
}



/**
 * 查找template里绑定的函数，如果未定义，则在methods里进行定义
 *
 * 注：理论上，应该没有在其他地方有引用，如果有引用应该会报错，所以其他情况暂不处理！
 *
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 * @returns
 */
function undefinedFunctionHandle ($jsAst, $wxmlAst) {
    if (!$jsAst || !$wxmlAst) return

    var methodList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.METHODS)
    var methodNameList = methodList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    var undefinedFunctionList = []
    var eventReg = /^@/
    var varReg = /^[\w_]+$/
    $wxmlAst.find('<$_$tag></$_$tag>')
        .each(function (item) {
            var attributes = item.attr("content.attributes")

            // console.log("attributes", attributes)
            //处理标签属性
            if (attributes) {
                attributes.forEach(function (attr) {
                    var attrNode = attr.key
                    var valueNode = attr.value

                    if (!attrNode || !valueNode) {
                        return
                    }
                    var attr = attrNode.content
                    var value = valueNode.content

                    if (eventReg.test(attr) && varReg.test(value)) {
                        //TODO: 因小程序只有bindinput="handleInput"这种写法，简单判断
                        //TODO: 不能适用于vue！！！仅适用于小程序代码！！！

                        // (1). 绑定事件时不能带参数 不能带括号 以下为错误写法
                        // <input bindinput="handleInput(100)" />
                        // 复制代码
                        // (2). 事件传值 通过标签⾃定义属性的⽅式 和 value
                        // <input bindinput="handleInput" data-item="100" />
                        // 复制代码
                        // (3). 事件触发时获取数据
                        //  handleInput: function(e) {
                        //     // {item:100}
                        //    console.log(e.currentTarget.dataset)
                        //     // 输入框的值
                        //    console.log(e.detail.value);
                        //  }

                        if (!methodNameList.includes(value)) {
                            undefinedFunctionList.push(value)
                        }
                    }
                })
            }
        }).root()

    //去重
    undefinedFunctionList = [...new Set(undefinedFunctionList)]

    //在methods里创建空函数占位
    var methods = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.METHODS)
    undefinedFunctionList.map(function (funName) {
        let opExp = createEmptyFunction(funName)
        methods.push(opExp)
    })
}

/**
 * TODO: 获取所有template里面的变量
 */
function getTemplateExpressionList ($wxmlAst) {
    if (!$wxmlAst) return []

    var expList = []
    var reg = /\{\{(.*?)\}\}/
    $wxmlAst
        .find('<$_$tag></$_$tag>')
        .each(function (item) {
            //attr content 并去重！

            //abc["b"],  abc.b
            //有冒号的，，和content

            // path: "abc.eb.c",  type:"string"

            // item 这类，是否还要判断是否为父for

            //取member 和id ，先取member

            //解析类型 三元表达式，+-*/

            var tagName = item.attr("content.name")

            var attributes = item.attr("content.attributes")
            var children = item.attr("content.children")

            //处理标签属性
            if (attributes) {
                attributes.forEach(function (attr) {
                    var attrNode = attr.key
                    var valueNode = attr.value

                    if (attr.value) {
                        //判断：有些属性没有值，如v-else
                        var attr = attrNode.content
                        var value = valueNode.content

                        if (attr[0] === ":" || attr.indexOf("v-") > -1) {
                            // console.log("value---------------" + value)

                            //{type: 'Boolean', code: 'false'}
                            var list = getExpressionVariableList(attr, value)
                            expList.push(...list)
                        }
                    }
                })
            }

            //处理标签内容
            if (children && children.length === 1) {
                var contentNode = children[0].content.value

                if (!contentNode) return

                var content = contentNode.content

                //去掉换行
                content = content.replace(/\n/g, "")

                var reg = /\{\{(.*?)\}\}/
                if (content && reg.test(content)) {
                    var codeList = content.match(/\{\{(.*?)\}\}/g)
                    // codeList = codeList.map(function (str) {
                    //     return str.replace(reg, "$1")
                    // })
                    if (!codeList && !codeList.length) {
                        console.log("codeList 括号没成对？", codeList)
                        return
                    }

                    codeList.map(function (code) {
                        code = parseMustache(code, true)
                        code = code.replace(reg, "").replace(/\s/, "")

                        var list = getExpressionVariableList("", code)
                        expList.push(...list)
                    })
                }
            }
        })
    // console.log("expList", JSON.stringify(expList))

    //去重
    expList = utils.uniqueArray(expList, "code")

    return expList
}


/**
 * 对需要添加到data里面的变量字符串进行初步处理
 * @param {.} name
 */
function getVariableListByKey (name) {
    //TODO: dateTimeArray1[dateTime1[1]] 这种不太好解析
    name = name.replace(/\[.*?\]+/g, "[0]")
    return name.split(".")
}


/**
 * 未定义的变量处理
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 * @param {*} variableTypeInfo
 */
function undefinedVariableHandle ($jsAst, $wxmlAst, variableTypeInfo) {
    if (!$jsAst) return

    //1.遍历data列表

    //2.遍历template，获取所有的，并去重

    // 判断是否是props存在的变量

    //3.获得类型

    //4.添加变量

    //TODO: 冲突的变量？？？类型冲突？？？

    var dataList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.DATA, true)
    var dataNameList = dataList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    var propList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.PROPS)
    var propNameList = propList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })
    var methodList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.METHODS)
    var methodNameList = methodList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    var wxsModuleNameList = ggcUtils.getWxmlAstModuleList($wxmlAst)


    var res = $jsAst.find(`export default {
        data() {
            return $_$data
        }}`)

    //理论上是存在的，因为在这之前创建了data
    if (!res.length) return

    var init = res.match["data"][0].node

    //**********************setData里面未创建的变量进行定义******************
    $jsAst
        .find('$_$.setData($_$list)')
        .each(function (item) {
            var list = item.match['list'][0].node.properties
            if (!list) return
            list.map(function (node) {
                var keyName = node.key && (node.key.name || node.key.value) || ""
                var value = node.value

                if (keyName
                    && !dataNameList.includes(keyName)
                    && !propNameList.includes(keyName)
                    && !wxsModuleNameList.includes(keyName)
                ) {

                    var list = getVariableListByKey(keyName)

                    // console.log('%c [ list ]: ', 'color: #bf2c9f; background: pink; font-size: 13px;', JSON.stringify(list))

                    var first = list[0]
                    //判断list第一个是否在props里面
                    if (propNameList.includes(first) || wxsModuleNameList.includes(first)) {
                        return
                    }
                    //item、index、idx等变量将直接返回
                    if (utils.exceptNameReg.test(first)) return

                    var type = getTypeByAstNode(value)
                    setDataByPathList(init, list, type, variableTypeInfo)
                }
            })
        }).root()


    //**********************template里未定义的变量处理***********************
    var expList = getTemplateExpressionList($wxmlAst)
    // console.log('list :>> ', JSON.stringify(expList))
    expList.map(function (obj) {
        var code = obj.code
        var type = obj.type
        var list = getVariableListByKey(code)

        // console.log('%c [ list ]: ', 'color: #bf2c9f; background: pink; font-size: 13px;', JSON.stringify(list))

        var first = list[0]
        //判断list第一个是否在props里面
        if (propNameList.includes(first) || wxsModuleNameList.includes(first)) {
            return
        }
        //item、index、idx等变量将直接返回
        if (utils.exceptNameReg.test(first)) return

        setDataByPathList(init, list, type, variableTypeInfo)
    })

    // var newList = list.filter(function (exp) {

    //    var res = list.find(function (exp2) {
    //         return exp2.includes(exp)
    //     })
    //     if(res) return  true
    // })
    // console.log('newList :>> ', newList)

    // 0:'show'
    // 1:'maskClass'
    // 2:'extClass'
    // 3:'showCancel'
    // 4:'index'
    // 5:'actions.length'
    // 6:'actionItem.index'
    // 7:'item.type'
    // 8:'actionIndex'
    // 9:'item.value'
    // 10:'item.actionIndex'
    // 11:'actionItem'
}


/**
 * 对使用js关键词作为函数名这种情况进行处理
 * 须放在undefinedFunctionHandle()之后处理!!!
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 */
function jsKeywordFunctionHandle ($jsAst, $wxmlAst) {
    if (!$jsAst || !$wxmlAst) return

    var methodList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.METHODS)
    var methodNameList = methodList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    //TODO: 变量名需要管吗？？？？？？？？？？？？比如this.setData({methods:1})

    var list = methodNameList.filter(name => utils.isJavascriptKeyWord(name))

    //开始替换
    var renameFun = function (name) {
        return name + "Fun"
    }
    renameScriptWithTemplateByNameList($jsAst, $wxmlAst, list, ggcUtils.propTypes.METHODS, renameFun)
}


/**
 * 对vue不支持的变量命名方式进行处理
 * vue不支持使用_和$开头作为变量名
 *
 * //TODO: 有没有使用这两个作为方法名的？
 *
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 */
function unsupportedVariableHandle ($jsAst, $wxmlAst) {
    if (!$jsAst || !$wxmlAst) return

    var dataList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.DATA)
    var dataNameList = dataList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    var reg = /^[_$]/
    var list = dataNameList.filter(name => reg.test(name))

    //开始替换
    var renameFun = function (name) {
        return "clone" + name
    }
    renameScriptWithTemplateByNameList($jsAst, $wxmlAst, list, ggcUtils.propTypes.DATA, renameFun)
}


/**
 * 处理data里变量与函数重名的问题
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 */
function dataWithMethodsDuplicateHandle ($jsAst, $wxmlAst) {
    var dataList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.DATA)
    var methodList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.METHODS)
    var propList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.PROPS)

    var dataNameList = dataList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })
    var propNameList = propList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    var methodsNameList = methodList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    var dataAndProps = dataNameList.filter(item => propNameList.indexOf(item) > -1)

    var dataAndMethods = dataNameList.filter(item => methodsNameList.indexOf(item) > -1)
    if (dataAndMethods.length) {
        //data与函数重名
        var renameFun = function (name) {
            return name + "Fun"
        }
        //这里只能替换函数名！！！！！！！！！！！！！！！！！

        //TODO: 其实这个策略有点问题，，如果是@tap="flag?'test':'handle'" 这种形式就那啥了，看是不是要反过来，将变量名给改了
        //估计问题也不大，替换函数名的好处就是替换的比较少
        renameScriptWithTemplateByNameList($jsAst, $wxmlAst, dataAndMethods, ggcUtils.propTypes.METHODS, renameFun, true)
    }
}



/**
 * 处理props里变量与函数重名的问题
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 */
function propsWithMethodsDuplicateHandle ($jsAst, $wxmlAst) {
    var methodList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.METHODS)
    var propList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.PROPS)

    var propNameList = propList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    var methodsNameList = methodList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    var propsAndMethods = propNameList.filter(item => methodsNameList.indexOf(item) > -1)
    if (propsAndMethods.length) {
        //data与函数重名
        var renameFun = function (name) {
            return name + "Fun"
        }
        //这里只能替换函数名！！！！！！！！！！！！！！！！！

        //TODO: 其实这个策略有点问题，，如果是@tap="flag?'test':'handle'" 这种形式就那啥了，看是不是要反过来，将变量名给改了
        //估计问题也不大，替换函数名的好处就是替换的比较少
        renameScriptWithTemplateByNameList($jsAst, $wxmlAst, propsAndMethods, ggcUtils.propTypes.METHODS, renameFun, true)
    }
}



/**
 * 对prop进行赋值进行处理
 * 创建一个变量接管这个prop变量的工作，并且替换掉所有引用
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 */
function propWithDataDuplicateHandle ($jsAst, $wxmlAst) {
    var dataList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.DATA)
    var propList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.PROPS)

    var dataNameList = dataList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })
    var propNameList = propList.map(function (item) {
        return item.key && (item.key.name || item.key.value)
    })

    //还需要获取类型，一并传出 //TODO:

    //1.获取setData里面是否有props下面的变量
    var nameList = getSetDataVariableList($jsAst)
    var propAndSetData = nameList.filter(item => propNameList.indexOf(item) > -1)

    //2.对这些变量进行处理
    if (propAndSetData.length) {
        var renameFun = function (name) {
            return name + "Clone"
        }
        var templateRenameList = renameScriptWithTemplateByNameList($jsAst, $wxmlAst, propAndSetData, ggcUtils.propTypes.DATA, renameFun)

        // 3.在watch里面添加
        var watchList = ggcUtils.getDataOrPropsOrMethodsList($jsAst, ggcUtils.propTypes.WATCH)
        var watchNameList = watchList.map(function (item) {
            return item.key && (item.key.name || item.key.value)
        })

        templateRenameList.map(function (obj) {
            var { oldName, newName } = obj

            //4.将这个新变量添加进data（TODO: 理论上不应该有重名的！）
            var type = ggcUtils.getPropTypeByPropList(propList, oldName)
            var obj = t.objectProperty(t.identifier(newName), getTypeDefaultAst(type))
            dataList.push(obj)

            // 这里判断，是否已经存在watch，，不能二次加入！
            if (!watchNameList.includes(oldName)) {
                var newNode = `${ oldName }: {
                    handler(newName, oldName) {
                        this.${ newName } = this.deepClone(newName);
                    },
                    deep: true,
                    immediate: true
                }`
                watchList.push(newNode)
            }
        })
    }
}

/**
 * 根据替换列表进行批量替换
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 * @param {*} list                    需要替换的列表
 * @param {*} varType                 需要替换的变量是DATA还是METHODS
 * @param {*} renameFun               对旧变量名创建一个合适的名字的函数，比如 $data --> clone$data 等等
 * @param {*} isOnlyReplaceFunction   仅对template里的函数名进行替换
 */
function renameScriptWithTemplateByNameList ($jsAst, $wxmlAst, list, varType, renameFun, isOnlyReplaceFunction = false) {
    if (!$jsAst || !$wxmlAst) return []

    //TODO:参数有效判断

    //开始替换
    var templateRenameList = []
    list.map(function (name) {
        var newName = renameFun(name)
        renameScriptVariable($jsAst, name, newName, varType)
        var obj = {
            oldName: name,
            newName,
        }
        templateRenameList.push(obj)
    })
    renameTemplateVariable($wxmlAst, templateRenameList, isOnlyReplaceFunction)
    return templateRenameList
}



/**
 *
 * 变量处理，总出口！！！
 *
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 * @param {*} variableTypeInfo
 * @param {*} fileKey
 */
function transformVariable ($jsAst, $wxmlAst, variableTypeInfo, fileKey) {
    // 变量重命名
    // $ _

    // 对props setdata
    //  使用新变量，替身，watch
    //  template里面要重名这个变量
    //  函数及生命周期里面也要重名


    // data与函数重名
    //  函数重名
    //  template里面的函数重名

    // tempalte里面函数是js关键字
    //  提示
    //  js里面重名函数及引用
    //  template里面重名函数

    // ----------------------------------------------------------
    // 2.重命名函数及引用(js,template)
    // 3.重命名变量及引用(js,template)
    // 5.根据template未声明的变量进行声明,可能层级比较深
    // 6.data与props重名
    // 6.5.data与fun重名
    // 7.data下面以$data,$开头的变量
    // 8.以_开头的函数名(或变量),与vue冲突
    // 9.template函数未声明的



    // 添加新的变量 、 修改现有变量，含多级变量，数组及对象 （template 和 js）
    // 对变量进行重名，包含js(data\methods等)和template(attr和content)
    // data与props重名: 需要弄一个替身，然后将template及js进行重名！
    // data 与 function重名：将function进行重名(js和template)
    // data以$或_开头：进行重名
    // template函数未声明的：声明空函数

    // 变量重命名
    // $ _

    //  data里面重命名
    //  生命周期和methods里面重命名
    //  template里attr和content重命名

    // js重命名变量 做个方法
    // template变量重命名做个方法


    // 对props setdata
    //  使用新变量，替身，watch
    //  template里面要重名这个变量
    //  函数及生命周期里面也要重名


    // data与函数重名
    //  函数重名
    //  template里面的函数重名


    // tempalte里面函数是js关键字
    //  提示
    //  js里面重名函数及引用
    //  template里面重名函数

    // console.log('fileKey :>> ', fileKey)


    //第一步：把没有定义的变量和函数，先定义出来
    undefinedVariableHandle($jsAst, $wxmlAst, variableTypeInfo)
    undefinedFunctionHandle($jsAst, $wxmlAst)

    dataWithMethodsDuplicateHandle($jsAst, $wxmlAst)
    propWithDataDuplicateHandle($jsAst, $wxmlAst)
    propsWithMethodsDuplicateHandle($jsAst, $wxmlAst)

    unsupportedVariableHandle($jsAst, $wxmlAst)
    jsKeywordFunctionHandle($jsAst, $wxmlAst)
}


var attrList = ["class", "style", "id", "key"]

/**
 * 这里有两个功能
 * 1.获取页面里所有的单个变量的类型
 * 2.通过对比，确定自定义组件的属性的值，是字符串还是数值还是Boolean，如果是后两者，添加v-bind:
 * @param {*} $jsAst
 * @param {*} $wxmlAst
 * @returns
 */
function getPageSimpleVariableTypeInfo ($jsAst, $wxmlAst, allPageData) {
    if (!$jsAst || !$wxmlAst) return null

    var importComponentList = global.importComponentList

    //中文正则
    var reg_cn = /[\u4e00-\u9fa5]/

    var variableTypeInfo = {}

    $wxmlAst.find('<$_$tag></$_$tag>')
        .each(function (item) {
            var tagName = item.attr("content.name")

            //驼峰命名转为短横线命名
            tagName = utils.getKebabCase(tagName)

            //找不到这个组件，就返回
            if (!importComponentList[tagName]) return

            var comFileKey = importComponentList[tagName]

            //找不到这个组件的数据也返回
            if (!allPageData[comFileKey]) {
                console.log("找不到这个组件: " + comFileKey)
                return
            }

            //获取这个组件的props数据
            var propInfo = allPageData[comFileKey].data.getPropsInfo()
            // console.log("propInfo", propInfo)

            var attributes = item.attr("content.attributes")

            //处理标签属性
            if (attributes) {
                attributes.forEach(function (attr) {
                    var attrNode = attr.key
                    var valueNode = attr.value

                    //没有属性也返回
                    if (!valueNode) {
                        return
                    }

                    var attr = attrNode.content
                    var value = valueNode.content

                    attr = attr.replace(/^:/, "")

                    //这里将单个单词的变量添加到variableTypeInfo
                    //多变量或表达式，不考虑!
                    if (attr && !attrList.includes(attr)) {
                        var type = propInfo[attr]
                        if (utils.isVariableName(value)) {
                            if (type === "Boolean" && utils.isBooleanString(value)) {
                                if (attrNode.content[0] !== ":") {
                                    //修复数值的绑定关系，是否是数值还是字符串
                                    attrNode.content = ":" + attrNode.content
                                    // console.log("这个属性是Bool，添加v-bind:" + attr + '="' + value + '"')
                                }
                            } else {
                                //中文的不添加
                                if (!reg_cn.test(value)) {
                                    variableTypeInfo[value] = type
                                    // console.log("加进来的属性", attr + '="' + value + '"', "属性类型为：", type)
                                }
                            }
                        } else if (type === "Number" && utils.isNumberString(value)) {
                            if (attrNode.content[0] !== ":") {
                                //修复数值的绑定关系，是否是数值还是字符串
                                attrNode.content = ":" + attrNode.content
                                // console.log("这个属性是数字，添加v-bind:" + attr + '="' + value + '"')
                            }
                        } else {
                            // console.log("这个属性不加进来了1", attr + '="' + value + '"')
                        }
                    } else {
                        // console.log("这个属性不加进来了2", attr + '="' + value + '"')
                    }
                })
            }
        }).root()

    // console.log("varList", variableTypeInfo)

    return variableTypeInfo
}



module.exports = {
    getSetDataVariableList,
    dataWithMethodsDuplicateHandle,

    undefinedVariableHandle,
    undefinedFunctionHandle,
    unsupportedVariableHandle,
    jsKeywordFunctionHandle,
    propWithDataDuplicateHandle,

    //以下为出口函数
    transformVariable,
    getPageSimpleVariableTypeInfo
}
