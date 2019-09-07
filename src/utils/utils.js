const chalk = require('chalk');
const Stack = require('./stack');

function log(msg, type = 'error') {
    if (type === 'error') {
        return console.log(chalk.red(`[wx-to-uni-app]: ${msg}`));
    }
    console.log(chalk.green(msg));
};


/**
 * 判断是否为url
 * @param {*} str_url 网址，支持http及各种协议
 */
function isURL(str_url) {
    //TODO: 似乎//www.baidu.com/xx.png 不能通过校验？
    var reg = /^((https|http|ftp|rtsp|mms)?:\/\/)?(([0-9a-z_!~*'().&amp;=+$%-]+: )?[0-9a-z_!~*'().&amp;=+$%-]+@)?((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5]$)|([0-9a-z_!~*'()-]+\.)*([0-9a-z][0-9a-z-]{0,61})?[0-9a-z]\.[a-z]{2,6})(:[0-9]{1,4})?((\/?)|(\/[0-9a-zA-Z_!~*'().;?:@&amp;=+$,%#-]+)+\/?)$/;
    if (reg.test(str_url)) {
        return (true);
    } else {
        //有些可能就是//开头的地址
        let reg2 = /\/\//;
        if (reg2.test(str_url)) {
            return (true);
        } else {
            return (false);
        }
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
    let ret = str.toLowerCase();
    ret = ret.replace(/[-]([\w+])/g, function (all, letter) {
        return letter.toUpperCase();
    });
    return ret;
}

/**
 * 暂停
 * @param {*} numberMillis  毫秒
 */
function sleep(numberMillis) {
    var now = new Date();
    var exitTime = now.getTime() + numberMillis;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime)
            return;
    }
}


/**
 * 将object字符串转换Object
 * @param {*} string 
 * 
 * 	var a = "setting:setting,id:\"index\"";
 *  var b = "title";
 * 	var c = "showModal, photoUrl";
 * 	var d = "showModal, photoUrl: '2,2:\"fds\"afds'";
 */
function stringToObject(string) {
    var object = {}; //最后的结果
    var stack = new Stack();
    var hasMark = false; //表明当前字符串是否位于引号里
    var lastKey = ""; //上个key
    for (var i = 0; i < string.length; i++) {
        var item = string[i];
        if (item == ":") {
            if (hasMark) {
                //如果当前位于引号里
                stack.push(item);
                continue;
            }
            //从栈里取出当前的key
            var tmpArr = [];
            while (stack.top()) {
                tmpArr.unshift(stack.pop());
            }
            var key = tmpArr.join('').trim();
            lastKey = key;
            object[key] = "";
        } else if (item == ",") {
            if (hasMark) {
                //如果当前位于引号里
                stack.push(item);
                continue;
            }
            //从栈里取出当前的value
            var tmpArr = [];
            while (stack.top()) {
                tmpArr.unshift(stack.pop());
            }
            var value = tmpArr.join('').trim();
            if (lastKey) {
                //如果上一个字段是key的话
                object[key] = value;
                lastKey = value;
            } else {
                object[value] = value;
            }
        } else if (item == "\"" || item == "'") {
            stack.push(item);
            if (hasMark) {
                hasMark = false;
            } else {
                hasMark = true;
            }
        } else if (item != " ") {
            stack.push(item);
        }
    }
    //循环结束后，栈里面可能还会有字符串
    var tmpArr = [];
    while (!stack.isEmpty()) {
        tmpArr.unshift(stack.pop());
    }
    var key = tmpArr.join('').trim();
    if (lastKey) {
        //如果上一个字段是key的话，那么本个字段就当作value
        object[lastKey] = key;
    } else {
        //如果上一个字段已经匹配完，那么这里就把自身当作key，也作为value
        object[key] = key;
    }
    return object;
}


/**
 * copy to vue.js
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap(
    str,
    expectsLowerCase
) {
    var map = Object.create(null);
    var list = str.split(',');
    for (var i = 0; i < list.length; i++) {
        map[list[i]] = true;
    }
    return expectsLowerCase
        ? function (val) { return map[val.toLowerCase()]; }
        : function (val) { return map[val]; }
}

// 区分大小写
var isHTMLTag = makeMap(
    'html,body,base,head,link,meta,style,title,' +
    'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
    'div,dd,dl,dt,figcaption,figure,hr,img,li,main,ol,p,pre,ul,' +
    'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
    's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
    'embed,object,param,source,canvas,script,noscript,del,ins,' +
    'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
    'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
    'output,progress,select,textarea,' +
    'details,dialog,menu,menuitem,summary,' +
    'content,element,shadow,template'
);

// 不区分大小写
var isSVG = makeMap(
    'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font,' +
    'font-face,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
    'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
    true
);

//是否为uni-app内置关键字，因与上面的有重复，有删减
//参见：https://uniapp.dcloud.io/use?id=%e5%91%bd%e5%90%8d%e9%99%90%e5%88%b6
var isUniAppTag = makeMap(
    "cell,countdown,datepicker," +
    "indicator,list,loading-indicator," +
    "loading,marquee,refresh,richtext,scrollable,scroller," +
    "select,slider-neighbor,slider,slot,spinner," +
    "tabbar,tabheader,timepicker," +
    "trisition-group,trisition,web",
    true
)

/**
 * 判断当前组件名字是否为预置的名字
 * @param {*} tag 
 */
var isReservedTag = function (tag) {
    return isHTMLTag(tag) || isSVG(tag) || isUniAppTag(tag);
};


// 区分大小写
var isBuiltInTag = makeMap('slot,component', true);

/**
 * 获取组件别名
 */
var getComponentAlias = function (name) {
    return isReservedTag(name) ? (name + "-diy") : name;
}


module.exports = {
    log,
    isURL,
    toLowerLine,
    toCamel,
    toCamel2,
    sleep,
    stringToObject,
    isReservedTag,
    getComponentAlias
}