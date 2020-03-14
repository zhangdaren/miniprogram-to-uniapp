const chalk = require('chalk');


function log (msg, type = 'error') {
    if (type === 'error') {
        return console.log(chalk.red(`[wx-to-uni-app]: ${msg}`));
    }
    console.log(msg);
};


//借鉴：https://github.com/dcloudio/uni-app/blob/v3/packages/uni-migration/lib/mp-weixin/util.js
const isWin = /^win/.test(process.platform);
const normalizePath = path => (isWin ? path.replace(/\\/g, '/') : path);


/**
 * 是否为数字
 * @param {*} n 
 */
function isNumber (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


/**
 * 是否为Object
 * @param {*} n 
 */
function isObject (val) {
    return val != null && typeof val === 'object' && Array.isArray(val) === false;
}


/**
 * 判断是否为url
 * @param {*} str_url 网址，支持http及各种协议
 */
function isURL (str_url) {
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
 * 判断当前名字是否为资源目录
 * @param {*} name 
 */
function isAssetsFolderName (name) {
    const reg = /\b(images|img|image|static|asset|assets)\b/i;
    return reg.test(name);
}

/**
 * 驼峰式转下横线
 * console.log(toLowerLine("TestToLowerLine"));  //test_to_lower_line
 * @param {*} str 
 */
function toLowerLine (str) {
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
function toCamel (str) {
    return str.replace(/([^_])(?:_+([^_]))/g, function ($0, $1, $2) {
        return $1 + $2.toUpperCase();
    });
}

/**
 * 驼峰命名转为短横线命名
 */
function getKebabCase (str) {
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
function toCamel2 (str) {
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
function sleep (numberMillis) {
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
function getTemplateParams (str) {
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
function splitStr (str) {
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
function makeMap (
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
 * 是否为javascript保留关键字，不能用作变量或函数名 * 
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
function hasReserverdPorps (params) {
    return /\b(data)\b/.test(params) || /\b(id)\b/.test(params) || /\b(default)\b/.test(params);
}



//是否为vue内置关键字或方法
// "_init"
function isVueMethod (tag) {
    return /^_|^\$/.test(tag);
}

/**
 * 判断tag是否为预置的名字
 * @param {*} tag 
 */
function isReservedTag (tag) {
    return isHTMLTag(tag) || isSVG(tag) || isUniAppTag(tag) || isVueMethod(tag);
};

/**
 * 获取组件别名
 */
function getComponentAlias (name) {
    return isReservedTag(name) ? (name + "-diy") : name;
}

/**
 * 判断name是否为预置的名字    
 * @param {*} tag 
 */
function isReservedName (name) {
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
function isReservedAttrName (name) {
    if (!name) return name;
    const reg = /:/;
    var newName = name.replace(reg, "");
    return (reg.test(name) && (isReservedAttr(newName)));
}


/**
 * 获取属性别名   
 * 目前v-bind:id不能作为属性名（data例外，可以传进去，id确实不能传入20200107）
 * @param {*} key     key name 
 * @param {*} value   value name ,判断是否为绑定了数据
 */
function getAttrAlias (key, value) {
    var result = key;
    if (value) {
        let reg_tag = /{{.*?}}/;
        if ((reg_tag.test(value) && isReservedAttr(key))) {
            result += "Attr";
        }
    } else {
        if (isReservedAttr(key)) {
            result += "Attr";
        }
    }
    return result;
}
/**
 * 获取props别名   
 * 目前已知v-bind:id不能作为参数名（data例外，可以传进去，id确实不能传入20200107）
 */
function getPropsAlias (name) {
    var result = name;
    if (isJavascriptKeyWord(name) || isReservedAttr(name)) {
        result += "Attr";
    }
    return result;
}

/**
 * 获取函数别名
 * 1.函数名为js系统关键字，返回name + "Fun" 形式
 * 2.以_开头的函数名，返回"re" + name形式
 */
function getFunctionAlias (name) {
    if (!name) return name;
    var rusult = name;

    if (isVueMethod(name)) {
        rusult = name.replace(/^_|^\$/g, "") + "Fun";
    } else {
        rusult = name + "Fun";
    }
    return rusult;
}

/**
 * 解析 key:value形式的字符串，如"abc:"xx""解析为{abc:"xxx"}
 * @param {*} str 
 */
function stringToObject (str) {
    let index = str.indexOf(":");
    let key = str.substring(0, index).trim();
    let value = str.substring(index + 1).trim();
    let result = {};
    if (key !== value) result[key] = value;
    return result;
}

//测试样例：后面再补上。
// "item.type",
// "...bbgRuleDialog",
// "item,dataType",
// "setting:setting",
// "title:'open/get/Setting'",
// "diyform:order",
// "listName:list,ImgRoot:imgroot",
// "type:isShowPH?'ph':'list',infos:item",
// "type:isShowPH?'ph':'list',infos:item?1:2,index:111,ac:'ccc'",
// "type:'detail',isEnd:false,time:[day,hour,minute,seconds],infos:infos",
// "...kaipinglist,className:'ad-content',canIUse:canIUse",
// "leftIndex:index+1,section3Title:item.title",
// "...stdInfo[index],...{index:index,name:item.name}"

/**
 * 解析template标签的data参数，将返回需要进行替换的参数   
 * 如{setting:setting}，那就不需要替换
 * 如{"title:'open/get/Setting'"}，那就视为需要替换
 * @param {*} attr 
 */
function parseTemplateAttrParams (attr) {
    let str = attr.replace(/{{\s*(.*?)\s*}}/, '$1');
    //先去掉...[]和...{}
    str = str.replace(/\.\.\.{.*?}|\.\.\.\[.*?\],?/g, "");
    str = str.replace(/\.\.\..*?,/g, "");
    //正则
    let reg1 = /(\w+:\[.*?\]),?/g;  //解析数组
    let reg2 = /(\w+:\{.*?\}),?/g;  //解析对象
    let reg3 = /(\w+:.*?),|(\w+:.*?)$/g;  //解析key:value

    let result = {};

    //解析数组的(带中括号的)
    str = str.replace(reg1, function (match, $1) {
        result = { ...result, ...stringToObject($1) };
        return "";
    });
    //解析对象的(带花括号的)
    str = str.replace(reg2, function (match, $1) {
        result = { ...result, ...stringToObject($1) };
        return "";
    });
    //解析key:value
    str.replace(reg3, function (match, $1, $2) {
        let tmpStr = $1 || $2;
        result = { ...result, ...stringToObject(tmpStr) };
    });
    return result;
}

/**
 * 判断关键字是否与vant有关
 */
function isVant (name) {
    return /vant-weapp|vant|van/.test(name);
}

/**
 * vant组件路径
 */
const vantComponentList = {
    "van-action-sheet": "./wxcomponents/vant/action-sheet/index",
    "van-area": "./wxcomponents/vant/area/index",
    "van-button": "./wxcomponents/vant/button/index",
    "van-card": "./wxcomponents/vant/card/index",
    "van-cell": "./wxcomponents/vant/cell/index",
    "van-cell-group": "./wxcomponents/vant/cell-group/index",
    "van-checkbox": "./wxcomponents/vant/checkbox/index",
    "van-checkbox-group": "./wxcomponents/vant/checkbox-group/index",
    "van-col": "./wxcomponents/vant/col/index",
    "van-count-down": "./wxcomponents/vant/count-down/index",
    "van-dialog": "./wxcomponents/vant/dialog/index",
    "van-divider": "./wxcomponents/vant/divider/index",
    "van-field": "./wxcomponents/vant/field/index",
    "van-goods-action": "./wxcomponents/vant/goods-action/index",
    "van-goods-action-icon": "./wxcomponents/vant/goods-action-icon/index",
    "van-goods-action-button": "./wxcomponents/vant/goods-action-button/index",
    "van-icon": "./wxcomponents/vant/icon/index",
    "van-image": "./wxcomponents/vant/image/index",
    "van-loading": "./wxcomponents/vant/loading/index",
    "van-nav-bar": "./wxcomponents/vant/nav-bar/index",
    "van-notice-bar": "./wxcomponents/vant/notice-bar/index",
    "van-notify": "./wxcomponents/vant/notify/index",
    "van-panel": "./wxcomponents/vant/panel/index",
    "van-popup": "./wxcomponents/vant/popup/index",
    "van-progress": "./wxcomponents/vant/progress/index",
    "van-radio": "./wxcomponents/vant/radio/index",
    "van-radio-group": "./wxcomponents/vant/radio-group/index",
    "van-row": "./wxcomponents/vant/row/index",
    "van-search": "./wxcomponents/vant/search/index",
    "van-sidebar": "./wxcomponents/vant/sidebar/index",
    "van-sidebar-item": "./wxcomponents/vant/sidebar-item/index",
    "van-slider": "./wxcomponents/vant/slider/index",
    "van-stepper": "./wxcomponents/vant/stepper/index",
    "van-steps": "./wxcomponents/vant/steps/index",
    "van-sticky": "./wxcomponents/vant/sticky/index",
    "van-submit-bar": "./wxcomponents/vant/submit-bar/index",
    "van-swipe-cell": "./wxcomponents/vant/swipe-cell/index",
    "van-uploader": "./wxcomponents/vant/uploader/index",
    "van-switch": "./wxcomponents/vant/switch/index",
    "van-tab": "./wxcomponents/vant/tab/index",
    "van-tabs": "./wxcomponents/vant/tabs/index",
    "van-tabbar": "./wxcomponents/vant/tabbar/index",
    "van-tabbar-item": "./wxcomponents/vant/tabbar-item/index",
    "van-tag": "./wxcomponents/vant/tag/index",
    "van-toast": "./wxcomponents/vant/toast/index",
    "van-transition": "./wxcomponents/vant/transition/index",
    "van-tree-select": "./wxcomponents/vant/tree-select/index",
    "van-datetime-picker": "./wxcomponents/vant/datetime-picker/index",
    "van-rate": "./wxcomponents/vant/rate/index",
    "van-collapse": "./wxcomponents/vant/collapse/index",
    "van-collapse-item": "./wxcomponents/vant/collapse-item/index",
    "van-picker": "./wxcomponents/vant/picker/index",
    "van-overlay": "./wxcomponents/vant/overlay/index",
    "van-circle": "./wxcomponents/vant/circle/index",
    "van-index-bar": "./wxcomponents/vant/index-bar/index",
    "van-index-anchor": "./wxcomponents/vant/index-anchor/index",
    "van-grid": "./wxcomponents/vant/grid/index",
    "van-grid-item": "./wxcomponents/vant/grid-item/index",
    "van-dropdown-menu": "./wxcomponents/vant/dropdown-menu/index",
    "van-dropdown-item": "./wxcomponents/vant/dropdown-item/index",
    "van-skeleton": "./wxcomponents/vant/skeleton/index"
};

/**
 * 如果字符串里只有一个单引号时，删除它
 */
function removeSingleQuote (value) {
    //如果只有一个单引号，就将它干掉
    let re = value.match(/&#39;/g) || [];
    if (re.length === 1) {
        value = value.replace(/&#39;/, "");
    }

    return value;
}

module.exports = {
    log,
    isNumber,
    isObject,
    isAssetsFolderName,
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

    removeSingleQuote,

    ///
    stringToObject,
    parseTemplateAttrParams,
    isVant,
    vantComponentList,

}