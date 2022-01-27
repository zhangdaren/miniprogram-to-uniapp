/*
 * @Author: zhang peng
 * @Date: 2021-08-02 09:02:29
 * @LastEditTime: 2021-12-22 11:28:17
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\page\style\style-transformer.js
 *
 */
const fs = require('fs-extra')
const path = require('path')

var appRoot = "../../.."
const utils = require(appRoot + '/src/utils/utils.js')
const pathUtils = require(appRoot + '/src/utils/pathUtils.js')
const postcss = require('postcss')
const lessSyntax = require('postcss-less')
const scssSyntax = require('postcss-scss')


/**
 * 处理css文件
 * 1.内部引用的wxss文件修改为css文件
 * 2.修正引用的wxss文件的路径
 *
 * @param {*} fileContent       css文件内容
 * @param {*} file_wxss         当前处理的文件路径
 */
async function transformStyleFile (file_wxss) {
    if (!file_wxss) return ""

    let content = ""
    try {
        content = await new Promise((resolve, reject) => {
            //rpx不再转换

            var fileContent = fs.readFileSync(file_wxss, 'utf-8')

            //删除掉import app.wxss的代码
            //删除掉import wxParse.wxss的代码
            fileContent = fileContent.replace(/@import\s?["'].*?\/?(app|wxParse)[\/\.](.*?)["'];?/g, "")

            //wxss文件所在目录
            let fileDir = path.dirname(file_wxss)
            let extname = path.extname(file_wxss)
            var fileKey = pathUtils.getFileKey(file_wxss)

            let reg_import = /@import\s*['"](.*?)\.wxss['"];*/g  //应该没有写单引号的呗？(服输，还真可能有单引号)
            fileContent = fileContent.replace(reg_import, function (match, $1) {
                //先转绝对路径，再转相对路径
                let filePath = $1
                filePath = pathUtils.relativePath(filePath, global.miniprogramRoot, fileDir)

                //虽可用path.posix.前缀来固定为斜杠，然而改动有点小多，这里只单纯替换一下
                return '@import "' + filePath + '.css";'
            })

            //修复图片路径
            // background-image: url('../../images/bg_myaccount_top.png');
            // background-image: url('https://www.jxddsx.com/wxImgs/myPage/bg_myaccount_top.png');

            //低版本node不支持零宽断言这种写法，只能换成下面的写法(已测v10+是支持的)
            // let reg_url = /url\(['"](?<filePath>.*?)\.(?<extname>jpg|jpeg|gif|svg|png)['"]\)/gi;
            let reg_url = /url\(['"]?(.*?)\.(jpg|jpeg|gif|svg|png)['"]?\)/gi
            let reg_media = /\.(jpg|jpeg|gif|svg|png)$/  //test时不能加/g
            fileContent = fileContent.replace(reg_url, function (...args) {
                //const groups = args.slice(-1)[0];
                //let src = groups.filePath + "." + groups.extname;

                let src = args[1] + "." + args[2]

                // //image标签，处理src路径
                //忽略网络素材地址，不然会转换出错
                //https://github.com/validatorjs/validator.js
                if (src && !utils.isURL(src) && reg_media.test(src)) {
                    if (global.isVueAppCliMode) {
                        //
                    } else {
                        //static路径
                        let staticPath = path.join(global.miniprogramRoot, "static")

                        //当前处理文件所在目录
                        let wxssFolder = path.dirname(file_wxss)
                        var pFolderName = pathUtils.getParentFolderName(src)
                        // console.log("pFolderName ", pFolderName)
                        var fileName = path.basename(src)
                        // console.log("fileName ", fileName)
                        //
                        let filePath = path.resolve(staticPath, "./" + pFolderName + "/" + fileName)
                        src = path.relative(wxssFolder, filePath)
                        // 修复路径
                        src = utils.normalizePath(src)
                    }
                    if (!/^[\.\/]/.test(src)) {
                        src = "./" + src
                    }
                }
                return 'url("' + src + '")'
            })

            //处理iconfont和top
            fileContent = transformIconfont(fileContent, extname, fileKey)

            resolve(fileContent)
        })
    } catch (err) {
        console.log(err)
    }
    return content
}


/**
 * 处理iconfont和top
 * @param {*} fileContent
 * @returns
 */
function transformIconfont (fileContent, extname, fileKey) {
    var ast = null
    switch (extname) {
        case ".less":
            ast = lessSyntax.parse(fileContent)
            break
        case ".scss":
            ast = scssSyntax.parse(fileContent)
            break
        default:
            ast = postcss.parse(fileContent)
            break
    }

    // parse CSS to AST
    if (!ast) {
        console.log(`解析${ extname }失败,源码：${ fileContent }`)
        return fileContent
    }

    const styleRules = ast.nodes

    // 获取所有import
    var importNodeList = styleRules.filter(function (node) {
        return node.type === "atrule" && node.name === "import"
    })

    //获取非import的节点
    var otherNodeList = styleRules.filter(function (node) {
        return node.name !== "import"
    })

    otherNodeList.map((node) => {
        if (node.type === "atrule" && node.name === "font-face") {
            let nodes = node.nodes

            let hasBase64 = nodes.find(obj => obj.prop === 'src' && obj.value.includes("base64"))

            if (!hasBase64) {

                console.log("\n[Tip]这里引用的全是网络字体，可能在app上面有兼容问题（如字体图标显示不出来，运行后没问题就不用管）  fileKey: " + fileKey)
                return
            }

            for (let i = nodes.length - 1;i >= 0;i--) {
                var decl = nodes[i]
                var prop = decl.prop
                var value = decl.value
                if (prop == "src") {
                    if (value.includes("base64")) {
                        var arr = value.replace(/\r\n/g, "").split("),")
                        //为了方便下面的join，在这里这样那样处理一下。
                        arr = arr.join(")^_^").split("^_^")
                        if (arr) {
                            //清除css里失效的iconfont字体文件引用
                            var newArr = arr.filter(function (src) {
                                return src.indexOf(";base64") > -1
                            })
                            decl.value = newArr.join(",").trim()
                        }
                    } else {
                        nodes.splice(i, 1)
                    }
                }
            }
        } else if (node.type === "rule") {

            //TODO:这里要看看，要不要这么搞
            //转换前：
            // .nav{
            //     position: fixed;
            //     top:0rpx;
            // }

            //转换后：
            // .nav{
            //     position: fixed;
            //     top:0rpx;
            //     /*   #ifdef  H5   */
            //     top: calc(88rpx + constant(safe-area-inset-top);
            //     top: calc(88rpx + env(safe-area-inset-top);
            //     /*   #endif   */
            // }

            // let nodes = node.nodes
            // var hasFixed = nodes.some(function (decl) {
            //     return decl.prop === "position" && decl.value === "fixed"
            // })

            // if (hasFixed) {
            //     var decl = nodes.find(function (decl, i) {
            //         return decl.prop === "top" && parseInt(decl.value) === 0
            //     })
            //     if (decl) {
            //         let commentStart = "/*  #ifdef  H5  */"
            //         const constantDecl = postcss.decl({
            //             prop: 'top',
            //             value: "calc(88rpx + constant(safe-area-inset-top))"
            //         })
            //         const envDecl = postcss.decl({
            //             prop: 'top',
            //             value: "calc(88rpx + env(safe-area-inset-top))"
            //         })
            //         let commentEnd = "/*  #endif  */"

            //         decl.after(commentEnd)
            //         decl.after(envDecl)
            //         decl.after(constantDecl)
            //         decl.after(commentStart)
            //         // decl.before("top: calc(88rpx + constant(safe-area-inset-top));")
            //         // decl.before("top: calc(88rpx + env(safe-area-inset-top));")
            //     }
            // }
        }
    })

    //把import加到开头
    otherNodeList.unshift(...importNodeList)
    ast.nodes = otherNodeList

    //使用toString方法可以把语法树转换为字符串
    fileContent = ast.toResult({ map: false }).css
    return fileContent
}


module.exports = { transformStyleFile }
