# 关于安装使用时的疑难杂症   


## 安装时，一直停留在fetchMetadata: sill……
安装npm install时，长时间停留在fetchMetadata: sill mapToRegistry uri   

你可以首先检查一下你的源是不是淘宝的镜像源   

```npm config get registry```

如果不是的，更换成淘宝的源，执行下面的命令：  

```npm config set registry https://registry.npm.taobao.org```

配置后再通过下面方式来验证是否成功   

```npm config get registry```

这样还不行的话 用cnpm   

```npm install -g cnpm --registry=http://registry.npm.taobao.org```

安装完后，cnpm install   

这两个原理实际上是一样的   


## 无法加载文件 XXXXXXXXX.ps1，因为在此系统上禁止运行脚本。
以管理员身份运行powershell   

执行   
```set-executionpolicy remotesigned```

输入y即可   

[Y] 是(Y)  [N] 否(N)  [S] 挂起(S)  [?] 帮助 (默认值为“Y”)    


## 运行wtu -V报错   
$ wtu -v   
/usr/local/lib/node_modules/miniprogram-to-uniapp/src/index.js:297   
async function filesHandle(fileData, miniprogramRoot) {   
^^^^^^^^   
SyntaxError: Unexpected token function   
......   
原因：当前nodejs版本不支持es6语法   
解决：升级nodejs版本，建议v9以上   