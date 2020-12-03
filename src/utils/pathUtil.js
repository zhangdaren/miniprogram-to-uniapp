const fs = require('fs');
const path = require('path');
const nodeUtil = require('util');
const utils = require('./utils');

/**
 * 复制文件
 * @param {*} srcPath  源文件
 * @param {*} tarPath  目标文件
 * @param {*} cb      回调函数
 */
var copyFile = function (srcPath, tarPath, cb) {
    var rs = fs.createReadStream(srcPath);
    rs.on('error', function (err) {
        if (err) {
            utils.log('read error', srcPath);
        }
        cb && cb(err);
    });

    var ws = fs.createWriteStream(tarPath);
    ws.on('error', function (err) {
        if (err) {
            utils.log('write error', tarPath);
        }
        cb && cb(err);
    });
    ws.on('close', function (ex) {
        cb && cb(ex);
    });

    rs.pipe(ws);
};

/**
 * 复制目录
 * @param {*} srcDir  源目录
 * @param {*} tarDir  目标目录
 * @param {*} cb      回调函数
 */
var copyFolder = function (srcDir, tarDir, cb) {
    fs.readdir(srcDir, function (err, files) {
        var count = 0;
        var checkEnd = function () {
            ++count == files.length && cb && cb();
        };

        if (err) {
            checkEnd();
            return;
        }

        files.forEach(function (file) {
            var srcPath = path.join(srcDir, file);
            var tarPath = path.join(tarDir, file);

            fs.stat(srcPath, function (err, stats) {
                if (stats.isDirectory()) {
                    utils.log('mkdir', tarPath);
                    fs.mkdir(tarPath, function (err) {
                        if (err) {
                            utils.log(err);
                            // return;  //创建目录报错也应复制
                        }

                        copyFolder(srcPath, tarPath, checkEnd);
                    });
                } else {
                    copyFile(srcPath, tarPath, checkEnd);
                }
            });
        });

        //为空时直接回调
        files.length === 0 && cb && cb();
    });
};

/**
 * 删除文件夹
 * @param {*} path  文件夹路径
 */
function delDir(path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + '/' + file;
            if (fs.statSync(curPath).isDirectory()) {
                delDir(curPath); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });
        fs.rmdirSync(path);
    } else {
    }
}

/**
 * 清空目录，支持忽略指定目录或文件名，只处理一级目录，忽略子目录
 * @param {*} path   要搜索的目录
 * @param {*} ignore 忽略的目录名或文件名，支持正则表达式
 */
function emptyDirSyncEx(folder, ignore) {
    if (ignore) {
        if (!nodeUtil.isRegExp(ignore)) {
            ignore = new RegExp(ignore);
        }
    } else {
        ignore = /unpackage|node_modules|\.git/i;
    }
    fs.readdir(folder, function (err, files) {
        files.forEach(function (fileName) {
            var fileDir = path.join(folder, fileName);
            fs.stat(fileDir, function (err, stats) {
                if (stats && stats.isDirectory()) {
                    if (!ignore.test(fileName)) {
                        delDir(fileDir);
                    }
                } else {
                    if (!ignore.test(fileName)) {
                        fs.unlinkSync(fileDir);
                    }
                }
            });
        });
    });
}

/**
 * 获取无后缀名的文件名
 * @param {*} filePath  文件路径
 */
function getFileNameNoExt(filePath) {
    let extname = path.extname(filePath);
    return path.basename(filePath, extname);
}

/**
 * 粗暴获取父级目录的目录名
 * @param {*} filePath  文件路径
 */
function getParentFolderName(filePath) {
    //当前文件上层目录
    let pFolder = path.dirname(filePath);
    //粗暴获取上层目录的名称~~~
    return path.basename(pFolder);
}

/**
 * 同步创建多重目录
 * @param {*} dirname  目录路径
 */
function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) return true;
    if (mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
    }
    return false;
}

/**
 * 同步删除目录下所有文件
 * @param {*} dirname  目录路径
 */
function rmdirsSync(dirname) {
    if (!fs.existsSync(dirname)) return true;
    var files = fs.readdirSync(dirname);
    if (!files) return true;
    files.forEach(function (file, index) {
        var curPath = path.join(dirname, file);
        if (fs.statSync(curPath).isFile()) fs.unlinkSync(curPath);
    });
    return true;
}

/**
 * 判断文件是否包含在指定目录路径下
 * @param {*} folderArr  目录路径数组
 * @param {*} filePath   要查找的文件
 */
function isInFolder(folderArr, filePath) {
    var result = false;
    for (let index = 0; index < folderArr.length; index++) {
        const folder = folderArr[index];
        if (folder && filePath.indexOf(folder) > -1) {
            result = true;
            break;
        }
    }
    return result;
}
/**
 * 路径转换，转换根路径(路径前面为/)和当前路径(无/开头)为相对于当前目录的路径
 * @param {*} filePath  文件相对路径
 * @param {*} root      根目录
 * @param {*} fileDir   当前文件所在目录
 */
function relativePath(filePath, root, fileDir) {
    if (!filePath) return filePath;
    /**
     * cache缓存目的是为了避免node的path处理之后，会默认将相对路径去除，导致后续解析拿到的filePath不正确
     */
    const cache = filePath;

    //判断后缀名长度是否是4位以内
    //排除例外：import {SymbolIterator} from "./methods/symbol.iterator";
    let extname = path.extname(filePath);
    if (extname.length < 6 || extname == ".js") {
        filePath = path.join(
            path.dirname(filePath),
            getFileNameNoExt(filePath)
        ); //去掉扩展名
    }
    if (/^\//.test(filePath)) {
        //如果是以/开头的，表示根目录
        filePath = path.join(root, filePath);
    } else {
        filePath = path.join(fileDir, filePath);
    }

    filePath = path.relative(fileDir, filePath);
    /**
     * 相比原始的全部添加 ./ ，会导致正常的从 node_modules中读取的文件，被改造成从当前目录读取，存在异常
    */
    if (/^[\.\/]/.test(cache)) {
        filePath = './' + filePath;
    }
    return utils.normalizePath(filePath);
}

/**
 * 替换路径为相对于static目录的路径
 * @param {*} filePath  文件的路径，一般为相对路径
 * @param {*} root      根目录
 * @param {*} fileDir   当前文件所在目录
 */
function replaceAssetPath(filePath, root, fileDir) {
    // utils.log(filePath, fileDir);
    if (!filePath || utils.isURL(filePath)) return filePath;
    if (!/^[\.\/]/.test(filePath)) {
        filePath = './' + filePath;
    }
    let absPath = '';
    if (/^\//.test(filePath)) {
        //如果是以/开头的，表示根目录
        absPath = path.join(root, filePath);
    } else {
        absPath = path.join(fileDir, filePath);
    }
    let relPath = utils.normalizePath(path.relative(root, absPath));
    relPath = getAssetsNewPath(relPath, global.targetFolder);
    return utils.normalizePath(relPath);
}

/**
 * 获取类似于小程序配置文件里路径信息，由文件目录+文件名(无后缀名)组成
 * 如：
 * @param {*} filePath  //文件路径
 * @param {*} root      //根目录，默认为miniprogramRoot
 */
function getFileKey(filePath, root) {
    if (!filePath) return '';
    if (!root) root = global.miniprogramRoot;
    let fileFolder = path.dirname(filePath);
    fileFolder = path.relative(root, fileFolder);
    let fileNameNoExt = getFileNameNoExt(filePath);
    let key = path.join(fileFolder, fileNameNoExt);
    return utils.normalizePath(key);
}

/**
 * 从global.assetInfo这个对象里取出与当前路径相似的新路径
 * @param {*} filePath
 */
function getAssetsNewPath(filePath, parentFolder = '') {
    if (!filePath || utils.isURL(filePath)) return filePath;

    let result = utils.normalizePath(filePath);
    for (const key in global.assetInfo) {
        let obj = global.assetInfo[key];
        if (result.indexOf(key) > -1) {
            result = utils.normalizePath(obj.newPath);
        }
    }
    //如果找不到文件：即文件路径不存在时
    if (result === filePath) {
        result = path.join(global.targetFolder, "static", result);
    }
    if (parentFolder) {
        result = path.relative(parentFolder, result);
    } else {
        result = path.relative(global.targetFolder, result);
    }

    if (!/^[\.\/]/.test(result)) {
        result = '/' + result;
    }
    result = utils.normalizePath(result);
    return result;
}

module.exports = {
    copyFile,
    copyFolder,
    getFileNameNoExt,
    delDir,
    mkdirsSync,
    rmdirsSync,
    getParentFolderName,
    isInFolder,
    relativePath,
    emptyDirSyncEx,
    getFileKey,
    getAssetsNewPath,
    replaceAssetPath
};
