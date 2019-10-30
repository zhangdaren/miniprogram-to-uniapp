// const Parser = require('./Parser') //基类
const htmlparser = require('htmlparser2')   //html的AST类库
class TemplateParser {
  constructor() {
  }

  /**
   * 解析前优化一代码，虽然未必精确。
   * //htmlparser2解析这段<view style="width: {{rate}}%;background-image:url(\"{{_app_config.progress}}\")"></view>
   * //style的值为："width: {{rate}}%;background-image:url(\"，这里的处理方法是直接优化掉。
   * @param {*} code 
   */
  beforeParse(code) {
    return code.replace(/url\(\\?['"]{{(.*?)}}\\?['"]\)/g, "url({{$1}})");
  }

  /**
   * HTML文本转AST方法
   * @param scriptText
   * @returns {Promise}
   */
  parse(scriptText) {
    const newScriptText = this.beforeParse(scriptText);

    return new Promise((resolve, reject) => {
      //先初始化一个domHandler
      const handler = new htmlparser.DomHandler((error, dom) => {
        if (error) {
          console.log("parse wxml error: " + error);
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
  /**
   * AST转文本方法
   * @param ast
   * @returns {string}
   */
  astToString(ast) {
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
