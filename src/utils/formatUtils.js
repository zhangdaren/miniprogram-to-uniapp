/*
 * @Author: zhang peng
 * @Date: 2021-08-18 13:56:43
 * @LastEditTime: 2021-11-15 11:22:47
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\utils\formatUtils.js
 *
 */

const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const clone = require("clone")

const prettier = require("prettier")
var appRoot = "../.."
const utils = require(appRoot + '/src/utils/utils.js')

const ProgressBar = require('progress')

const beautify = require('js-beautify')

// const beautify_js = require('js-beautify'); // also available under "js" export
// const beautify_css = require('js-beautify').css;
// const beautify_html = require('js-beautify').html;


// const format = require("prettier-eslint")

// const prettier = require('prettier/standalone');
// const prettierBabylon = require('prettier/parser-babylon');
// const prettierHtml = require('prettier/parser-html');


// 格式化代码，HBuilderX同款插件，同款配置
var prettierOptions = {
    parser: "",                            // 解析器
    printWidth: 180,                       // 代码多长换行
    semi: true,                            // 在每句话的末尾加一个分号
    tabWidth: 4,                           // tab的空格数量
    useTabs: false,                        // 缩进不使用tab
    singleQuote: true,                     // 单引号
    trailingComma: "none",                 // 这一条是hbx格式规则，去掉对象或数组末节点的逗号
    bracketSpacing: true,                  // 对象文字在括号之间打印空格
    htmlWhitespaceSensitivity: "ignore",   // "ignore" 所有标签周围的空白(或缺少空白)被认为是无关紧要的。
    // requirePragma: true,                 // 格式化css需要的，否则格式化出错（用scss格式没问题，先用scss）
}

//Beautify options
var beautifyOptions = {
    parsers: {
        ".js": "js",
        ".json": "js",
        ".njs": "js",
        ".sjs": "js",
        ".wxs": "js",
        ".css": "css",
        ".nss": "css",
        ".wxss": "css",
        ".acss": "css",
        ".ttss": "css",
        ".qss": "css",
        ".html": "html",
        ".ux": "html",
        ".wxml": "html",
        ".nml": "html",
        ".vue": "html",
        ".nvue": "html",
        ".axml": "html",
        ".swan": "html",
        ".ttml": "html",
        ".qml": "html"
    },
    options: {
        "indent_size": "1",
        "indent_char": "\t",
        "indent_with_tabs": false, //使用tab缩进
        "eol": "\r\n", //行结束符
        "end_with_newline": false, //使用换行结束输出
        "indent_level": 0, //起始代码缩进数
        "preserve_newlines": true, //保留空行
        "max_preserve_newlines": null, //最大连续保留换行符个数。比如设为2，则会将2行以上的空行删除为只保留1行
        "space_in_paren": false, //括弧添加空格 示例 f( a, b )
        "space_in_empty_paren": false, //函数的括弧内没有参数时插入空格 示例 f( )
        "jslint_happy": false, //启用jslint-strict模式
        "space_after_anon_function": false, //匿名函数的括号前加空格
        "brace_style": "collapse", //代码样式，可选值 [collapse|expand|end-expand|none][,preserve-inline] [collapse,preserve-inline
        "unindent_chained_methods": false, //不缩进链式方法调用
        "break_chained_methods": false, //在随后的行中断开链式方法调用
        "keep_array_indentation": false, //保持数组缩进
        "unescape_strings": false, //使用xNN符号编码解码可显示的字符
        "wrap_line_length": 120,
        "e4x": false, //支持jsx
        "comma_first": false, //把逗号放在新行开头，而不是结尾
        "operator_position": "before-newline",
        "unformatted": ["wbr"],
        "html": {
            "indent_handlebars": true,
            "indent_inner_html": true,
            "indent-scripts": "normal", //[keep|separate|normal]
            "extra_liners": [] //配置标签列表，需要在这些标签前面额外加一空白行
        }
    }
}

/**
 * 根据类型获取prettier options
 * @param {*} type
 * @returns
 */
function getPrettierOptions (type) {
    let parser = ""
    switch (type) {
        case "all":
        case "vue":
        case "wxml":
            parser = "vue"
            break
        case "js":
            parser = "babel"
            break
        case "css":
        case "scss":
        case "less":
            parser = "scss"
            break
        default:
            //其他如json等
            parser = type
            break
    }
    prettierOptions.parser = parser
    return prettierOptions
}

/**
 * 使用HBuilderX同款插件和同款配置进行格式化代码
 * https://prettier.io/playground/
 * @param {*} code     代码
 * @param {*} extname     type
 * @param {*} fileKey
 *
 */
function formatCode (code, extname, fileKey, showErrorCdoeLog = true) {
    if (!code) return code

    var newCode = formateByPrettier(code, extname, fileKey, showErrorCdoeLog)

    if (newCode === null) {
        if (extname[0] !== ".") {
            extname = "." + extname
        }

        newCode = formateByBeautify(code, extname, fileKey, showErrorCdoeLog)
        if (newCode === null) {
            newCode = code
        }
    }

    return newCode
}
/**
 * 使用Beautify进行格式化代码
 * @param {*} code
 * @param {*} extname
 * @param {*} fileKey
 * @param {*} showErrorCdoeLog
 */
function formateByPrettier (code, extname, fileKey, showErrorCdoeLog) {
    if (!code) return code
    var options = getPrettierOptions(extname)

    var res = null
    try {
        res = prettier.format(code, options)
    } catch (error) {
        if (showErrorCdoeLog) {
            console.log("格式化Error: fileKey: " + fileKey + "     type:" + extname + "       error：", error)
            console.log("格式化Error: code: " + code)
        } else {
            console.log("格式化Error: fileKey: " + fileKey)
        }
    }
    return res
}

/**
 * 使用Beautify进行格式化代码
 * @param {*} code
 * @param {*} extname
 * @param {*} fileKey
 * @param {*} showErrorCdoeLog
 */
function formateByBeautify (code, extname, fileKey, showErrorCdoeLog) {
    if (!code) return code
    var parser = beautifyOptions.parsers[extname] || "html"

    var res = null
    try {
        res = beautify[parser](code, beautifyOptions.options)
    } catch (error) {
        console.log("二次格式化Error: fileKey: " + fileKey)
    }
    return res
}


/**
 * 获取文件的格式化方式
 * @param {*} file
 * @returns
 */
function getFormatType (file) {
    var extname = path.extname(file)

    var type = ""
    switch (extname) {
        case '.js':
        case '.ts':
        case '.wxs':
        case '.sjs':
            type = "js"
            break
        case '.vue':
            type = "vue"
            break
        case '.wxml':
        case '.qml':
        case '.ttml':
        case '.axml':
        case '.swan':
            type = "html"
            break
        case '.wxss':
        case '.qss':
        case '.ttss':
        case '.acss':
        case '.less':
        case '.scss':
        case '.css':
            type = "css"
            break
        case '.json':
            type = "json"
            break
        default:
            //其他不格式化
            type = ""
    }
    return type
}

/**
 * 对目录下面所有文件进行格式化
 * @param {*} folder
 */
function formatFolder (folder) {
    if (!folder) throw new Error("没有输入目录咧！")
    var files = utils.getAllFile(folder)

    //TODO: 统计所用时间
    //TODO:  这里应该只需要文件即可！！！！！！！
    console.log("文件数：" + files.length)

    var bar = new ProgressBar('  格式化进度 [:bar] :rate/bps :percent 剩余:etas ', {
        complete: '█',
        incomplete: '░',
        width: 60,
        total: files.length
    })

    var len = files.length
    var cur = 0
    var complete = function () {

    }
    files.forEach(function (file) {
        let isFolder = !path.extname(file)
        if (isFolder) {
            bar.tick()
        } else {
            var type = getFormatType(file)
            if (type && !/\.min\./.test(file)) {
                var fileData = fs.readFileSync(file, 'utf8')
                fileData = formatCode(fileData, type, file, false)
                $.writeFile(fileData, file, false)
                bar.tick()
            } else {
                bar.tick()
            }
            // if (type && !/\.min\./.test(file)) {
            // fs.readFile(file, 'utf-8', function (err, data) {
            //     if (err) {
            //         console.log(err)
            //         bar.tick()
            //     } else {
            //         var type = getFormatType(file)
            //         var fileData = formatCode(data, type, file, false)
            //         // $.writeFile(fileData, file, false)
            //         fs.writeFile(file, fileData, function (err) {
            //             if (err) {
            //                 bar.tick()
            //                 return console.log(err)
            //             }
            //             bar.tick()
            //         })
            //     }
            // })
            // } else {
            //     bar.tick()
            // }
        }
    })
}

module.exports = {
    formatCode,
    formatFolder

}
