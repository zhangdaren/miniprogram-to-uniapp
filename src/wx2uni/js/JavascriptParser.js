// const Parser = require('./Parser')  //基类
const babylon = require('babylon')  //AST解析器
const parse = require('@babel/parser').parse;
const generate = require('@babel/generator').default
const traverse = require('@babel/traverse').default

class JavascriptParser {
  constructor() {
  }

   /**
    * 解析前替换掉无用字符
    * @param {*} code 
    */
  beforeParse(code) {
    // return code.replace(/this\.\$apply\(\);?/gm, '').replace(/import\s+wepy\s+from\s+['"]wepy['"]/gm, '')
    // return code.replace(/const\s+app\s+=\s+getApp\(\)/gm, '');  //保留getApp()
    return code;
  }

   /**
    * 文本内容解析成AST
    * @param {*} scriptText 
    */
  parse(scriptText) {
    return new Promise((resolve, reject) => {
      try {
        const ast = parse(scriptText, {
          sourceType: 'module'
        });
        resolve(ast);

        //使用下面的代码，在遇到解构语法(...)时，会报错，改用babel-parser方案
        // const scriptParsed = babylon.parse(scriptText, {
        //   sourceType: 'module',
        //   plugins: [
        //     // "estree", //这个插件会导致解析的结果发生变化，因此去除，这本来是acron的插件
        //     "jsx",
        //     "flow",
        //     "doExpressions",
        //     "objectRestSpread",
        //     "exportExtensions",
        //     "classProperties",
        //     "decorators",
        //     "asyncGenerators",
        //     "functionBind",
        //     "functionSent",
        //     "throwExpressions",
        //     "templateInvalidEscapes",
        //   ]
        // })
        // resolve(scriptParsed);
      } catch (e) {
        reject(e);
      }
    })
  }

  /**
   * AST树遍历方法
   * @param astObject
   * @returns {*}
   */
  traverse(astObject) {
    return traverse(astObject)
  }

  /**
   * 模板或AST对象转文本方法
   * @param astObject
   * @param code
   * @returns {*}
   */
  generate(astObject, code) {
    const newScript = generate(astObject, {}, code)
    return newScript
  }
}
module.exports = JavascriptParser