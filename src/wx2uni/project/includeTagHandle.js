
const path = require('path');

/**
 * 处理include标签
 */
function includeTagHandle () {
    let pagesData = global.pagesData;
    let includeInfo = global.includeInfo;

    let handleInclude = (key) => {
        const item = includeInfo[key];
        const fileKey = item.curFileKey;
        const includeFileKey = item.includeFileKey;

        if (!item.parsedIncluded && pagesData[fileKey]) {
            let wxml = pagesData[fileKey].data.wxml;
            let minWxml = pagesData[fileKey].data.minWxml;
            if (pagesData[includeFileKey]) {
                let includeWxml = pagesData[includeFileKey].data.minWxml;
                includeWxml = '<block' + item.attrs + '>' + includeWxml + '</block>';
                pagesData[fileKey].data.wxml = wxml.replace(item.includeTag, includeWxml);
                pagesData[fileKey].data.minWxml = minWxml.replace(item.includeTag, includeWxml);
                item.parsedIncluded = true;
            } else {
                // path.relative(global.miniprogramRoot, item.includeWxmlAbsPath)
                let logStr = 'Error: 找不到include所对应的wxml文件-->' + path.relative(global.miniprogramRoot, item.includeWxmlAbsPath) + '   标签：' + item.includeTag
                console.log(logStr);
                global.log.push(logStr);
            }
        }
    }

    // 处理include套娃逻辑
    // 先处理子文件的include
    // 即curFileKey能被includeFileKey搜索到
    let handleChildInclude = (key) => {
        for (const newKey in includeInfo) {
            if (includeInfo[newKey].curFileKey === includeInfo[key].includeFileKey) {
                handleChildInclude(newKey);
            }
        }
        handleInclude(key);
    }

    for (const key in includeInfo) {
        handleChildInclude(key);
    }
}

module.exports = includeTagHandle;