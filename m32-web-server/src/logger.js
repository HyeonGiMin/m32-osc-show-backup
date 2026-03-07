const logStore = require('./logStore');

const isDev = process.env.NODE_ENV !== 'production';

const COLORS = {
    debug: '\x1b[36m',
    info:  '\x1b[32m',
    warn:  '\x1b[33m',
    error: '\x1b[31m',
    reset: '\x1b[0m',
};

function log(level, dataOrMsg, msg) {
    const timestamp = new Date().toISOString();
    const isObj = dataOrMsg !== null && typeof dataOrMsg === 'object';
    const message = isObj ? (msg || '') : String(dataOrMsg);
    const extra = isObj ? dataOrMsg : undefined;

    const entry = { time: timestamp, level, msg: message };
    if (extra) Object.assign(entry, extra);

    logStore.addEntry(entry);

    if (isDev) {
        const c = COLORS[level] || '';
        const r = COLORS.reset;
        const ts = timestamp.replace('T', ' ').slice(0, 19);
        const extraStr = extra ? ' ' + JSON.stringify(extra) : '';
        console.log(`${ts} ${c}${level.toUpperCase().padEnd(5)}${r} ${message}${extraStr}`);
    } else {
        process.stdout.write(JSON.stringify(entry) + '\n');
    }
}

module.exports = {
    debug: (d, m) => log('debug', d, m),
    info:  (d, m) => log('info',  d, m),
    warn:  (d, m) => log('warn',  d, m),
    error: (d, m) => log('error', d, m),
};
