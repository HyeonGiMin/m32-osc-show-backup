const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const DATA_DIR = path.join(__dirname, '..', 'data');

function dataPaths(consoleId) {
    const dir = path.join(DATA_DIR, consoleId);
    fs.mkdirSync(dir, { recursive: true });
    return {
        sceneIndex: path.join(dir, 'scene-index.json'),
        shows:      path.join(dir, 'shows.json'),
    };
}

function loadSceneIndex(consoleId) {
    try {
        return JSON.parse(fs.readFileSync(dataPaths(consoleId).sceneIndex, 'utf8'));
    } catch (e) {
        return { currentSlot: 80, lastSlot: null, lastBackup: null };
    }
}

function saveSceneIndex(consoleId, data) {
    fs.writeFileSync(dataPaths(consoleId).sceneIndex, JSON.stringify(data, null, 2), 'utf8');
}

function nextSlot(current, range) {
    const next = current + 1;
    return next > range.end ? range.start : next;
}

async function backupScene(oscClient, config, consoleId) {
    if (!oscClient.isReady) throw new Error('OSC client is not ready');

    const sceneIndex = loadSceneIndex(consoleId);
    const slot = sceneIndex.currentSlot ?? config.sceneBackup.slotRange.start;

    await oscClient.saveScene(slot);

    const next = nextSlot(slot, config.sceneBackup.slotRange);
    saveSceneIndex(consoleId, { currentSlot: next, lastSlot: slot, lastBackup: new Date().toISOString() });

    logger.info({ consoleId, slot, nextSlot: next }, 'Scene backup completed');
    return { consoleId, slot, nextSlot: next };
}

async function backupShow(oscClient, config, consoleId) {
    if (!oscClient.isReady) throw new Error('OSC client is not ready');

    const prefix   = config.showBackup?.prefix   || 'auto_web_';
    const maxShows = config.showBackup?.maxShows  || 10;
    const name = `${prefix}${Date.now()}`;

    const { shows: showsPath } = dataPaths(consoleId);
    let shows = [];
    try { shows = JSON.parse(fs.readFileSync(showsPath, 'utf8')); } catch (e) {}

    await oscClient.saveShow(name);
    shows.push({ name, time: new Date().toISOString() });

    if (shows.length > maxShows) {
        const toDelete = shows.splice(0, shows.length - maxShows);
        for (const show of toDelete) {
            try { oscClient.deleteShow(show.name); } catch (e) {}
        }
    }

    fs.writeFileSync(showsPath, JSON.stringify(shows, null, 2), 'utf8');
    logger.info({ consoleId, name, totalShows: shows.length }, 'Show backup completed');
    return { consoleId, name, totalShows: shows.length };
}

module.exports = { backupScene, backupShow, loadSceneIndex };
