const t = require('@babel/types')
// const babel = require('@babel/core')
// const parser = require('@babel/parser')
// const traverse = require('@babel/traverse').default
// const generator = require('@babel/generator').default

// 通用的访问器
const visitorar = {
    /**
     * 更改对象成员表达式1
     * object['prop'] --> object.prop
     */
    changeMemberExpression1 () {
        // global.log('更改对象成员表达式1')
        return {
            MemberExpression (path) {
                if (t.isStringLiteral(path.node.property)) {
                    let name = path.node.property.value
                    path.node.property = t.identifier(name)
                    path.node.computed = false
                }
            },
            ObjectProperty (path) {
                if (t.isStringLiteral(path.node.key)) {
                    let name = path.node.key.value
                    path.node.key = t.identifier(name)
                }
                path.node.computed = false
            },
        }
    },

    /**
     * 更改对象成员表达式2
     * object.prop --> object['prop']
     */
    changeMemberExpression2 () {
        // global.log('更改对象成员表达式2')
        return {
            MemberExpression (path) {
                if (t.isIdentifier(path.node.property)) {
                    const name = path.node.property.name
                    path.node.property = t.stringLiteral(name)
                } else if (t.isNumericLiteral(path.node.property)) {
                    const name = path.node.property.value
                    path.node.property = t.stringLiteral(String(name))
                }
                path.node.computed = true
            },
            ObjectProperty (path) {
                if (t.isIdentifier(path.node.key)) {
                    const name = path.node.key.name
                    path.node.key = t.stringLiteral(name)
                    path.node.computed = true
                } else if (t.isNumericLiteral(path.node.key)) {
                    const name = path.node.key.value
                    path.node.key = t.stringLiteral(String(name))
                }
            },
        }
    },

    /**
     * 移除逗号赋值表达式
     * var a = 1,b = ddd()
     * |
     * |
     * V
     * var a = 1;
     * var b = ddd();
     */
    removeVariableDeclaration () {
        // global.log('移除逗号赋值表达式')
        return {
            VariableDeclaration (path) {
                let { kind, declarations } = path.node
                // 如果是在for循环里，则不处理。 TODO:其他循环有没有这种问题？
                // 测试代码：
                // var bjbdx = this.dataSoures;
                // for (let j = 0, lenJ = bjbdx.length; j < lenJ; ++j) {}
                if (declarations.length > 1 && !t.isForStatement(path.parentPath)) {
                    const newVariableDeclarations = declarations.map((d) => t.variableDeclaration(kind, [d]))
                    path.replaceWithMultiple(newVariableDeclarations)
                }
            },
        }
    },

    /**
     * 移除逗号表达式
     * a = 1, b = ddd();
     * |
     * |
     * V
     * a = 1;
     * b = ddd();
     */
    removeSequenceExpression () {
        // global.log('移除逗号表达式')
        return {
            ExpressionStatement (path) {
                const { expression } = path.node
                if (!t.isSequenceExpression(expression)) return
                const body = expression.expressions.map((express) => t.expressionStatement(express))
                path.replaceInline(body)
            },
        }
    },

    /**
     * 计算二项式字面量
     * 1 + 2    "debu" + "gger"
     * |
     * |
     * V
     * 3        "debugger"
     */
    calcBinary () {
        // global.log('计算二项式字面量')
        return {
            BinaryExpression (path) {
                const { left, right } = path.node
                const hasIdentifier = [left, right].some((a) => t.isIdentifier(a))
                if (hasIdentifier) return
                if (t.isLiteral(left) && t.isLiteral(right)) {
                    const { confident, value } = path.evaluate()
                    confident && path.replaceWith(t.valueToNode(value))
                    path.skip()
                }
            },
        }
    },

    /**
     * 计算布尔值
     * !![]     ![]
     * |
     * |
     * V
     * true     false
     */
    calcBoolean () {
        // global.log('计算布尔值')
        return {
            UnaryExpression (path) {
                if (path.node.operator !== '!') return // 避免判断成 void

                // 判断第二个符号是不是!
                if (t.isUnaryExpression(path.node.argument)) {
                    if (t.isArrayExpression(path.node.argument.argument)) {
                        // !![]
                        if (path.node.argument.argument.elements.length == 0) {
                            path.replaceWith(t.booleanLiteral(true))
                            path.skip()
                        }
                    }
                } else if (t.isArrayExpression(path.node.argument)) {
                    // ![]
                    if (path.node.argument.elements.length == 0) {
                        path.replaceWith(t.booleanLiteral(false))
                        path.skip()
                    }
                } else if (t.isNumericLiteral(path.node.argument)) {
                    // !0 or !1
                    if (path.node.argument.value === 0) {
                        path.replaceWith(t.booleanLiteral(true))
                    } else if (path.node.argument.value === 1) {
                        path.replaceWith(t.booleanLiteral(false))
                    }
                } else {
                }
            },
        }
    },

    // /**
    //  * 替换变量赋值
    //  * var _0x272eba = _0x415777;
    //  * var a = _0x272eba["UYCgc"]
    //  * |
    //  * |
    //  * V
    //  * var a = _0x415777["UYCgc"]
    //  */
    // variableReplace() {
    //   return {
    //     VariableDeclarator(path) {
    //       // 如果左右两边都是标识符,就只在当前作用域下替换
    //       if (t.isIdentifier(path.node.id) && t.isIdentifier(path.node.init)) {
    //         path.scope.rename(path.node.id.name, path.node.init.name)
    //       }
    //     },
    //   }
    // },

    /**
     * 平坦化代码
     * 针对"3|2|4|1|0"["split"]('|');
     */
    codeFlat () {
        // global.log('平坦化代码')
        return {
            SwitchStatement (path) {
                let forOrWhileStatementPath = path.findParent((p) => p.isForStatement() || p.isWhileStatement())
                if (!forOrWhileStatementPath) return

                let blockStatementPath = forOrWhileStatementPath.findParent((p) => p.isBlockStatement())
                if (!blockStatementPath) return

                let shufferString
                let shufferArr = []

                forOrWhileStatementPath.traverse({
                    MemberExpression (path) {
                        if (t.isStringLiteral(path.node.property, { value: 'split' })) {
                            // path.node.object.value 取到的是 '1|2|4|7|5|3|8|0|6'

                            if (t.isStringLiteral(path.node.object)) {
                                // path.node.object.value 取到的是 '1|2|4|7|5|3|8|0|6'
                                shufferString = path.node.object.value
                                shufferArr = shufferString.split('|')
                            }
                        }
                    },
                })

                if (shufferArr.length === 0) return

                let myArr
                path.node.cases.map((p) => {
                    const val = (p.test).value
                    myArr[val] = p.consequent[0]
                })

                shufferArr.map((v) => {
                    blockStatementPath.node.body.push(myArr[v])
                })

                // switch  BlockStatement  For or While
                path.parentPath.parentPath.remove()
                path.skip()
            },
        }
    },

    /**
     * 平坦化代码
     * 清除while循环
     */
    // replaceWhile() {
    //   return {
    //     WhileStatement: {
    //       exit: [
    //         function (path: NodePath<t.WhileStatement>) {
    //           var node = path.node
    //           if (!(t.isBooleanLiteral(node.test) || t.isUnaryExpression(node.test))) return
    //           if (!(node.test.prefix || node.test.value)) return
    //           if (!t.isBlockStatement(node.body)) return
    //           var body = node.body.body
    //           if (!t.isSwitchStatement(body[0]) || !t.isMemberExpression(body[0].discriminant) || !t.isBreakStatement(body[1])) return
    //           var swithStm = body[0]
    //           var arrName = swithStm.discriminant.object.name
    //           var argName = swithStm.discriminant.property.argument.name
    //           let arr = []
    //           let all_presibling = path.getAllPrevSiblings()
    //           all_presibling.forEach((pre_path) => {
    //             const { declarations } = pre_path.node
    //             let { id, init } = declarations[0]
    //             if (arrName == id.name) {
    //               arr = init.callee.object.value.split('|')
    //               pre_path.remove()
    //             }
    //             if (argName == id.name) {
    //               pre_path.remove()
    //             }
    //           })
    //           var caseList = swithStm.cases
    //           var resultBody = []
    //           arr.map((targetIdx) => {
    //             var targetBody = caseList[targetIdx].consequent
    //             if (t.isContinueStatement(targetBody[targetBody.length - 1])) targetBody.pop()
    //             resultBody = resultBody.concat(targetBody)
    //           })
    //           path.replaceInline(resultBody)
    //         },
    //       ],
    //     },
    //   }
    // },

    /**
     * 字面量替换 将字符串和数值常量直接替换对应的变量引用地方
     * let a = '1'
     * let b = a
     * |
     * |
     * V
     * let b = '1'
     */
    replaceLiteral () {
        // global.log('字面量替换')
        return {
            // @ts-ignore
            'AssignmentExpression|VariableDeclarator' (path) {
                let name, initValue
                if (path.isAssignmentExpression()) {
                    name = (path.node.left).name
                    initValue = path.node.right
                } else {
                    name = (path.node.id).name
                    initValue = path.node.init
                }

                if (t.isStringLiteral(initValue) || t.isNumericLiteral(initValue)) {
                    const binding = path.scope.getBinding(name)
                    if (binding && binding.constant && binding.constantViolations.length == 0) {
                        for (let i = 0;i < binding.referencePaths.length;i++) {
                            binding.referencePaths[i].replaceWith(initValue)
                        }
                    }
                }
            },
        }
    },

    /**
     * 	清理无用变量与函数
     */
    removeUnusedValue () {
        // global.log('清理无用变量与函数')
        return {
            VariableDeclarator (path) {
                const { id, init } = path.node
                if (!(t.isLiteral(init) || t.isObjectExpression(init) || t.isFunctionExpression(init))) return
                const binding = path.scope.getBinding(id.name)
                if (!binding || binding.constantViolations.length > 0) return

                if (binding.referencePaths.length > 0) return
                path.remove()
            },
            FunctionDeclaration (path) {
                if(!path.node.id) return 
                const binding = path.scope.getBinding(path.node.id.name)
                if (!binding || binding.constantViolations.length > 0) return

                if (binding.referencePaths.length > 0) return
                path.remove()
            },
        }
    },

    /**
     * 清理死代码
     * if(false){
     *  ...
     * }
     */
    clearDeadCode () {
        // global.log('清理死代码')
        return {
            IfStatement (path) {
                function clear (path, toggle) {
                    if (toggle) {
                        if (t.isBlockStatement(path.node.consequent)) {
                            path.replaceWithMultiple(path.node.consequent.body)
                        } else {
                            path.replaceWith(path.node.consequent)
                        }
                    } else {
                        if (path.node.alternate) {
                            if (t.isBlockStatement(path.node.alternate)) {
                                path.replaceWithMultiple(path.node.alternate.body)
                            } else {
                                path.replaceWith(path.node.alternate)
                            }
                        } else {
                            path.remove()
                        }
                    }
                }

                if (t.isBinaryExpression(path.node.test)) {
                    const { left, right, operator } = path.node.test
                    if (t.isLiteral(left) && t.isLiteral(right)) {
                        const leftVal = JSON.stringify((left).value)
                        const rightVal = JSON.stringify((right).value)
                        clear(path, eval(leftVal + operator + rightVal))
                    }
                } else if (t.isLiteral(path.node.test)) {
                    clear(path, eval(JSON.stringify((path.node.test).value)))
                }
            },
        }
    },

    /**
     * a = m?11:22;
     *  |
     *  |
     *  V
     * m ? a = 11 : a = 22;
     */
    transCondition () {
        return {
            // 老代码
            // ConditionalExpression (path) {
            //     let { test, consequent, alternate } = path.node
            //     const ParentPath = path.parentPath
            //     if (ParentPath.isAssignmentExpression()) {
            //         let { operator, left } = ParentPath.node
            //         if (operator === '=') {
            //             consequent = t.assignmentExpression('=', left, consequent)
            //             alternate = t.assignmentExpression('=', left, alternate)
            //             ParentPath.replaceWith(t.conditionalExpression(test, consequent, alternate))
            //         }
            //     }
            // },

            // ConditionalExpression (path) {
            //     let { test, consequent, alternate } = path.node
            //     const parentPath = path.parentPath
            //     let parentPathNode = parentPath.node
            //     // if (t.isExpressionStatement(parentPathNode)) {
            //         // let { test, consequent, alternate } = parentPathNode.expression
            //         //  consequent = t.assignmentExpression('=', left, consequent)
            //         //  alternate = t.assignmentExpression('=', left, alternate)
            //         parentPath.replaceWith(t.conditionalExpression(test, consequent, alternate))
            //     // }
            // },

            ConditionalExpression: {
                exit (path) {
                    let { test, consequent, alternate } = path.node
                    let new_consequent = t.BlockStatement([t.ExpressionStatement(consequent)])
                    let new_alternate = t.BlockStatement([t.ExpressionStatement(alternate)])
                    let if_node = t.IfStatement(test, new_consequent, new_alternate)
                    path.replaceWithMultiple(if_node)
                    path.stop()
                }
            }
        }
    },

    /**
     *  赋值三元表达式转换成if
     *  var a = m ? 11 : 22;;
     *  |
     *  |
     *  V
     * if (m) {
     *   a = 11;
     * } else {
     *   a = 22;
     * }
     */
    //  TODO: 有问题(原因是const)：
    //  const data = this.data;
    //  const value = data.value ? false : true;
    conditionVarToIf () {
        // global.log('赋值三元表达式转换成if')
        // return {
        //     VariableDeclaration (path) {
        //         if (t.isForStatement(path.parentPath)) return
        //         var declarations = path.node.declarations
        //         var rpls = []
        //         var togg = false
        //         for (const declaration of declarations) {
        //             if (t.isConditionalExpression(declaration.init)) {
        //                 togg = true
        //                 let { test, consequent, alternate } = declaration.init
        //                 rpls.push(
        //                     t.ifStatement(
        //                         test,
        //                         t.blockStatement([t.variableDeclaration(path.node.kind, [t.variableDeclarator(declaration.id, consequent)])]),
        //                         t.blockStatement([t.variableDeclaration(path.node.kind, [t.variableDeclarator(declaration.id, alternate)])]),
        //                     ),
        //                 )
        //             } else {
        //                 rpls.push(t.variableDeclaration(path.node.kind, [declaration]))
        //             }
        //         }
        //         if (togg) {
        //             path.replaceWithMultiple(rpls)
        //             path.stop()
        //         }
        //     },
        // }
    },

    /**
     * 清理十六进制编码
     * ['\x49\x63\x4b\x72\x77\x70\x2f\x44\x6c\x67\x3d\x3d',0x123];
     * |
     * |
     * V
     * ["IcKrwp/Dlg==", 291];
     */
    deleteExtra () {
        // global.log('清理十六进制编码')
        return {
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
        }
    },

    /**
     * 给关键代码|标识符 添加注释 TOLOOK
     */
    addComments (keyWords = []) {
        keyWords = keyWords.map((k) => k.toLowerCase())
        // global.log(`添加关键字注释:${ keyWords }`)

        return {
            DebuggerStatement (path) {
                path.addComment('leading', ' TOLOOK', true)
            },
            CallExpression (path) {
                if (!['setTimeout', 'setInterval'].includes((path.node.callee).name)) return
                path.addComment('leading', ' TOLOOK', true)
            },
            StringLiteral (path) {
                if (keyWords.includes(path.node.value.toLowerCase())) {
                    let statementPath = path.findParent((p) => p.isStatement())
                    if (statementPath) {
                        statementPath.addComment('leading', ' TOLOOK', true)
                    } else {
                        path.addComment('leading', ' TOLOOK', true)
                    }
                }
            },
            Identifier (path) {
                let name = path.node.name
                if (keyWords.includes(name.toLowerCase())) {
                    let statementPath = path.findParent((p) => p.isStatement())
                    if (statementPath) {
                        statementPath.addComment('leading', ' TOLOOK', true)
                    } else {
                        path.addComment('leading', ' TOLOOK', true)
                    }
                }
            },
        }
    },

    addCatchLog () {
        // global.log('添加移除捕获输出')
        return {
            CatchClause (path) {
                const err_name = (path.node.param) && (path.node.param).name || ""
                path.node.body.body.unshift({
                    type: 'ExpressionStatement',
                    expression: {
                        type: 'CallExpression',
                        callee: {
                            type: 'MemberExpression',
                            computed: false,
                            object: {
                                type: 'Identifier',
                                name: 'console',
                            },
                            property: {
                                type: 'Identifier',
                                name: 'log',
                            },
                        },
                        arguments: [
                            {
                                type: 'StringLiteral',
                                value: 'CatchClause',
                            },
                            {
                                type: 'Identifier',
                                name: err_name,
                            },
                        ],
                    },
                })
            },
        }
    },

    /**
    * 展开if判断
    * if(a=1, b=2, c===5){}
    * |
    * |
    * V
    * a=1;
    * b=2;
    * if(c===5){}
    */
    expandIfStatement () {
        // global.log('展开if判断')
        return {
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
            },
        }
    },
    /**
     * 展开for循环
     * if(a=1, b=2, c===5){}
     * |
     * |
     * V
     * a=1;
     * b=2;
     * if(c===5){}
     */
    expandForStatement () {
        // global.log('展开for循环')
        return {
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
        }
    },
    /**
     * 展开返回表达式
     * return a = 1, b = 2, c = 3, false;
     * |
     * |
     * V
     * a = 1;
     * b = 2;
     * c = 3;
     * return false;
     */
    expandReturnStatement () {
        // global.log('展开返回表达式')
        return {
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
        }
    },

    /**
     * 展开ExpressionStatement表达式
     * a === 0 && this.a = 5;
     * |
     * |
     * V
     * if(a === 0){
     *    this.a = 5;
     * }
     */
    expandExpressionStatement () {
        // global.log('展开ExpressionStatement表达式')
        return {
            ExpressionStatement (path) {
                var exp = path.node.expression
                if (exp) {
                    //判断是否为多行
                    if (t.isLogicalExpression(exp)) {
                        var operator = exp.operator
                        if (operator === "&&") {
                            //示例代码：a === 0 && this.a = 5;
                            var consequentBlockStatement = exp.left
                            var alternateBlockStatement = t.blockStatement([t.expressionStatement(exp.right)], [])
                            var ifStatement = t.ifStatement(consequentBlockStatement, alternateBlockStatement)

                            try {
                                path.replaceWith(ifStatement)
                            } catch (error) {
                                global.log('%c [ error ]: ', 'color: #bf2c9f; background: pink; font-size: 13px;', error)
                            }

                        } else if (operator === "||") {
                            //TODO:好像不需要转换！！！！！
                        }
                    }
                }
            }
        }
    },


    /**
     * 优化if判断
     * if (1 == a.is_open_sku) o=4; else o=5;
     * |
     * |
     * V
     * if (1 == a.is_open_sku) { o=4; else o=5; }
     */
    optimizeIfStatement () {
        // global.log('优化if判断')
        return {
            //遍历顺序，先大后小
            IfStatement (path) {
                /**
                 * 改成多行展示
                 * if (1 == a.is_open_sku) o=4; else o=5;
                 * if (1 == a.is_open_sku) { o=4; else o=5; }
                 */
                let consequent = path.node.consequent
                let alternate = path.node.alternate

                //如果是多重if，则不会展开,如：
                // if (options.xyname == '发布相关条款') {
                // } else if (options.xyname == '用户登录协议') {
                // } else if (options.xyname == '保证金协议') {
                // }
                if (!t.isIfStatement(alternate)) {
                    if (alternate) {
                        if (!t.isBlockStatement(consequent)) {
                            path.node.consequent = t.blockStatement([consequent])
                        }

                        if (!t.isBlockStatement(alternate)) {
                            path.node.alternate = t.blockStatement([alternate])
                        }
                    } else {
                        //没有else
                        //consequent &&
                        if (!t.isBlockStatement(consequent)) {
                            try {
                                path.node.consequent = t.blockStatement([consequent])
                            } catch (error) {
                                global.log("xx////////////////////////////////////////////xxxxx")
                            }
                        }
                    }
                }
            },
        }
    },

    // 示例:
    // _defineProperty({
    //     info1: [],
    //     member_info: {
    //       username: "",
    //       member_id: 1,
    //       is_pingtai: 0,
    //       avatar: "../../images/head-bitmap.png"
    //     }
    //   }, "info", {
    //     total_money: 0,
    //     share_name: "无"
    //   });
    // 注:_defineProperty 可能是其他名称

    /**
     * defineProperty函数转换
     */
    transformDefineProperty () {
        return {
            CallExpression (path) {
                var args = path.get('arguments')
                if (args.length === 3) {
                    const [obj, key, value] = path.get('arguments')
                    if (key.node.type === "StringLiteral" && t.isObjectExpression(obj) && t.isObjectExpression(value)) {
                        obj.node.properties.push({
                            type: "ObjectProperty",
                            key: key.node,
                            value: value.node,
                        })
                        path.replaceWith(obj)
                    }
                }
            }
        }
    },
    /**
     * defineProperty函数转换 plus版, 示例见下方
     */
    transformDefinePropertyPlus () {
        return {
            SequenceExpression (path, state) {
                let expressions = path.get("expressions")
                if (expressions.length >= 2) {
                    let firstNode = expressions[0]
                    let lastNode = expressions[expressions.length - 1]

                    if (t.isAssignmentExpression(firstNode)
                        && t.isObjectExpression(firstNode.node.right)
                        && t.isIdentifier(lastNode)
                        && t.isObjectProperty(path.parentPath)
                    ) {
                        let varName = lastNode.node.name
                        if (firstNode.node.left.name === lastNode.node.name) {

                            //这里取properties不能用get函数, 即无须带原有作用域
                            let properties = firstNode.node.right.properties
                            let objExp = t.objectExpression(properties)

                            //遍历第二个至倒数第二个
                            for (let i = 1;i < expressions.length - 1;i++) {
                                var obj = callExpressionToObjectProperty(expressions[i], varName)
                                objExp.properties.push(obj)
                            }

                            let newParentPath = t.objectProperty(path.parentPath.node.key, objExp)
                            path.parentPath.replaceWith(newParentPath)
                        }
                    }
                }
            }
        }
    },
}

// 示例代码
// Component({
//     methods: ((t = {
//             toMyGroups: function () {
//                 wx.navigateTo({
//                     url: "/packageB/member/group/MyGroups/MyGroups"
//                 })
//             },
//             childAdressPost: function (t) {
//                 this.setData({
//                     AdressState: t
//                 })
//             },
//         }),
//         o(t, "closeShopList", function () {
//             this.setData({
//                 supplierListShow: !1
//             })
//         }),
//         o(t, "checkSet", function (t) {
//             var e = this,
//                 o = this,
//                 a = this.data.timestamp
//         }),
//     t)
// })

// o(t, "checkSet", function (t) {
//     var e = this,
//         o = this,
//         a = this.data.timestamp
// }),
/**
 * 转换上面这种函数为ObjectProperty结构, 即key:value形式
 * @param {*} path
 * @param {*} varName 即第一个参数的名称
 * @returns
 */
function callExpressionToObjectProperty (path, varName) {
    var res = null
    if (t.isCallExpression(path)) {
        var args = path.get('arguments')
        if (args.length === 3) {
            const [objNode, key, value] = args
            if (objNode.node.name === varName && key.node.type === "StringLiteral") {
                res = t.objectProperty(key.node, value.node)
            }
        }
    }
    return res
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

module.exports = {
    visitorar
}

