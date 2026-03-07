require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const ConsoleManager = require('./consoleManager');
const Scheduler = require('./scheduler');
const { backupScene, backupShow } = require('./backup');
const logger = require('./logger');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function loadConfig() {
    try {
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        if (process.env.WEB_PORT) config.web.port = parseInt(process.env.WEB_PORT, 10);
        return config;
    } catch (err) {
        console.error('Failed to load config.json:', err.message);
        process.exit(1);
    }
}

async function main() {
    logger.info('=== M32 Web Server starting ===');

    const config = loadConfig();

    const consoleManager = new ConsoleManager(config);
    await consoleManager.init();

    async function performBackup(type, consoleId) {
        const client = consoleManager.getClient(consoleId);
        if (!client) throw new Error(`Console not found: ${consoleId}`);
        if (type === 'scene') return backupScene(client, config, consoleId);
        if (type === 'show')  return backupShow(client, config, consoleId);
        throw new Error(`Unknown backup type: ${type}`);
    }

    const scheduler = new Scheduler(config, performBackup);
    scheduler.start();

    const app = express();
    app.use(express.json());
    app.use(express.static(path.join(__dirname, '..', 'public')));

    app.locals.consoleManager = consoleManager;
    app.locals.scheduler      = scheduler;
    app.locals.config         = config;
    app.locals.performBackup  = performBackup;

    app.use('/api/consoles',  require('./routes/consoles'));
    app.use('/api/status',    require('./routes/status'));
    app.use('/api/backup',    require('./routes/backup'));
    app.use('/api/schedules', require('./routes/schedules'));
    app.use('/api/logs',      require('./routes/logs'));

    const webPort = config.web?.port || 3000;
    app.listen(webPort, () => {
        logger.info({ port: webPort }, `Web server running at http://localhost:${webPort}`);
    });

    process.on('SIGINT', () => {
        logger.info('Shutting down...');
        consoleManager.closeAll();
        process.exit(0);
    });
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
