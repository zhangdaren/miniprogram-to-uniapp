// const Parser = require('./Parser') //基类
const htmlparser = require('htmlparser2')   //html的AST类库
/**
 * @description: Template 解析类
 * @param {type} 
 * @return: 
 */
class TemplateParser {
  constructor(){
  }
  /**
   * Template文本转AST方法
   * @param {String} templateText 需要解析的Template文本
   * @returns {Promise}
   */
  parse(templateText){
    return new Promise((resolve, reject) => {
      //先初始化一个domHandler
      const handler = new htmlparser.DomHandler((error, dom)=>{
        if (error) {
          reject(error);
        } else {
          //在回调里拿到AST对象  
          resolve(dom);
        }
      });
      //再初始化一个解析器
      const parser = new htmlparser.Parser(handler);
      //再通过write方法进行解析
      parser.write(templateText);
      parser.end();
    });
  }
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
            str += ` ${attr}="${item.attribs[attr]}"`;
          });
        }
        str += '>';
        if (item.children && item.children.length) {
          str += this.astToString(item.children);
        }
        str += `</${item.name}>`;
      }
    });
    return str;
  }
}

module.exports = TemplateParser
