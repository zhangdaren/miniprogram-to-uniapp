const chalk = require('chalk');

function log(msg, type = 'error') {
    if (type === 'error') {
        return console.log(chalk.red(`[wx-to-uni-app]: ${msg}`));
    }
    console.log(chalk.green(msg));
};

//判断是否为url
function isURL(str_url) {
    var reg = /^((https|http|ftp|rtsp|mms)?:\/\/)?(([0-9a-z_!~*'().&amp;=+$%-]+: )?[0-9a-z_!~*'().&amp;=+$%-]+@)?((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5]$)|([0-9a-z_!~*'()-]+\.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\.[a-z]{2,6})(:[0-9]{1,4})?((\/?)|(\/[0-9a-zA-Z_!~*'().;?:@&amp;=+$,%#-]+)+\/?)$/;
    if (reg.test(str_url)) {
        return (true);
    } else {
        return (false);
    }
};


/**
 * 驼峰式转下横线
 * console.log(toLowerLine("TestToLowerLine"));  //test_to_lower_line
 * @param {*} str 
 */
function toLowerLine(str) {
    var temp = str.replace(/[A-Z]/g, function (match) {
        return "_" + match.toLowerCase();
    });
    if (temp.slice(0, 1) === '_') { //如果首字母是大写，执行replace时会多一个_，这里需要去掉
        temp = temp.slice(1);
    }
    return temp;
};

/** 
 * 下横线转驼峰式
 * console.log(toCamel('test_to_camel')); //testToCamel
 * @param {*} str 
 */
function toCamel(str) {
    return str.replace(/([^_])(?:_+([^_]))/g, function ($0, $1, $2) {
        return $1 + $2.toUpperCase();
    });
}
/** 
 * 中划线转驼峰式
 * console.log(toCamel('test-to-camel')); //testToCamel
 * @param {*} str 
 */
function toCamel2(str) {
    return str.replace(/([^-])(?:-+([^-]))/g, function ($0, $1, $2) {
        return $1 + $2.toUpperCase();
    });
}

module.exports = {
    log,
    isURL,
    toLowerLine,
    toCamel,
    toCamel2
}