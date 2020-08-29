// const Parser = require('./Parser') //基类
const htmlparser = require('htmlparser2')   //html的AST类库

//为啥见一些转换器都用这个来转换，而且这个库的star数还是0
// const {
//   Parser,
//   DomHandler
// } = require('stricter-htmlparser2')

class TemplateParser {
  constructor() {
  }

  /**
   * 解析前优化一代码，虽然未必精确。
   * htmlparser2解析这段<view style="width: {{rate}}%;background-image:url(\"{{_app_config.progress}}\")"></view>
   * style的值为："width: {{rate}}%;background-image:url(\"，这里的处理方法是直接优化掉。
   * @param {*} code
   */
  beforeParse (code) {
    return code.replace(/url\(\\?['"][^\+](.*?)\\?[^\+]['"]\)/g, "url($1)")
      .replace(/\s*\|\|\s*00\}\}/g, " || '00'}}")
      .replace(/\s*==\s*00\s*(\}\}|&&)/g, " == '00' $1")
      .replace(/\\['"]/g, "&#39;")  //引号转为单引号
      ;
  }

  /**
   * HTML文本转AST方法
   * @param scriptText
   * @returns {Promise}
   */
  parse (scriptText) {
    const newScriptText = this.beforeParse(scriptText);

    return new Promise((resolve, reject) => {
      //先初始化一个domHandler
      const handler = new htmlparser.DomHandler((error, dom) => {
        if (error) {
          utils.log("parse wxml error: " + error);
          reject(error);
        } else {
          //在回调里拿到AST对象
          resolve(dom);
        }
      });
      //再初始化一个解析器
      const parser = new htmlparser.Parser(handler, {
        xmlMode: true,
        //将所有标签小写，并不需要，设置为false, 如果xmlMode禁用，则默认为true。所以xmlMode为true。
        lowerCaseTags: false,
        //自动识别关闭标签，并关闭，如<image /> ==> <image></image>,不加的话，会解析异常，导致关闭标签会出现在最后面
        recognizeSelfClosing: true,
      });
      //再通过write方法进行解析
      parser.write(newScriptText);
      parser.end();
    });
  }

  // parse(sourceCode) {
  //   //借鉴自：https://github.com/dcloudio/uni-app/blob/v3/packages/uni-migration/lib/mp-weixin/transform/template-transformer/parser.js
  //   对于```<view>{{a<10?'折（客房）':'无折扣'}}<text>{{sale_price}}元</text></view>```仍然解析无力，弃用，仅作参考
  //   return new Promise((resolve, reject) => {
  //     const handler = new DomHandler()
  //     new Parser(handler, {
  //       xmlMode: false,
  //       lowerCaseAttributeNames: false,
  //       recognizeSelfClosing: true,
  //       lowerCaseTags: false
  //     }).end(sourceCode);

  //     const dom = Array.isArray(handler.dom) ? handler.dom : [handler.dom];
  //     resolve(dom);
  //   });
  // }
  /**
   * AST转文本方法
   * @param ast
   * @returns {string}
   */
  astToString (ast) {
    let str = '';
    ast.forEach(item => {
      if (item.type === 'text') {
        str += item.data;
      } else if (item.type === 'tag') {
        str += '<' + item.name;
        if (item.attribs) {
          Object.keys(item.attribs).forEach(attr => {
            let value = item.attribs[attr];
            if (value == "") {
              //需要同时满足；如果attr=data，且没有value时，也删除
              if (attr.indexOf(":") > -1 || attr == "data") {
                //key含冒号且value为空时，直接删除
              } else {
                str += ` ${attr}`;
              }
            } else {
              str += ` ${attr}="${item.attribs[attr]}"`;
            }
          });
        }
        str += '>';
        if (item.children && item.children.length) {
          str += this.astToString(item.children);
        }
        str += `</${item.name}>`;
      } else if (item.type == "comment") {
        str += `<!--${item.data}-->`;
      }
    });
    return str;
  }
}

module.exports = TemplateParser
