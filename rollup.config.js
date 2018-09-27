const rollup = require('rollup');
const path = require('path');

console.log(path.resolve(__dirname, './src/index.js'));

const watchOptions = {
    input: path.resolve(__dirname, './src/index.js'),
    output: {
        file: path.resolve(__dirname, './dist/skk-vnode.js'),
        format: 'iife',
        name: 'skkVnode'
    }
};

const watcher = rollup.watch(watchOptions);

watcher.on('event', e => {
    if (e.code === 'ERROR' || e.code === 'FATAL') {
        console.log(e.error);
        watcher.close();
    } else if (e.code === 'END') {
        console.log('Build file end');
    }
})
