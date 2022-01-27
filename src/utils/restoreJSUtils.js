/*
 * @Author: zhang peng
 * @Date: 2021-08-03 15:40:27
 * @LastEditTime: 2022-01-26 09:50:00
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\src\utils\restoreJSUtils.js
 *
 */


const $ = require('gogocode')
const path = require('path')
const fs = require('fs-extra')

const t = require("@babel/types")
const { parseExpression } = require("@babel/parser")



var appRoot = "../.."
const utils = require(appRoot + '/src/utils/utils.js')

const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const babelGenerate = require('@babel/generator').default

const generate = require('@babel/generator').default



/**
 * true、false缩写还原
 * var isTrue = !0;  -->  var isTrue = true;
 * var isFalse = !1; -->  var isFalse = false;
 * @param {*} $ast
 */
// function restoreBoolean ($ast) {
//     $ast
//         .find({ type: "UnaryExpression" }).each(function (item) {
//             var bool = "" + !item.attr("argument.extra.rawValue")
//             item.replaceBy(bool)
//         }).root()
// }


/**
 * 十六进制转10进制
 * 3e8 --> 1000
 * '\x68\x65\x6c\x6c\x6f' --> 'hello'
 * @param {*} $ast
 */
// function restoreLiteral ($ast) {
//     $ast.find({ type: "Literal" }).each(function (item) {
//         item.attr("extra.raw", item.attr("value"))
//     }).root()
// }


/**
 * 展开SequenceExpression表达式
 *
 * 示例1：
 * if(a=1, b=2, c===5){}  -->  a=1; b=2; if(c===5){}
 *
 * 示例2：
 * return a = 1, b = 2, c = 3, false;  -->  a = 1;  b = 2;  c = 3;  return false;
 */
// function splitSequenceExpression ($ast) {
//     $ast.
//         find({ type: "ReturnStatement" }).each(function (item) {
//             sequenceExpressionHandle(item.node.argument, item)
//         }).root()
//         .find({ type: "IfStatement" }).each(function (item) {
//             sequenceExpressionHandle(item.node.test, item)
//         }).root()
//         .find({ type: "SequenceExpression" }).each(function (item) {
//             var parentPath = item[0].nodePath.parentPath.node
//             if (t.isReturnStatement(parentPath) || t.isIfStatement(parentPath)) return
//             sequenceExpressionHandle(item.node, item, true)
//         }).root()
//     return $ast
// }

/**
 * 分割SequenceExpression表达式核心方法
 * @param {*} path
 * @param {*} parentPath
 * @param {*} isRemoveParent 是否需要删除父级，即是否需要保留表达式本身
 */
// function sequenceExpressionHandle (path, parentPath, isRemoveParent) {
//     if (t.isSequenceExpression(path)) {
//         //多判断一下，覆盖更多情况
//         let expressions = path.expressions

//         if (isRemoveParent) {
//             expressions.forEach(function (callExp) {
//                 //组装ExpressionStatement
//                 var newExp = t.expressionStatement(callExp)
//                 //往前插，如果使用insertAfter会变成倒序
//                 parentPath.before(newExp)
//             })
//             parentPath.remove()
//         } else {
//             for (let i = 0;i < expressions.length - 1;i++) {
//                 const subPath = expressions[i]
//                 let exp = t.expressionStatement(subPath)
//                 parentPath.before(exp)
//             }

//             //保留最后一个表达式
//             expressions.splice(0, expressions.length - 1)
//         }
//     }
// }


/////////////////////////////////////////////////////////////////////////////////////////////


// JavaScript Obfuscator Tool

// Uglify

/**
 * 添加替换的标记
 * @param {*} code
 * @param {*} name
 * @returns
 */
function addReplaceTag (code, name) {
    var tag = `const ${ name } = "replace-tag-375890534@qq.com"; \r\n`
    return tag + code
}



/**
 * //TODO: 嵌套时，还有问题
 * 重名FunctionExpression第一个参数为newName
 * //前提，第一个参数仅为单个字符
 * @param {*} path
 * @param {*} newName
 */
function renameFunctionFirstParam (path, newName) {
    if (!t.isFunctionExpression(path)) return

    let params = path.get("params")
    if (params.length === 0) return

    var firstParam = params[0]
    if (t.isIdentifier(firstParam) && firstParam.node.name.length === 1) {
        path.scope.rename(firstParam.node.name, newName)
    }
}


//测试用例：
// if (p || (p = u.toLowerCase().replace(/ ?\n/g, " ")), h = "#" + p, s.helper.isUndefined(t
//     .gUrls[p])) {
// h = "";
// } else h = t.gUrls[p];

// if (p || (p = u.toLowerCase().replace(/ ?\n/g, " ")), h = "#" + p, s.helper.isUndefined(t
// 		.gUrls[p])) {
// 	if (!(e.search(/\(\s*\)$/m) > -1)) return e;
// 	h = "";
// } else h = t.gUrls[p], s.helper.isUndefined(t.gTitles[p]) || (d = t.gTitles[p]);

// var n = function(e, r, n, a, o, i, l, c) {
// 	s.helper.isUndefined(c) && (c = ""), e = r;
// 	var u = n,
// 		p = a.toLowerCase(),
// 		h = o,
// 		d = c;
// 	if (!h)
// 		if (p || (p = u.toLowerCase().replace(/ ?\n/g, " ")), h = "#" + p, s.helper.isUndefined(t
// 				.gUrls[p])) {
// 			if (!(e.search(/\(\s*\)$/m) > -1)) return e;
// 			h = "";
// 		} else h = t.gUrls[p], s.helper.isUndefined(t.gTitles[p]) || (d = t.gTitles[p]);
// 	var f = '<a href="' + (h = s.helper.escapeCharacters(h, "*_", !1)) + '"';
// 	return "" !== d && null !== d && (d = d.replace(/"/g, "&quot;"), f += ' title="' + (d = s.helper
// 			.escapeCharacters(d, "*_", !1)) + '"'),
// 		f += ">" + u + "</a>";
// };
// return e = (e = t.converter._dispatch("anchors.before", e, r, t)).replace(
// 		/(\[((?:\[[^\]]*]|[^\[\]])*)][ ]?(?:\n[ ]*)?\[(.*?)])()()()()/g, n),
// 	e = e.replace(
// 		/(\[((?:\[[^\]]*]|[^\[\]])*)]\([ \t]*()<?(.*?(?:\(.*?\).*?)?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))/g,
// 		n),
// 	e = e.replace(/(\[([^\[\]]+)])()()()()()/g, n), e = t.converter._dispatch("anchors.after", e, r, t);


/**
 * 一行代码转多行代码 (还原http://lisperator.net/uglifyjs/压缩代码)
 * 1.用逗号连起来的：a = 5, this.fun1(), this.fun2();
 * 2.使用&&进行判断：a && a = 5, b = 6;
 * 3.if (1 == a.is_open_sku) o=4; else o=5; 改成多行展示
 * 4.for (var e = t.data.result.list, a = 0; a < e.length; a++) o.data.kino_list.push(e[a]); 改多行
 * @param {*} ast
 */
function oneLineToMultiLine (ast) {
    traverse(ast, {
        //遍历顺序，先大后小
        IfStatement (path) {
            let test = path.node.test
            if (t.isSequenceExpression(test)) {
                /**
                 *
                 * if(a=1, b=2, c===5){}
                 *
                 * 转换后：
                 *
                 * a=1;
                 * b=2;
                 * if(c===5){}
                 *
                 */
                sequenceExpressionHandle(test, path)
            }


            /**
             * 改成多行展示
             * if (1 == a.is_open_sku) o=4; else o=5;
             * if (1 == a.is_open_sku) { o=4; else o=5; }
             */
            let consequent = path.node.consequent
            let alternate = path.node.alternate

            if (alternate) {
                if (!t.isBlockStatement(consequent)) {
                    path.node.consequent = t.blockStatement([consequent])
                }

                if (!t.isBlockStatement(alternate)) {
                    path.node.alternate = t.blockStatement([alternate])
                }
            } else {
                //没有else
                if (!t.isBlockStatement(consequent)) {
                    path.node.consequent = t.blockStatement([consequent])
                }
            }

        },
        ForStatement (path) {
            //for (var e = t.data.result.list, a = 0; a < e.length; a++) o.data.kino_list.push(e[a]);
            //转换为：
            //for (var e = t.data.result.list, a = 0; a < e.length; a++) { that.kino_list.push(e[a]);  }
            const body = path.node.body
            if (!t.isBlockStatement(body)) {
                path.node.body = t.blockStatement([body])
            }
        },
        ForInStatement (path) {
            //for (var r in a) a[r].idid = "ab" + r;
            //转换为：
            //for (var r in a) (a[r].idid = "ab" + r);
            const body = path.node.body
            if (!t.isBlockStatement(body)) {
                path.node.body = t.blockStatement([body])
            }
        },
        ForOfStatement (path) {
            //for (var r of a) a[r].idid = "ab" + r;
            //转换为：
            //for (var r of a) (a[r].idid = "ab" + r);
            const body = path.node.body
            if (!t.isBlockStatement(body)) {
                path.node.body = t.blockStatement([body])
            }
        },
        ExpressionStatement (path) {
            var exp = path.node.expression
            if (exp) {
                //判断是否为多行
                if (t.isSequenceExpression(exp)) {
                    //示例代码：a = 5, this.fun1(), this.fun2();
                    var expressions = exp.expressions
                    expressions.forEach(function (callExp) {
                        //组装ExpressionStatement
                        var newExp = t.expressionStatement(callExp)
                        //往前插，如果使用insertAfter会变成倒序
                        path.insertBefore(newExp)
                    })
                    // path.remove()
                    path.replaceWith(t.emptyStatement())  //用一个;替换，后面有prettier格式化兜底无须操心
                } else if (t.isLogicalExpression(exp)) {
                    var operator = exp.operator
                    if (operator === "&&") {
                        //示例代码：a === 0 && this.a = 5;
                        var consequentBlockStatement = exp.left
                        var alternateBlockStatement = t.blockStatement([t.expressionStatement(exp.right)], [])
                        var ifStatement = t.ifStatement(consequentBlockStatement, alternateBlockStatement)
                        path.replaceWith(ifStatement)
                    } else if (operator === "||") {
                        //TODO:好像不需要转换！！！！！
                        // 转换前： "" == str || /\d/.test(num) || console.log();
                        // 转换后： if(!("" == str || /\d/.test(num))) console.log();
                        // 判断条件需取反
                        // var unaryExpression = t.unaryExpression("!", exp.left)
                        // var alternateBlockStatement = t.blockStatement([t.expressionStatement(exp.right)], [])
                        // var ifStatement = t.ifStatement(unaryExpression, alternateBlockStatement)
                        // try {
                        //     path.replaceWith(ifStatement)
                        // } catch (error) {
                        //     console.log(error)
                        // }

                    }
                }
            }
        },
        //一行声明拆成多行声明
        VariableDeclaration (path) {
            var declarations = path.get("declarations")
            const parentPath = path.parentPath

            if (declarations.length > 1) {
                //处理for里面的var
                //如：for (var e = t.data.result.list, a = 0; a < e.length; a++)
                // for (var that = this, n = t.detail.value, o = that.moenylist, a = 0; a < o.length; a++) {
                //     if (o[a] == n) {}
                // }
                if (t.isForStatement(parentPath)) {
                    //TODO: ？ var 就处理一下，其他不管了

                    //太复杂
                    // function e(t, e, i) {
                    //     if (isNaN(t)) throw new Error("[wxCharts] unvalid series data!");
                    //     i = i || 10, e = e || "upper";
                    //     for (var n = 1; i < 1; ) i *= 10, n *= 10;
                    //     for (t = "upper" === e ? Math.ceil(t * n) : Math.floor(t * n); t % i != 0; ) "upper" === e ? t++ : t--;
                    //     return t / n;
                    // }

                    // if (path.node.kind === "var" && declarations > 3) {
                    //     var lastPath = null
                    //     declarations.forEach(function (subPath, i) {
                    //         //留最后一个
                    //         let varDec = t.variableDeclaration(path.node.kind || "let", [subPath.node])
                    //         if (i < declarations.length - 1) {
                    //             parentPath.insertBefore(varDec)
                    //         } else {
                    //             lastPath = varDec
                    //         }
                    //     })

                    //     if (lastPath) {
                    //         path.replaceWith(lastPath)
                    //     }
                    // }
                } else {
                    declarations.forEach(function (subPath) {
                        let varDec = t.variableDeclaration(path.node.kind || "let", [subPath.node])
                        path.insertBefore(varDec)
                    })
                    //TODO:分享
                    //这里不能使用path.remove()，会导致遍历VariableDeclarator时，操作的不是此对象
                    // path.remove()
                    path.replaceWith(t.emptyStatement())  //用一个;替换，后面有prettier格式化兜底无须操心
                }
            }
        },
        ReturnStatement (path) {
            let argument = path.node.argument
            if (t.isSequenceExpression(argument)) {
                /**
                 *
                 * return a = 1, b = 2, c = 3, false;
                 *
                 * 转换为：
                 *
                 * a = 1;
                 * b = 2;
                 * c = 3;
                 * return false;
                 *
                 */
                sequenceExpressionHandle(argument, path)
            }
        }
    })
}


/**
 *
 * 展开SequenceExpression表达式
 *
 * 示例1：
 * if(a=1, b=2, c===5){}
 *
 * 转换后：
 *
 * a=1;
 * b=2;
 * if(c===5){}
 *
 * 示例2：
 * return a = 1, b = 2, c = 3, false;
 *
 * 转换为：
 *
 * a = 1;
 * b = 2;
 * c = 3;
 * return false;
 *
 */
function sequenceExpressionHandle (path, parentPath) {
    if (t.isSequenceExpression(path)) {
        //多判断一下，覆盖更多情况
        let expressions = path.node ? path.node.expressions : path.expressions

        for (let i = 0;i < expressions.length - 1;i++) {
            const subPath = expressions[i]
            let exp = t.expressionStatement(subPath)
            parentPath.insertBefore(exp)
        }

        //保留最后一个表达式
        expressions.splice(0, expressions.length - 1)
    }
}

/**
 * 逻辑变量展开
 * !0 ==> true;  !1 ==> false
 * @param {*} ast
 */
function unaryExpressionHandle (ast) {
    traverse(ast, {
        UnaryExpression (path) {
            const { operator, argument } = path.node
            if (operator === "!" && t.isNumericLiteral(argument)) {
                var value = argument.value
                if (value === 1 || value === 0) {
                    path.replaceWith(t.booleanLiteral(value === 0))
                }
            }
        }
    })
}
/**
 * 字符串及数字还原
 * 3e8 ==> 1000
 * '\x68\x65\x6c\x6c\x6f' --> 'hello'
 * @param {*} ast
 */
function literalHandle (ast) {
    traverse(ast, {
        NumericLiteral ({ node }) {
            // 1e3 --> 1000
            if (node.extra && node.extra.raw !== "" + node.extra.rawValue) {
                node.extra = undefined
            }
        },
        StringLiteral ({ node }) {
            //'\x68\x65\x6c\x6c\x6f' --> 'hello'
            if (node.extra && /\\[ux]/gi.test(node.extra.raw)) {
                node.extra = undefined
            }
        },
    })
}



/**
 * 判断表达式精简
 *
 * if ("" != r && void 0 != r) {}  ==> if (r){}
 * if (void 0 != s && 0 != s) {}   ==> if (s){}
 * if ('' != o.smfy && '0' != o.smfy) {}  ==> if(o.smfy){}
 * @param {*} ast
 */
function logicalExpressionHandle (ast) {
    traverse(ast, {
        noScope: true,
        LogicalExpression (path) {
            let parentPath = path.parentPath
            if (t.isIfStatement(parentPath) || t.isLogicalExpression(parentPath)) {
                let left = path.get("left")
                let right = path.get("right")

                if (t.isBinaryExpression(left) && t.isBinaryExpression(right)) {
                    mergeBinaryExpression(path)
                } else {
                    if (t.isLogicalExpression(left)) {
                        mergeBinaryExpression(left)
                    }
                    if (t.isLogicalExpression(right)) {
                        mergeBinaryExpression(right)
                    }
                }
            }
        }
    })
}

/**
 * 生成代码
 * @param {*} path
 */
function generateCode (ast) {
    return generate(ast, { retainFunctionParens: false }).code
}

/**
 * 合并BinaryExpression
 * if ("" != r && void 0 != r) {}  ==> if (r){}
 * if (void 0 != s && 0 != s) {}   ==> if (s){}
 * if ('' != o.smfy && '0' != o.smfy) {}  ==> if(o.smfy){}
 * @param {*} path
 */
function mergeBinaryExpression (path) {
    if (t.isBinaryExpression(path) || t.isLogicalExpression(path)) {
        let left = path.node ? path.node.left : path.left
        let right = path.node ? path.node.right : path.right
        if (t.isBinaryExpression(left) && t.isBinaryExpression(right)) {
            //简单判断一下，只要left和right都是同一个值，且连接符是!=号就算过
            let leftSubLeft = left.left
            let leftSubRight = left.right
            let leftOperator = left.operator
            //
            let rightSubLeft = right.left
            let rightSubRight = right.right
            let rightOperator = right.operator

            if (leftOperator === rightOperator && leftOperator === "!=") {
                if (t.isIdentifier(leftSubRight) && t.isIdentifier(rightSubRight)) {
                    if (leftSubRight.name === rightSubRight.name) {
                        path.replaceWith(t.identifier(leftSubRight.name))
                    }
                } else if (t.isMemberExpression(leftSubRight) && t.isMemberExpression(rightSubRight)) {
                    var leftSubRightName = generateCode(leftSubRight)
                    var rightSubRightName = generateCode(rightSubRight)
                    if (leftSubRightName === rightSubRightName) {
                        path.replaceWith(leftSubRight)
                    }
                }
            }
        }
    }
}

/**
 * js修复
 * success和fail回调函数的参数语义化(嵌套时有问题)
 * success ==> res; fail ==> err
 *
 * if("" != r && void 0 != r){} ==> if(r){}
 *
 * @param {*} path
 */
function repairJavascript (ast) {
    traverse(ast, {
        ObjectProperty (path) {
            //嵌套函数，会有bug，都是重名的。
            // let key = path.get("key")
            // let value = path.get("value")
            // let name = ""
            // if (t.isIdentifier(key)) {
            //     name = key.node.name
            // } else if (t.isStringLiteral(key)) {
            //     name = key.node.value
            // }

            // if (t.isFunctionExpression(value)) {
            //     if (name === "success") {
            //         renameFunctionFirstParam(value, "res")
            //     } else if (name === "fail") {
            //         renameFunctionFirstParam(value, "err")
            //     }
            // }
        },
    })
}


/**
 * 修复前预操作 必须先执行，否则可能修改不完全!!!
 * //this声明合并，that重命名
 * //只针对作用域里第一级
 * @param {*} ast
 */
function repairThisExpression (ast) {
    traverse(ast, {
        FunctionExpression (path) {
            var list = path.get("body.body")
            var hasThis = false
            list.forEach(function (subPath) {
                if (t.isVariableDeclaration(subPath)) {
                    var declarations = subPath.node.declarations
                    if (declarations.length) {
                        //修改定义里面的变量
                        declarations.forEach(function (varPath, index) {
                            let id = varPath.id
                            let init = varPath.init
                            if (t.isThisExpression(init) && t.isIdentifier(id)) {
                                if (path.scope.bindings["that"]) {
                                    //TODO: 已经有that这个变量名了，此变量暂时不做处理！！！
                                } else {
                                    //重名为that
                                    path.scope.rename(id.name, "that")

                                    if (hasThis) {
                                        //合并this声明
                                        if (declarations.length > 1) {
                                            declarations.splice(index, 1)
                                        } else {
                                            subPath.remove()
                                        }
                                    } else {
                                        hasThis = true
                                    }
                                }
                            }
                        })
                    }
                }
            })
        }
    })
}

/**
 * this变量名语义化
 * @param {*} ast
 */
function renameThisName (ast) {
    traverse(ast, {
        VariableDeclarator (path) {
            //fix
            // var n = this; --> var that = this;
            //新增，将所有this的别名，统一修改成that
            let id = path.get("id")
            let init = path.get("init")
            if (t.isThisExpression(init) && t.isIdentifier(id)) {
                let hasBindThis = path.scope.getBinding("that")
                if (!hasBindThis && id.node.name.length === 1) {
                    path.scope.rename(id.node.name, "that")
                }
            }
        }
    })
}

/**
 * getApp变量名语义化
 * @param {*} ast
 */
function renameGetApp (ast) {
    traverse(ast, {
        VariableDeclarator (path) {
            let id = path.get("id")
            let init = path.get("init")
            if (t.isCallExpression(init)) {
                let callee = init.get("callee")
                if (t.isIdentifier(id) && t.isIdentifier(callee.node, { name: "getApp" })) {
                    getAppHandle(path, id)
                }
            } else if (t.isNewExpression(init)) {
                let callee = init.get("callee")
                if (t.isIdentifier(callee.node, { name: "getApp" })) {
                    getAppHandle(path, id)
                }
            }
        }
    })
}

/**
 * getApp() 处理
 * @param {*} path
 * @param {*} id
 * @returns
 */
function getAppHandle (path, id) {
    if (!path) return

    //将所有getApp的别名，统一修改成app
    var appName = "app"
    let hasBindApp = path.scope.getBinding(appName)
    if (!hasBindApp && id.node.name !== appName) {
        path.scope.rename(id.node.name, appName)
    }
}

/**
 * 三元表达式转if表达式，支持递归，无限嵌套
 * //TODO: （针对：r = a ? 2 == d ? "1111" : "2222"  : "3333"; 需再次遍历，暂无更好办法）
 * //TODO: 返回值的处理
 * @param {*} path
 */
function conditionalExpToIfStatement (ast) {
    traverse(ast, {
        noScope: true,
        ExpressionStatement (path) {
            let exp = path.node.expression
            if (exp && t.isConditionalExpression(exp)) {
                //三元表达式转if表达式
                if (t.isConditionalExpression(exp.consequent)) {
                    conditionalExpToIfStatement(exp.consequent)
                }
                if (t.isConditionalExpression(exp.alternate)) {
                    conditionalExpToIfStatement(exp.alternate)
                }
                //组装if
                let consequentBlockStatement = t.blockStatement([t.expressionStatement(exp.consequent)], [])
                let alternateBlockStatement = t.blockStatement([t.expressionStatement(exp.alternate)], [])
                let ifStatement = t.ifStatement(exp.test, consequentBlockStatement, alternateBlockStatement)
                path.replaceWith(ifStatement)
            }
        },
        AssignmentExpression (path) {
            //TODO
            let left = path.node.left
            let right = path.node.right
            let operator = path.node.operator

            if (t.isConditionalExpression(right)) {
                let test = right.test
                let consequent = right.consequent
                let alternate = right.alternate

                var consequentAssignmentExp = t.assignmentExpression(operator, left, consequent)
                var alternateAssignmentExp = t.assignmentExpression(operator, left, alternate)

                let consequentBlockStatement = t.blockStatement([t.expressionStatement(consequentAssignmentExp)], [])
                let alternateBlockStatement = t.blockStatement([t.expressionStatement(alternateAssignmentExp)], [])
                let ifStatement = t.ifStatement(test, consequentBlockStatement, alternateBlockStatement)

                // console.log(`代码为ifStatement：${ generate(ifStatement).code }`)
                //TODO: 例外：for (t = "upper" === e ? Math.ceil(t * n) : Math.floor(t * n); t % i != 0; ) "upper" === e ? t++ : t--;
                if (!t.isForStatement(path.parentPath)) {
                    path.replaceWith(ifStatement)
                }
            }
        },
    })
}


/**
 * 关键字重命名
 * 忽略微信小程序云函数的转换(wx.cloud.xxx)
 * @param {*} path
 * @param {*} name
 */
function renameKeyword (path, name) {
    // 获取当前变量名的绑定关系
    const currentBinding = path.scope.getBinding(name)
    currentBinding.referencePaths.forEach(function (p) {
        if (t.isMemberExpression(p.parentPath.node)) {
            var meExp = p.parentPath.node
            var object = meExp.object
            var property = meExp.property
            if (t.isIdentifier(object, { name: name }) && t.isIdentifier(property, { name: "cloud" })) {
            } else {
                //wx.xxx替换为uni.xxx;
                object.name = "uni"
            }
        }
    })
}


/**
 * 替换ast里指定关键字(如wx或qq)为uni
 * @param {*} ast
 */
function renameKeywordToUni (ast, name = 'wx') {
    //TODO: 还有其他关键字 !!!!
    traverse(ast, {
        Program (path) {
            if (Array.isArray(name)) {
                name.forEach((n) => {
                    // path.scope.rename(n, 'uni')
                    renameKeyword(path, n)
                })
            } else {
                // path.scope.rename(name, 'uni')
                renameKeyword(path, name)
            }
        },
        VariableDeclarator (path) {
            if (t.isStringLiteral(path.node.init, { value: 'replace-tag-375890534@qq.com' })) {
                path.remove()
                path.stop()
            }
        },
    })
}




var useScopeList = {}
/**
 * var t = getApp() --> var app = getApp()
 * t.siteInfo ->> app.globalData.siteInfo
 * t.fun() --> app.globalData.fun()
 *
 * @param {*} ast
 */
function getAppHandleByAst (ast) {
    traverse(ast, {
        VariableDeclarator (path) {
            getAppHandleByVariableDeclarator(path)
        },
        NewExpression (path) {
            getAppHandleByNewExpression(path)
        }
    })
}

function getAppHandleByVariableDeclarator (path) {
    if (t.isVariableDeclarator(path)) {
        let id = path.get("id")
        let init = path.get("init")
        if (t.isCallExpression(init)) {
            let callee = init.get("callee")
            if (t.isIdentifier(id) && t.isIdentifier(callee.node, { name: "getApp" })) {
                getAppHandle(path, id)
            }
        } else if (t.isNewExpression(init)) {
            let callee = init.get("callee")
            if (t.isIdentifier(callee.node, { name: "getApp" })) {
                getAppHandle(path, id, true)
            }
        }
    }
}

function getAppHandleByNewExpression (path) {
    if (t.isNewExpression(path)) {
        let callee = path.get("callee")
        if (t.isIdentifier(callee.node, { name: "getApp" })) {
            callee = t.callExpression(t.identifier("getApp"), [])
            path.replaceWith(callee)
        }
    }
}

/**
 * getApp() 处理
 * @param {*} path
 * @param {*} id
 * @returns
 */
function getAppHandle (path, id, isNewExpression) {
    let scope = path.parentPath.scope
    //判断二次声明app的骚写法
    /**
     * var app = getApp();
     * var app = getApp();
     * app.test();
     */
    // console.log("scope.uid", scope.uid)
    if (useScopeList[scope.uid] === true) {
        //已经遍历过
        path.remove()
        return
    }

    if (useScopeList.hasOwnProperty(scope.uid)) return

    /**
     * 这里两种解决方案
     * 一、将变量所在引用替换为getApp的变量+globalData，如：var abc = getApp(); abc.globalData.xxx
     * 二、将变量替换一下即可，改动较小，但可能会遇到在vue加载前就加载了组件的情况。。。
     */

    //方案0：感觉更优雅一点

    //新增，将所有getApp的别名，统一修改成app
    let hasBindApp = path.scope.getBinding("app")
    if (!hasBindApp && id.node.name !== "app") {
        path.scope.rename(id.node.name, "app")
    }

    var oldIdName = id.node.name
    // 获取当前变量名的绑定关系
    const currentBinding = path.scope.getBinding(oldIdName)
    if (currentBinding) {
        currentBinding.referencePaths.forEach(function (p) {
            if (t.isMemberExpression(p.parentPath.node)) {
                var meExp = p.parentPath.node
                var object = meExp.object
                var property = meExp.property
                if (t.isIdentifier(object, { name: oldIdName }) && t.isIdentifier(property, { name: "globalData" })) {
                    //可能是var {xxx} = app.globalData;
                } else {
                    //app.xxx替换为app.globalData.xxx;
                    meExp.object.name = oldIdName + ".globalData"
                }
            }
        })
    }


    //方案一：
    // var oldIdName = id.node.name;
    // scope.rename(id.node.name, id.node.name + ".globalData");
    // path.node.id.name = oldIdName;
    // useScopeList[scope.uid] = true;

    //方案二：
    // let memExp = t.memberExpression(t.callExpression(t.identifier("getApp"), []), t.identifier("globalData"));
    // let varDec = t.variableDeclarator(id.node, memExp);
    // path.replaceWith(varDec);
    // path.skip();


    //如果是 var a = new getApp();
    if (isNewExpression && path) {
        var newPath = t.VariableDeclarator(t.identifier(id.node.name), t.callExpression(t.identifier("getApp"), []))
        path.replaceWith(newPath)
    }
}


const JavascriptParser = require(appRoot + "/src/page/script/JavascriptParser")

//初始化一个解析器
const javascriptParser = new JavascriptParser()


/**
 * 修复一下这种代码混淆结构
 * Page((o = {
 *  data: (e = {
 *   list: [],
 *   num: 1,
 * }, t(e, "content", ""), t(e, "sp", 0)), e)}, t(o, "onHide", function () {}), t(o, "onUnload", function () {})), o));
 * @param {*} path          SequenceExpression节点
 * @param {*} targetPath    递归使用，当前节点对象
 * @param {*} keyNode       递归使用，当前节点的名称对象
 * @returns
 */
function transformSequenceExpression (path, targetPath, keyNode) {
    if (!t.isSequenceExpression(path)) return

    var expressions = path.expressions || path.node.expressions || []
    if (expressions.length > 1
        && t.isAssignmentExpression(expressions[0])
        && t.isIdentifier(expressions[expressions.length - 1])) {
        var objExpression = t.objectExpression([])
        expressions.map(function (subPath) {
            if (t.isAssignmentExpression(subPath)) {
                var right = subPath.right
                if (t.isObjectExpression(right)) {
                    var properties = right.properties

                    properties.map(function (node) {
                        if (t.isObjectProperty(node)) {
                            if (t.isSequenceExpression(node.value)) {
                                transformSequenceExpression(node.value, path, node.key)
                            } else {
                                objExpression.properties.push(node)
                            }
                        }
                    })
                }
            } else if (t.isCallExpression(subPath)) {
                if (subPath.arguments.length == 3) {
                    var key = subPath.arguments[1]
                    var value = subPath.arguments[2]
                    objExpression.properties.push(t.objectProperty(key, value))
                }
            }
        })
        if (t.isObjectProperty(path.parentPath)) {
            path.replaceWith(objExpression)
        } else {
            if (targetPath) {
                if (keyNode) {
                    var newObjProperty = t.objectProperty(keyNode, objExpression)
                    var newObjExpression = t.objectExpression([newObjProperty])
                    targetPath.replaceWith(newObjExpression)
                } else {
                    targetPath.replaceWith(objExpression)
                }
            } else if (t.isObjectProperty(path)) {
                path.node.properties.push(...objExpression.properties)
            } else {
                path.replaceWith(objExpression)
            }
        }
    }
}


/**
 * 修复特殊代码结构
 * Page((o = {
 *  data: (e = {
 *   list: [],
 *   num: 1,
 * }, t(e, "content", ""), t(e, "sp", 0)), e)}, t(o, "onHide", function () {}), t(o, "onUnload", function () {})), o));
 * @param {*} ast
 */
function fixSpecialCode (ast) {
    traverse(ast, {
        SequenceExpression (path) {
            transformSequenceExpression(path)
        }
    })
}

/**
 * gogocode版本
 * @param {*} $ast
 * @returns
 */
function fixSpecialCode2 ($ast, astType) {

    //还有问题！！！！
    var keyword = ""
    switch (astType) {
        case "App":
        case "Page":
        case "Behavior":
        case "Component":
        case "CustomPage":
            keyword = astType
            break
        default:
            break
    }

    if (!keyword) return

    // var result = $ast.find(`${ keyword }(($_$fun($_$1={$$$1}, $$$2),$$$3))`)
    // if (result.length) {
    //     $ast.replace(`${ keyword }(($_$fun($_$1={$$$1}, $$$2),$$$3))`,`${ keyword }(($_$1={$$$1}, $$$2),$$$3)`)
    // }

    // var result = $ast.find(`${ keyword }(($_$1={$$$1}, $$$2))`)
    // if (!result.length) return

    let varName = $ast.find(`${ keyword }(($_$1={$$$1}, $$$2))`).match[1][0].value

    var varName2 = ''
    var res2 = $ast.find(`${ keyword }(($_$1={data:($_$2={$$$1},$$$2)}, $$$3))`)
    if (res2.length) {
        varName2 = res2.match[2][0].value
    }
    $ast.replace(
        '$_$var1($_$var2, "$_$name", $_$value)',
        (match, nodePath) => {
            if (match['var1'][0].node.type === 'Identifier') {
                return '$_$name:$_$value'
            } else {
                return null
            }
        }
    )
    if (varName2) {
        $ast.replace(`{data:(${ varName2 }={$$$1}, $$$2, ${ varName2 })}`, '{data:{$$$1, $$$2}}')
    }
    $ast.replace(`${ keyword }((${ varName }={$$$1},$$$2,${ varName }))`, '${keyword}({$$$1, $$$2})')
    return $ast.generate()
}


/**
 * js反混淆，仅支持babel ast
 * @param {*} ast
 */
function restoreJS (ast, mpKeyword) {

    //修复特殊代码结构
    try {
        fixSpecialCode(ast)
    } catch (error) {
        console.log("修复特殊代码结构出错。 代码：", generateCode(ast))
    }

    // 预修复
    repairThisExpression(ast)

    // 一行代码转多行代码
    oneLineToMultiLine(ast)

    // 三元表达式转if表达式 (TODO: 如果是两层，需要调两次，如果是三级需要调三级，后面看能不能递归)
    //TODO: 测试递归: r = a ? 2 == d ? "1111" : "2222"  : "3333";
    conditionalExpToIfStatement(ast)
    conditionalExpToIfStatement(ast)

    // 一行代码转多行代码
    oneLineToMultiLine(ast)

    //三元转if表达式
    conditionalExpToIfStatement(ast)
    conditionalExpToIfStatement(ast)

    //PS:这里可能三元表达式在一行代码里面

    // !0 ==> true;  !1 ==> false
    unaryExpressionHandle(ast)

    // 字符串及数字还原
    // 3e8 ==> 1000
    // '\x68\x65\x6c\x6c\x6f' --> 'hello'
    literalHandle(ast)

    // 判断表达式精简
    // if ("" != r && void 0 != r) { } --> if (r) {}
    logicalExpressionHandle(ast)

    // // this变量名语义化
    renameThisName(ast)

    // getApp变量名语义化（getAppHandleByAst()已经做了，所以这里不需要再做！！！）
    // // renameGetApp(ast)

    // 必须放第一！！！至少要在oneLineToMultiLine()之前！！！
    // 不然，如果遇到var t = getApp(), e = t.siteInfo;时就晕了
    getAppHandleByAst(ast)
}


module.exports = {
    restoreJS,

    addReplaceTag,

    fixSpecialCode2,

    renameKeywordToUni,
}
