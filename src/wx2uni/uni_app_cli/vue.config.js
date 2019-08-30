const path = require('path')
const isWin = /^win/.test(process.platform)
const normalizePath = path => (isWin ? path.replace(/\\/g, '/') : path)
process.env.UNI_INPUT_DIR = path.join(__dirname, './src')
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
	configureWebpack: {
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
				'assets': path.resolve(__dirname, './src/static')
			}
		},
		plugins: [
			new CopyWebpackPlugin([
				<%= COPY_WEBPACK_PLUGIN %>
			]),
		]
	},
	css: {
		loaderOptions: {
			sass: {
				data: `@import "${normalizePath(path.resolve(__dirname, './uni.scss'))}";`
			}
		}
	}
}
