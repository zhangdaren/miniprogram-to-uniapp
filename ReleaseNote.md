<!--
 * @Author: zhang peng
 * @Date: 2021-11-08 18:10:12
 * @LastEditTime: 2021-11-09 14:20:51
 * @LastEditors: zhang peng
 * @Description:
 * @FilePath: \miniprogram-to-uniapp\releaseNote.md
 *
-->

# v2.0.4 (2021-11-09)
1.支持合并css
2.hbx控制台显示进度
3.修复dateTimeArray1[1][dateTime1[1]]直接被声明进变量的bug
    示例："<view wx:else>{{dateTimeArray1[1][dateTime1[1]]}}-{{dateTimeArray1[2][dateTime1[2]]}}-{{dateTimeArray1[3][dateTime1[3]]}}</view>"
4.hidden="true"或hidden="false"直接true/false对调
5.<image :src="'@/static/image' + file+  'png'"></image>所有资源路径，都不使用@符号（会引用不到）
6.文件总数大于3000时，不处理node_modules
7.收集一下wxs的变量 踢出要命名的变量(handler)<script module="handler" lang="wxs" src="./slideview.wxs"></script>
8.增加判断是uniapp发布的小程序，输出报错信息
9.修复template标签里的变量替换时，导致的引号不匹配的问题。
