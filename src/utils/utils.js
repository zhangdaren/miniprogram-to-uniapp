const chalk = require('chalk');


function log(msg, type = 'error') {
    if (type === 'error') {
        return console.log(chalk.red(`[wx-to-uni-app]: ${msg}`));
    }
    console.log(chalk.green(msg));
};


//借鉴：https://github.com/dcloudio/uni-app/blob/v3/packages/uni-migration/lib/mp-weixin/util.js
const isWin = /^win/.test(process.platform);
const normalizePath = path => (isWin ? path.replace(/\\/g, '/') : path);


/**
 * 是否为数字
 * @param {*} n 
 */
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

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
 * 驼峰命名转为短横线命名
 */
function getKebabCase(str) {
    return str.replace(/[A-Z]/g, function (i) {
        return '-' + i.toLowerCase();
    })
}

/** 
 * 中划线转驼峰式   
 * console.log(toCamel('test-to-camel')); //testToCamel   
 * console.log(toCamel('diy-imageSingle')); //diyImageSingle   
 * @param {*} str 
 */
function toCamel2(str) {
    let ret = getKebabCase(str).toLowerCase();
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
 * 提取template里参数里所包含的变量   
 * 如下，仅试举几例：   
 * {{styleS==1}}  -->  {"styleS":true}   
 * {{ item.is_buy ? '砍价成功' : '已结束' }}  -->  {"item.is_buy":true}   
 * "swiper-tab-item {{options.scoreType == -1 ? 'on' : ''}}"  -->  {"options.scoreType":true}   
 * 例外：   
 * {{abc.styleS['a.b.c']==3}}  //'a.b.c'这种暂时处理不到   
 * @param {*} str 
 */
function getTemplateParams(str) {
    let reg_tag = /{{.*?}}/;
    var result = {};
    if (reg_tag.test(str)) {
        str = str.replace(/url\(['"]{{(.*?)}}['"]\)/g, "url({{$1}})").replace(/['"]{{(.*?)}}['"]/g, "{{$1}}");
        str.replace(/{{(.*?)}}/g, function (match, $1) {
            var obj = splitStr($1);
            result = {
                ...result,
                ...obj
            };
        });
    }
    return result;
}

/**
 * 切割字符串，提取str里符合“变量”特征的字符串，并返回object   
 * 与getTemplateParams配合使用
 * @param {*} str 
 */
function splitStr(str) {
    //可能在引号对里面有这些切割标记，这里当场干掉
    var newStr = str.replace(/\s|['"].*?['"]|,.*?:/g, "");
    //去掉引号
    newStr = newStr.replace(/\(|\)|{|}|\[|\]/g, ":");
    //切割
    var arr = newStr.trim().split(/\.\.\.|===|!==|==|\&\&|\|\||\?|:|<|>|\(|\)|\*|\/|\+|\-|!|<=|>=|%|,/);
    var result = {};
    //去重， 去.length
    arr.forEach(function (item, i) {
        if (item && !isNumber(item)) {
            result[item] = true;
        }
    })
    return result;
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
    "trisition-group,trisition,web"
)

/**
 * 是否为javascript保留关键字，不能用作变量或函数名
 * // 方法和绑定 的值 名都不能为这些
 * 加上_开头的方法
 * 加上id data作为的属性名
 * 
 */
var isJavascriptKeyWord = makeMap(
    "abstract,arguments,boolean,break,byte," +
    "case,catch,char,class,const," +
    "continue,debugger,default,delete,do," +
    "double,else,enum,eval,export," +
    "extends,false,final,finally,float," +
    "for,function,goto,if,implements," +
    "import,in,instanceof,int,interface," +
    "let,long,native,new,null," +
    "package,private,protected,public,return," +
    "short,static,super,switch,synchronized," +
    "this,throw,throws,transient,true," +
    "try,typeof,var,void,volatile," +
    "while,with,yield"
);



/**
 * 判断指定参数是否含有特定关键字，比如id、data和default等
 * @param {*} params 
 */
function hasReserverdPorps(params) {
    return /\b(data|id|default)\b/.test(params);
}



//是否为vue内置关键字或方法
// "_init"
function isVueMethod(tag) {
    return /[(^_)(^$)]/.test(tag);
}

/**
 * 判断tag是否为预置的名字
 * @param {*} tag 
 */
function isReservedTag(tag) {
    return isHTMLTag(tag) || isSVG(tag) || isUniAppTag(tag) || isVueMethod(tag);
};

/**
 * 获取组件别名
 */
function getComponentAlias(name) {
    return isReservedTag(name) ? (name + "-diy") : name;
}

/**
 * 判断name是否为预置的名字    
 * @param {*} tag 
 */
function isReservedName(name) {
    return isJavascriptKeyWord(name) || isVueMethod(name);
};


/**
 * 是否为属性关键字，目前已知data、v-bind:data和v-bind:id不能作为属性名
 */
var isReservedAttr = makeMap(
    "id"
);


/**
 * 判断标签属性name是否为预置的名字
 * @param {*} name 
 */
function isReservedAttrName(name) {
    if (!name) return name;
    const reg = /:/;
    var newName = name.replace(reg, "");
    return (reg.test(name) && (isReservedAttr(newName)) || newName === "data");
};


/**
 * 获取属性别名   
 * 目前已知data、v-bind:data和v-bind:id不能作为属性名
 */
function getAttrAlias(name) {
    var result = name;
    if (isReservedAttr(name) || name === "data") {
        result += "Attr";
    }
    return result;
}
/**
 * 获取props别名   
 * 目前已知data、v-bind:data和v-bind:id不能作为参数名
 */
function getPropsAlias(name) {
    var result = name;
    if (isJavascriptKeyWord(name) || isReservedAttr(name) || name === "data") {
        result += "Attr";
    }
    return result;
}

/**
 * 获取变量/函数别名
 * 1.变量或函数名为js系统关键字，返回name + "Fun" 形式
 * 2.以_开头的变量或函数名，返回"re" + name形式
 */
function getFunctionAlias(name) {
    if (!name) return name;
    var rusult = name;
    if (isJavascriptKeyWord(name)) {
        rusult = name + "Fun";
    } else if (isVueMethod(name)) {
        rusult = name.replace(/_|\$/g, "") + "Fun";
    }
    return rusult;
}


module.exports = {
    log,
    normalizePath,
    isURL,
    toLowerLine,
    toCamel,
    toCamel2,
    sleep,
    isReservedTag,
    getFunctionAlias,
    getComponentAlias,
    isJavascriptKeyWord,
    isReservedName,

    getAttrAlias,
    isReservedAttrName,
    getPropsAlias,
    getTemplateParams,
    hasReserverdPorps,
}