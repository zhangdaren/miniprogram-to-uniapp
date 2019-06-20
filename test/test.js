
const path = require('path');
const transform = require('../src/index');

//转换test-wx-to-uni项目
transform(path.join( __dirname, "./test-wx-to-uni"));
