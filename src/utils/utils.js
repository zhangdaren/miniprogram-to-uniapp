/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2022-01-19 18:09:06
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\utils\utils.js
 *
 */
const chalk = require('chalk')
// const fastGlob = require('fast-glob')

const { fdir } = require("fdir")

const $ = require('gogocode')

const path = require('path')
const fs = require('fs-extra')



/**
 * 忽略目录:
 * 云开发目录
 * custom-tab-bar目录
 */
var ignoreList = [
    /[\/\\]cloudfunctions$/,
    /[\/\\]cloudfunctions[\/\\]/,

    /[\/\\]custom-tab-bar$/,
    /[\/\\]custom-tab-bar[\/\\]/,
]

function getAllFile (sourceFolder, options) {

    //两者，都无法找出无后缀名的文件

    //fast-glob方案
    // if (!options) {
    //     options = {
    //         // ignore: ['components/**'],  //忽略
    //         absolute: true,   //返回绝对路径
    //         onlyFiles: false,   //不仅返回文件，也返回目录
    //         dot: true,     //搜索以点开头的文件
    //         markDirectories: true, //目录后面加/符号
    //         objectMode: true,    //返回文件对象（内置的不影响性能）
    //     }
    // }

    // var files = fastGlob.sync(sourceFolder + "/**", options)

    //这个确实是快
    //无后缀名就算是文件了
    const crawler = new fdir()
        .withFullPaths()   //返回完整路径
        .withDirs()        //返回目录
    // .filter((path, isDirectory) => ignoreList.some((reg) => reg.test(path)))

    const files = crawler.crawl(sourceFolder).sync()

    return files
}

function log (msg, type = '') {
    var fullMsg = `[wx-to-uni-app]: ${ msg }`
    switch (type) {
        case "error":
        case "red":
            console.log(chalk.red(fullMsg))
            break
        case "green":
            console.log(chalk.green(fullMsg))
            break
        case "yellow":
            console.log(chalk.yellow(fullMsg))
            break
        default:
            console.log(msg)
            break
    }
    global.hbxOutputChannel && global.hbxOutputChannel.appendLine && global.hbxOutputChannel.appendLine(msg)
};


//借鉴：https://github.com/dcloudio/uni-app/blob/v3/packages/uni-migration/lib/mp-weixin/util.js
const isWin = /^win/.test(process.platform)
const normalizePath = path => (isWin ? path.replace(/\\/g, '/') : path)


// /**
//  * 是否为数字
//  * @param {*} n
//  */
// function isNumber (n) {
//     return !isNaN(parseFloat(n)) && isFinite(n);
// }


// /**
//  * 是否为Object
//  * @param {*} n
//  */
// function isObject (val) {
//     return val != null && typeof val === 'object' && Array.isArray(val) === false;
// }


function isString (arg) {
    return arg && typeof (arg) == "string"
}

function isNumber (arg) {
    return arg && typeof (arg) == "number" && !isNaN(arg)
}

function isBoolean (arg) {
    return arg === !!arg
}

function isArray (arg) {
    return Object.prototype.toString.call(arg) == '[object Array]'
}

function isObject (arg) {
    return Object.prototype.toString.call(arg) == '[object Object]'
}

function isFunction (arg) {
    return Object.prototype.toString.call(arg) == '[object Function]'
}

function isEmpty (arg) {
    return Object.keys(arg).length === 0
}

/**
 * 数字正则
 */
const numberReg = /^\d+$/


/**
 * 是否为数字字符串
 * @param {*} str
 * @returns
 */
function isNumberString (str) {
    return numberReg.test(str)
}

/**
 * 判断字符串是否是'true'或'false'
 * @param {*} name
 * @returns
 */
function isBooleanString (name) {
    return name === "true" || name === "false"
}


/**
 * 变量名正则
 */
const variableNameReg = /^([^\x00-\xff]|[a-zA-Z_$])([^\x00-\xff]|[a-zA-Z0-9_$])*$/

/**
 * 是否为变量名
 * @param {*} str
 * @returns
 */
function isVariableName (str) {
    return variableNameReg.test(str)
}

/**
 * template里这些字符串变量将不会在data里定义
 * util.beautifyTime() 过滤
 */
const exceptNameReg = /^(index|items|idx|key)$|^(item|index)(\w+)?|\.\w+|\bnull\b\(/


//首字母大写
function titleCase5 (str) {
    return str.toLowerCase().replace(/( |^)[a-z]/g, (L) => L.toUpperCase())
}


// function isString (val) {
//     return Object.prototype.toString.call(val) === '[object String]'
// }

// function isNumber (val) {
//     return Object.prototype.toString.call(val) === '[object Number]'
// }

// function isBoolean (val) {
//     return Object.prototype.toString.call(val) === '[object Boolean]'
// }

// function isSymbol (val) {
//     return Object.prototype.toString.call(val) === '[object Symbol]'
// }

// function isUndefined (val) {
//     return Object.prototype.toString.call(val) === '[object Undefined]'
// }

// function isNull (val) {
//     return Object.prototype.toString.call(val) === '[object Null]'
// }

// function isFunction (val) {
//     return Object.prototype.toString.call(val) === '[object Function]'
// }

// function isDate (val) {
//     return Object.prototype.toString.call(val) === '[object Date]'
// }

// function isArray (val) {
//     return Object.prototype.toString.call(val) === '[object Array]'
// }

// function isRegExp (val) {
//     return Object.prototype.toString.call(val) === '[object RegExp]'
// }

// function isError (val) {
//     return Object.prototype.toString.call(val) === '[object Error]'
// }

// function isHTMLDocument (val) {
//     return Object.prototype.toString.call(val) === '[object HTMLDocument]'
// }

// function isGlobal (val) {
//     return Object.prototype.toString.call(val) === '[object global]'
// }


// Object.prototype.toString.call(''); // [object String]
// Object.prototype.toString.call(1); // [object Number]
// Object.prototype.toString.call(true); // [object Boolean]
// Object.prototype.toString.call(Symbol()); //[object Symbol]
// Object.prototype.toString.call(undefined); // [object Undefined]
// Object.prototype.toString.call(null); // [object Null]
// Object.prototype.toString.call(newFunction()); // [object Function]
// Object.prototype.toString.call(newDate()); // [object Date]
// Object.prototype.toString.call([]); // [object Array]
// Object.prototype.toString.call(newRegExp()); // [object RegExp]
// Object.prototype.toString.call(newError()); // [object Error]
// Object.prototype.toString.call(document); // [object HTMLDocument]
// Object.prototype.toString.call(window); //[object global] window 是全局对象 global 的引用


/**
 * 判断是否为url
 * @param {*} str_url 网址，支持http及各种协议
 */
function isURL (str_url) {
    //TODO: 似乎//www.baidu.com/xx.png 不能通过校验？
    var reg = /^((https|http|ftp|rtsp|mms)?:\/\/)?(([0-9a-z_!~*'().&amp;=+$%-]+: )?[0-9a-z_!~*'().&amp;=+$%-]+@)?((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5]$)|([0-9a-z_!~*'()-]+\.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\.[a-z]{2,6})(:[0-9]{1,4})?((\/?)|(\/[0-9a-zA-Z_!~*'().;?:@&amp;=+$,%#-]+)+\/?)$/
    //上面的表达式logo.png能直接过....，因此再判断一下是否含有/
    if (reg.test(str_url) && str_url.indexOf("/") > -1) {
        return (true)
    } else {
        //有些可能就是//开头的地址
        let reg2 = /\/\//
        if (reg2.test(str_url)) {
            return (true)
        } else {
            return (false)
        }
    }
};


/**
 * 是否为十六进制
 * @param {*} str
 */
function isHex (str) {
    return /[0-9a-f]{4}/i.test("" + str)
}


/**
 * 驼峰式转下横线
 * console.log(toLowerLine("TestToLowerLine"));  //test_to_lower_line
 * @param {*} str
 */
function toLowerLine (str) {
    var temp = str.replace(/[A-Z]/g, function (match) {
        return "_" + match.toLowerCase()
    })
    if (temp.slice(0, 1) === '_') { //如果首字母是大写，执行replace时会多一个_，这里需要去掉
        temp = temp.slice(1)
    }
    return temp
};


/**
 * 驼峰命名转为短横线命名
 */
function getKebabCase (str) {
    return str.replace(/[A-Z]/g, function (i) {
        return '-' + i.toLowerCase()
    }).replace(/_/g, "-")
}

/**
 * 中划线转驼峰式
 * console.log(toCamel('test-to-camel'));   //testToCamel
 * console.log(toCamel('diy-imageSingle')); //diyImageSingle
 * console.log(toCamel('diy_imageSingle')); //diyImageSingle
 * @param {*} str
 */
function toCamel (str) {
    let ret = getKebabCase(str).toLowerCase()
    ret = ret.replace(/-+([\w+])/g, function (all, letter) {
        return letter.toUpperCase()
    })
    return ret
}

/**
 * 暂停
 * @param {*} numberMillis  毫秒
 */
function sleep (numberMillis) {
    var now = new Date()
    var exitTime = now.getTime() + numberMillis
    while (true) {
        now = new Date()
        if (now.getTime() > exitTime)
            return
    }
}





function splitStrFull (str) {
    var newStr = str

    //匹配引号里面的的字符串,含两侧的引号，后面再判断去除
    var reg1 = /\[*\s*['"](.*?)['"]\s*\]*/g

    newStr = newStr.replace(/{|}/g, "")
    newStr = newStr.replace(reg1, function (match, $1) {
        return match.indexOf("[") > -1 ? match : "null"
    })

    var splitReg = /===|==|=|!==|!=|\&\&|\|\||\?|:|<|>|\/|\+|<=|>=|-/
    var arr = newStr.trim().split(splitReg)

    var result = []
    //去重， 去.length
    var otherKeywordReg = /^(in|index|idx|item|on)$/
    var reg = /^(\'|\")|^\d/
    var numReg = /^\d+$/
    var otherSymbolReg = /\(|\)|!/g
    arr.forEach(function (item, i) {
        var key = item.trim()
        if (key && !reg.test(key)) {
            key = key.replace(otherSymbolReg, "")
            if (key && !isJavascriptKeyWord(key) && !numReg.test(key) && !otherKeywordReg.test(key)) {
                result.push(key)
            }
        }
    })
    return result
}


/**
 * 判断字符串里面的括号是否成对
 * 所有括号配置成功返回true
 * https://blog.csdn.net/shijue98/article/details/106250008
 * @param {*} str
 */
function bracketsJudge (str) {
    if (!str.trim()) return true
    var stack = []
    var keys = [')', ']', '}']
    var values = ['(', '[', '{']
    var isBreak = -1
    for (var i = 0;i < str.length;i++) {
        var char = str.charAt(i)
        if (values.includes(char)) {
            // 开始
            stack.push(char)

        } else {
            var index = keys.indexOf(char)
            if (index > -1) {
                // 闭合
                if (!stack.length || values[index] != stack.pop()) {
                    isBreak = i
                    break
                }
            }
        }
    }
    if (isBreak > -1) {
        isBreak = false
        return isBreak
    }
    isBreak = stack.length - 1
    return isBreak === -1
}


/**
 * copy to vue.js
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap (
    str,
    expectsLowerCase
) {
    var map = Object.create(null)
    var list = str.split(',')
    for (var i = 0;i < list.length;i++) {
        map[list[i]] = true
    }
    return expectsLowerCase
        ? function (val) { return map[val.toLowerCase()] }
        : function (val) { return map[val] }
}

// 区分大小写
var isHTMLTag = makeMap(
    'html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template'
)

// 不区分大小写
var isSVG = makeMap(
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font,' +
    'font-face,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
    true
)

//是否为uni-app内置关键字，因与上面的有重复，有删减
//参见：https://uniapp.dcloud.io/use?id=%e5%91%bd%e5%90%8d%e9%99%90%e5%88%b6
var isUniAppTag = makeMap(
    "cell,countdown,datepicker," +
    "indicator,list,loading-indicator," +
    "loading,marquee,refresh,richtext,scrollable,scroller," +
    "select,slider-neighbor,slider,slot,spinner," +
    "tabbar,tabheader,timepicker," +
    "trisition-group,trisition,web"
)

/**
 * 是否为javascript保留关键字，不能用作变量或函数名 *
 */
var isJavascriptKeyWord = makeMap(
    "abstract,arguments,boolean,break,byte," +
    "case,catch,char,class,const," +
    "continue,debugger,default,delete,do," +
    "double,else,enum,eval,export," +
    "extends,false,final,finally,float," +
    "for,function,goto,if,implements," +
    "import,in,instanceof,int,interface," +
    "let,long,native,new,null," +
    "package,private,protected,public,return," +
    "short,static,super,switch,synchronized," +
    "this,throw,throws,transient,true," +
    "try,typeof,var,void,volatile," +
    "while,with,yield"
)

/**
 * 是否是小程序自带组件名
 */
var isMiniAppTag = makeMap(
    "movable-view,cover-image,cover-view,match-media," +
    "movable-area,scroll-view,swiper,swiper-item," +
    "view,icon,progress,rich-text,text,button," +
    "checkbox,checkbox-group,editor,form,input," +
    "keyboard-accessory,label,picker,picker-view," +
    "picker-view-column,radio,radio-group,slider," +
    "switch,textarea,functional-page-navigator," +
    "navigator,audio,camera,image,live-player," +
    "live-pusher,video,voip-room,map,canvas," +
    "web-view,ad,ad-custom,official-account," +
    "open-data,native-component,camera,canvas," +
    "input,live-player,live-pusher,map,textarea," +
    "video,aria-component,navigation-bar,page-meta"
)

// https://opendocs.alipay.com/mini/component
//https://smartprogram.baidu.com/docs/develop/component/view_cover-image/
// https://developers.weixin.qq.com/miniprogram/dev/component/
//https://microapp.bytedance.com/docs/zh-CN/mini-app/develop/component/all






//是否为vue内置关键字或方法
// "_init"
// function isVueMethod (tag) {
//     return /^_|^\$/.test(tag)
// }

/**
 * 判断tag是否为预置的名字
 * @param {*} tag
 */
function isReservedTag (tag) {
    return isHTMLTag(tag) || isSVG(tag) || isUniAppTag(tag) || isVueMethod(tag)
};



/**
 * 是否是小程序自带组件名
 */
var isVueMethod = makeMap(
    "methods"
)


/**
 * 判断name是否为预置的名字
 * @param {*} tag
 */
function isReservedName (name) {
    return isJavascriptKeyWord(name) || isVueMethod(name)
};


/**
 * 判断关键字是否与vant有关  //van-是老版vant，可以支持。
 */
function isVant (name) {
    return /\bvant-weapp\b|\bvant\b|van-/.test(name)
}

/**
 * vant组件路径
 */
const vantComponentList = {
    "van-action-sheet": "./wxcomponents/vant/action-sheet/index",
    "van-area": "./wxcomponents/vant/area/index",
    "van-button": "./wxcomponents/vant/button/index",
    "van-card": "./wxcomponents/vant/card/index",
    "van-cell": "./wxcomponents/vant/cell/index",
    "van-cell-group": "./wxcomponents/vant/cell-group/index",
    "van-checkbox": "./wxcomponents/vant/checkbox/index",
    "van-checkbox-group": "./wxcomponents/vant/checkbox-group/index",
    "van-col": "./wxcomponents/vant/col/index",
    "van-count-down": "./wxcomponents/vant/count-down/index",
    "van-dialog": "./wxcomponents/vant/dialog/index",
    "van-divider": "./wxcomponents/vant/divider/index",
    "van-field": "./wxcomponents/vant/field/index",
    "van-goods-action": "./wxcomponents/vant/goods-action/index",
    "van-goods-action-icon": "./wxcomponents/vant/goods-action-icon/index",
    "van-goods-action-button": "./wxcomponents/vant/goods-action-button/index",
    "van-icon": "./wxcomponents/vant/icon/index",
    "van-image": "./wxcomponents/vant/image/index",
    "van-loading": "./wxcomponents/vant/loading/index",
    "van-nav-bar": "./wxcomponents/vant/nav-bar/index",
    "van-notice-bar": "./wxcomponents/vant/notice-bar/index",
    "van-notify": "./wxcomponents/vant/notify/index",
    "van-panel": "./wxcomponents/vant/panel/index",
    "van-popup": "./wxcomponents/vant/popup/index",
    "van-progress": "./wxcomponents/vant/progress/index",
    "van-radio": "./wxcomponents/vant/radio/index",
    "van-radio-group": "./wxcomponents/vant/radio-group/index",
    "van-row": "./wxcomponents/vant/row/index",
    "van-search": "./wxcomponents/vant/search/index",
    "van-sidebar": "./wxcomponents/vant/sidebar/index",
    "van-sidebar-item": "./wxcomponents/vant/sidebar-item/index",
    "van-slider": "./wxcomponents/vant/slider/index",
    "van-stepper": "./wxcomponents/vant/stepper/index",
    "van-steps": "./wxcomponents/vant/steps/index",
    "van-sticky": "./wxcomponents/vant/sticky/index",
    "van-submit-bar": "./wxcomponents/vant/submit-bar/index",
    "van-swipe-cell": "./wxcomponents/vant/swipe-cell/index",
    "van-uploader": "./wxcomponents/vant/uploader/index",
    "van-switch": "./wxcomponents/vant/switch/index",
    "van-tab": "./wxcomponents/vant/tab/index",
    "van-tabs": "./wxcomponents/vant/tabs/index",
    "van-tabbar": "./wxcomponents/vant/tabbar/index",
    "van-tabbar-item": "./wxcomponents/vant/tabbar-item/index",
    "van-tag": "./wxcomponents/vant/tag/index",
    "van-toast": "./wxcomponents/vant/toast/index",
    "van-transition": "./wxcomponents/vant/transition/index",
    "van-tree-select": "./wxcomponents/vant/tree-select/index",
    "van-datetime-picker": "./wxcomponents/vant/datetime-picker/index",
    "van-rate": "./wxcomponents/vant/rate/index",
    "van-collapse": "./wxcomponents/vant/collapse/index",
    "van-collapse-item": "./wxcomponents/vant/collapse-item/index",
    "van-picker": "./wxcomponents/vant/picker/index",
    "van-overlay": "./wxcomponents/vant/overlay/index",
    "van-circle": "./wxcomponents/vant/circle/index",
    "van-index-bar": "./wxcomponents/vant/index-bar/index",
    "van-index-anchor": "./wxcomponents/vant/index-anchor/index",
    "van-grid": "./wxcomponents/vant/grid/index",
    "van-grid-item": "./wxcomponents/vant/grid-item/index",
    "van-dropdown-menu": "./wxcomponents/vant/dropdown-menu/index",
    "van-dropdown-item": "./wxcomponents/vant/dropdown-item/index",
    "van-skeleton": "./wxcomponents/vant/skeleton/index"
}



/**
 * 根据文件后缀名，获取template所对应的属性名的前缀
 * @param {*} exname
 * @param {*} isAppendPostfix 添加后缀
 */
function getAttrPrefixExtname (exname, isAppendPostfix) {
    var attrPrefix = ''
    var postfix = ''

    switch (exname) {
        case '.wxml':
        case '.wxss':
            //微信小程序
            attrPrefix = 'wx'
            postfix = ":"
            break
        case '.qml':
        case '.qss':
            //qq小程序
            attrPrefix = 'qq'
            postfix = ":"
            break
        case '.ttml':
        case '.ttss':
            //头条小程序
            attrPrefix = 'tt'
            postfix = ":"
            break
        case '.axml':
        case '.acss':
            //支付宝/钉钉小程序
            attrPrefix = 'a'
            postfix = ":"
            break
        case '.swan':
            //百度小程序
            attrPrefix = 's'
            postfix = "-"
            break
        default:
            break
    }

    if (isAppendPostfix) {
        attrPrefix += postfix
    }
    return attrPrefix
}

/**
 * 根据后缀名判断小程序项目类型
 * @param {} extname
 */
function getMPType (extname) {
    var mpType = ""
    switch (extname) {
        case '.wxml':
            mpType = "weixin"
            break
        case '.qml':
            mpType = "qq"
            break
        case '.ttml':
            mpType = "toutiao"
            break
        case '.axml':
            mpType = "alipay"
            break
        case '.swan':
            mpType = "baidu"
            break
        default:
            mpType = "wx"
            break
    }
    return mpType
}
/**
 * 小程序对应信息
 * attrPrefix template里面的前缀
 * keyword    js代码里面的全局变量
 */
const mpInfo = {
    weixin: {
        attrPrefix: "wx",
        keyword: "wx"
    },
    qq: {
        attrPrefix: "qq",
        keyword: "qq"
    },
    toutiao: {
        attrPrefix: "tt",
        keyword: "tt"
    },
    alipay: {
        attrPrefix: "a",
        keyword: "my"
    },
    baidu: {
        attrPrefix: "s",
        keyword: "swan"
    },
}

let extnameArr = [
    'js',
    'wxml',
    'wxss',
    //qq小程序
    'qs',
    'qml',
    'qss',
    //头条小程序
    'ttml',
    'ttss',
    //支付宝/钉钉小程序
    'axml',
    'acss',
    //百度小程序
    'swan',
]
/**
 * 扩展名正则
 */
const extnameReg = new RegExp('\\.(' + extnameArr.join('|') + ')')






/**
 * 对象数组去重
 * @param {*} array  数组
 * @param {*} field  去重字段
 * @returns  返回去重后的数组
 */
function uniqueArray (array, field) {
    var obj = {}
    return array.reduce(function (a, b) {
        obj[b[field]] ? '' : obj[b[field]] = true && a.push(b)
        return a
    }, [])
}


/**
 * 从当前元素开始遍历往上查找祖先，看是否有v-for存在，获取所有for的父级node list
 */
function getAllParentForNodeList (node) {
    var list = []
    if (node) {
        if (node && node.attribs && node.attribs['v-for']) {
            list.push(node.attribs)
            var newList = getAllParentForNodeList(node.parent)
            list.push(...newList)
        } else {
            var newList = getAllParentForNodeList(node.parent)
            list.push(...newList)
        }
    }
    return list
}


/**
 * 存储标签里面使用{{}}绑定的对象，为去除{{}}的对象
 * @param {*} fileKey        fileKey
 * @param {*} value          含绑定的原始完整字符串
 * @param {*} node           当前所在的template node节点，可为空！
 * @param {*} attrs          当前项目的attrs
 * @param {*} key            对应的key，如果是内容，则为空
 * @param {*} originalType   原始类型，如果是内容，则为String
 */
function saveAttribsBindObject (fileKey, value, node = "", attrs = {}, key = "", originalType = "") {
    //同时满足两种条件为templateTransformer调用，否则为jsHandle里调用
    if (value && value.indexOf("{{") > -1) {
        let reg = /{{(.*?)}}/g

        var matches = value.match(reg)
        if (matches) {
            matches.forEach(function (value) {
                let pAttribs = getAllParentForNodeList(node)
                value = value.replace(/{{|}}/g, "").trim()
                // console.log("-*-", value)
                if ((pAttribs && pAttribs.length) || JSON.stringify(attrs) !== "{}") {
                    //只留最前面的一个变量来判断
                    //如: a.b.c  --> a
                    //    a[b]   --> a
                    //    a.b[c] --> a
                    var newValue = value.split(/\.|\[/g)[0]

                    //todo: 需要优化一下
                    //判断是否为父级for的item或index
                    var isForItemName = false
                    if ((attrs["v-for"] && attrs["v-for"].indexOf(`(${ newValue },`) > -1) && attrs[":key"] !== value) {
                        isForItemName = true
                    } else {
                        isForItemName = pAttribs.some(function (item) {
                            return item["v-for"].indexOf(`(${ newValue },`) > -1 && item[":key"] !== value
                        })
                    }

                    //排除for里面声明的对象
                    if (!isForItemName) {
                        //将所有含有{{}}的属性的值存入到缓存
                        global.pagesData[fileKey]['data']['attribs'].push({
                            exp: value.trim(),
                            key: key,
                            type: originalType,
                        })
                    }
                } else {
                    //将所有含有{{}}的属性的值存入到缓存
                    global.pagesData[fileKey]['data']['attribs'].push({
                        exp: value.trim(),
                        key: key,
                        type: originalType,
                    })
                }
            })
        }
    }
}



/**
 * 存储setData里面的key值
 * @param {*} fileKey        fileKey
 * @param {*} value          key字符串
 * @param {*} originalType   原始类型，如果是内容，则为String
 * @param {*} isSetData      表示是否为setData里面的变量，一般来说，以template优先，setData次之
 */
function saveSetDataKey (fileKey, value, originalType = "") {
    if (!global.pagesData[fileKey]['data']['jsSetDataKeyList']) {
        global.pagesData[fileKey]['data']['jsSetDataKeyList'] = []
    }
    global.pagesData[fileKey]['data']['jsSetDataKeyList'].push({
        exp: value.trim(),
        key: "",
        type: originalType,
        isSetData: true
    })
}




/**
 * 获取小程序类型
 */
function getMiniprogramType () {

}


var regList = [
    /\bLicensed\b/i,
    /\blicenses\b/i,
    /\bcopyright\b/i,
    /http:\/\/www\.w3\.org/i,
    /DOM\sLevel\s/i,
]
/**
 * 判断当前文件是否为js的sdk，粗略判断，需先判断是否为单js文件
 * @param {*} content
 */
function isSDKFile (content) {
    var result = regList.some(reg => reg.test(content))
    return result
}


module.exports = {
    log,

    isString,
    isNumber,
    isObject,
    isFunction,
    isEmpty,

    isSDKFile,

    numberReg,

    isNumberString,
    isBooleanString,

    isVariableName,
    exceptNameReg,


    isHex,

    normalizePath,
    isURL,
    toLowerLine,

    getKebabCase,
    toCamel,

    sleep,
    isReservedTag,

    isJavascriptKeyWord,
    isReservedName,
    isMiniAppTag,

    ///
    isVant,
    vantComponentList,

    getAttrPrefixExtname,
    getMPType,
    mpInfo,

    extnameReg,

    bracketsJudge,

    uniqueArray,

    getAllParentForNodeList,
    saveAttribsBindObject,
    saveSetDataKey,

    titleCase5,

    //////////////////////////////////////////
    getAllFile,
}
