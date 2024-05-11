const path = require('path');

module.exports = {
    // entry: path.resolve(__dirname, './main.js'),
    mode: 'development',
    // context: path.resolve(__dirname, 'app'),
    output: {
        path: path.resolve(__dirname, '../build/client'),
    },
    resolve: {
        alias: {
            "@qlient": "./"
        }
    }
};