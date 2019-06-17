exports.log = function log (msg, type = 'error') {
    if (type === 'error') {
        return console.log(chalk.red(`[vue-to-react]: ${msg}`));
    }
    console.log(chalk.green(msg));
};

