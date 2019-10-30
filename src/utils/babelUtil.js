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
        const object = path.object ? path.object :path.get("object");
        const property = path.property ? path.property :path.get("property");

        const objectNode = object.node ? object.node : object;
        const propertyNode = property.node ? property.node : property;

        if (t.isIdentifier(objectNode, { name: "app" }) || t.isIdentifier(objectNode, { name: "App" })) {
            if (t.isIdentifier(propertyNode, { name: "globalData" })) {
                //app.globalData.xxx = "123";  -->  getApp().globalData.xxx = "123";
                let me = t.MemberExpression(t.callExpression(t.identifier('getApp'), []), propertyNode);
                path.replaceWith(me);
                path.skip();
            } else {
                //app.xxx --> getApp().globalData.xxx
                let getApp = t.callExpression(t.identifier('getApp'), []);
                let me = t.MemberExpression(t.MemberExpression(getApp, t.identifier('globalData')), propertyNode);
                path.replaceWith(me);
                path.skip();
            }
        } else if (t.isIdentifier(objectNode.callee, { name: "getApp" }) && propertyNode.name !== "globalData") {
            //getApp().xxx --> getApp().globalData.xxx
            let getApp = t.callExpression(t.identifier('getApp'), []);
            let me = t.MemberExpression(t.MemberExpression(getApp, t.identifier('globalData')), propertyNode);
            path.replaceWith(me);
            path.skip();
        }
    }
}

/**
 * 给当前行上方添加注释
 * @param {*} path     path
 * @param {*} content  注释内容
 */
function addComment(path, content) {
    let pathLoc;
    let start;
    if (path.node) {
        pathLoc = path.node.loc;
        start = path.node.start;
    } else {
        pathLoc = path.loc;
        start = path.start;
    }

    const locStart = pathLoc.start;
    const locEnd = pathLoc.end;
    const comment = {
        loc: {
            start: {
                line: locStart.line - 1, column: locStart.column - 1
            },
            end: {
                line: locEnd.line - 1
            },
        },
        start: start,
        type: "CommentLine",
        value: content
    };

    if (path.node) {
        if (!path.container.leadingComments) path.container.leadingComments = [];
        path.container.leadingComments.push(comment);
    } else {
        if (!path.leadingComments) path.leadingComments = [];
        path.leadingComments.push(comment);
    }
}

module.exports = {
    globalDataHandle,
    addComment
}