const t = require('@babel/types');

/**
 * 替换globalData
 * 1. app.globalData.xxx = "123";  -->  getApp().globalData.xxx = "123";
 * 2. app.xxx --> getApp().globalData.xxx
 * 
 * @param {*} path 
 */
function globalDataHandle(path) {
    if (t.isMemberExpression(path)) {
        let object = path.get('object');
        let property = path.get('property');
        if (t.isIdentifier(object.node, { name: "app" })) {
            if (t.isIdentifier(property.node, { name: "globalData" })) {
                //app.globalData.xxx = "123";  -->  getApp().globalData.xxx = "123";
                let me = t.MemberExpression(t.callExpression(t.identifier('getApp'), []), property.node);
                path.replaceWith(me);
                path.skip();
            } else {
                //app.xxx --> getApp().globalData.xxx
                let getApp = t.callExpression(t.identifier('getApp'), []);
                let me = t.MemberExpression(t.MemberExpression(getApp, t.identifier('globalData')), property.node);
                path.replaceWith(me);
                path.skip();
            }
        }
    }
}



module.exports = {
    globalDataHandle,

}