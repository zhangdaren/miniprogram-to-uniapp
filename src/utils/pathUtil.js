var fs = require('fs')
var path = require('path')
/**
 * @description: 拷贝文件
 * @param {type} 
 * @return: 
 */
var copyFile = function(srcPath, tarPath, cb) {
	var rs = fs.createReadStream(srcPath)
	rs.on('error', function(err) {
		if (err) {
			console.log('read error', srcPath)
		}
		cb && cb(err)
	})

	var ws = fs.createWriteStream(tarPath)
	ws.on('error', function(err) {
		if (err) {
			console.log('write error', tarPath)
		}
		cb && cb(err)
	})
	ws.on('close', function(ex) {
		cb && cb(ex)
	})

	rs.pipe(ws)
}

/**
 * @description: 拷贝文件夹
 * @param {type} 
 * @return: 
 */
var copyFolder = function(srcDir, tarDir, cb) {
	fs.readdir(srcDir, function(err, files) {
		var count = 0
		var checkEnd = function() {
			++count == files.length && cb && cb()
		}

		if (err) {
			checkEnd()
			return
		}

		files.forEach(function(file) {
			var srcPath = path.join(srcDir, file)
			var tarPath = path.join(tarDir, file)

			fs.stat(srcPath, function(err, stats) {
				if (stats.isDirectory()) {
					console.log('mkdir', tarPath)
					fs.mkdir(tarPath, function(err) {
						if (err) {
							console.log(err)
							return
						}

						copyFolder(srcPath, tarPath, checkEnd)
					})
				} else {
					copyFile(srcPath, tarPath, checkEnd)
				}
			})
		})

		//为空时直接回调
		files.length === 0 && cb && cb()
	})
}
/**
 * @description: 删除目录
 * @param {type} 
 * @return: 
 */
function delDir(path){
    let files = [];
    if(fs.existsSync(path)){
        files = fs.readdirSync(path);
        files.forEach((file, index) => {
            let curPath = path + "/" + file;
            if(fs.statSync(curPath).isDirectory()){
                delDir(curPath); //递归删除文件夹
            } else {
                fs.unlinkSync(curPath); //删除文件
            }
        });
        fs.rmdirSync(path);
    }else{
	}
}

/**
 * @description: 获取无后缀名的文件名
 * @param {type} 
 * @return: 
 */
function getFileNameNoExt(filePath){
	let extname =  path.extname(filePath);
	return path.basename(filePath, extname);
}

/**
 * @description: 同步创建多重目录
 * @param {type} 
 * @return: 
 */
function mkdirsSync(dirname){
    if(fs.existsSync(dirname))
        return true;
    if(mkdirsSync(path.dirname(dirname))){
        fs.mkdirSync(dirname);
        return true;
    }
    return false;
}

/**
 * @description: 同步删除目录下所有文件
 * @param {type} 
 * @return: 
 */
function rmdirsSync(dirname){
    if(!fs.existsSync(dirname))
        return true;
    var files = fs.readdirSync(dirname);
    if(!files)
        return true;
    files.forEach(function (file, index) {
        var curPath = path.join(dirname, file);
        if (fs.statSync(curPath).isFile())
            fs.unlinkSync(curPath);
    });
    return true;
}

module.exports = {
	copyFile,
	copyFolder,
	getFileNameNoExt,
	delDir,
	mkdirsSync,
	rmdirsSync,
};
