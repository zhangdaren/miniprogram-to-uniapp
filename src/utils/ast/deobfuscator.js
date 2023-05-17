const generator = require('@babel/generator')
const parser = require('@babel/parser')
const { ParseResult } = require('@babel/parser')
const traverse = require('@babel/traverse').default;
const t = require('@babel/types')
// import * as fs from 'fs'

const { visitorar } = require('./visitorar')
// const { Traverse_ob } = require('./traverse_ob')

// interface Config {
//     name
//     value
//     args?: any[]
// }

// interface History {
//     ast: ParseResult<t.File>
//     time: number
// }

const defaultoutOptions = {
    minified: false,
    jsescOption: { minimal: true },
    compact: false,
    comments: true,
}

class Deobfuscator {
    constructor (
        jscode,
        type = 'ast',  // ast || code
        outOptions = defaultoutOptions,
        isHistory = false,
    ) {
        this.ast = null
        this.historys = []

        if (type === "code") {
            if (!jscode) global.log('请输入js代码')
            this.ast = parser.parse(jscode)
        } else if (type === "ast") {
            if (!jscode) global.log('请输入Babel解析的AST对象')
            this.ast = jscode
        }
        // console.time('useTime')
    }

    getCode (outOptions = null) {
        if (outOptions) {
            return generator(this.ast, outOptions).code
        }
        return generator(this.ast, this.outOptions).code
    }

    reParse () {
        // 将当前ast对应的代码重解析

        const code = this.getCode()
        // 记录解析后生成的代码 方便调试查看
        if (this.isHistory) {
            this.historys.push({
                ast: this.ast,
                time: new Date().getTime(),
            })
        }

        try {
            this.ast = parser.parse(code)
        } catch (error) {
            global.log(error)
            // fs.writeFile(__dirname + '/errorCode.js', code, () => {})
        }
    }

    run () {
        // 针对解密函数与花指令处理 -------------------------------------------------
        // const traverse_ob = new Traverse_ob()

        // traverse_ob.flowerCodeFunc(this.ast) // 处理函数花指令
        // this.reParse()

        // // traverse_ob.mergeObj(this.ast) // 合并对象 (慎用!)
        // traverse_ob.flowerCodeObj(this.ast) // 处理对象花指令
        // this.reParse()

        // traverse_ob.findDecFuncByBigArr(this.ast, true) // 找到大数组的解密函数
        // this.reParse()

        // 通用处理 -------------------------------------------------
        traverse(this.ast, visitorar.removeVariableDeclaration()) // 移除逗号赋值表达式
        traverse(this.ast, visitorar.removeSequenceExpression()) // 移除逗号表达式
        traverse(this.ast, visitorar.removeUnusedValue()) // 移除无用变量

        // traverse(this.ast, visitorar.calcUnary()) // 计算一项式
        traverse(this.ast, visitorar.calcBinary()) // 计算二项式
        traverse(this.ast, visitorar.calcBoolean()) // 计算布尔值

        traverse(this.ast, visitorar.transCondition()) // 三元表达式
        traverse(this.ast, visitorar.conditionVarToIf()) // 三元表达式转换成if

        traverse(this.ast, visitorar.expandIfStatement()) // 展开if判断
        traverse(this.ast, visitorar.optimizeIfStatement()) // 优化if判断
        traverse(this.ast, visitorar.expandForStatement()) // 展开for循环
        traverse(this.ast, visitorar.expandReturnStatement()) // 展开返回表达式
        traverse(this.ast, visitorar.expandExpressionStatement()) // 展开ExpressionStatement表达式

        traverse(this.ast, visitorar.transformDefinePropertyPlus()) // defineProperty函数转换 plus版 -- 先
        traverse(this.ast, visitorar.transformDefineProperty()) // defineProperty函数转换 -- 后


        traverse(this.ast, visitorar.clearDeadCode()) // 清理死代码
        // PS:不能执行这行，否则影响了后面的正常判断，比如：renameKeyword函数
        // traverse(this.ast, visitorar.replaceLiteral()) // 字面量替换

        traverse(this.ast, visitorar.deleteExtra()) // 清理十六进制编码
        // traverse(this.ast, visitorar.addComments(['debugger', 'username', 'password', 'crypto'])) // 添加关键字注释
        traverse(this.ast, visitorar.addCatchLog()) // 输出异常捕获信息
        // -------------------------------------------------
    }
}

// self.addEventListener(
//     'message',
//     function ({ data }) {
//         if (data.code) {
//             try {
//                 const deob = new Deobfuscator(data.code, 'code')
//                 deob.run()
//                 const code = deob.getCode()
//                 console.timeEnd('useTime')

//                 self.postMessage({ code })
//             } catch (error) {
//                 self.postMessage({
//                     type: 'error',
//                     message: error.message,
//                 })
//             }
//         }
//     },
//     false,
// )


module.exports = {
    Deobfuscator
}
