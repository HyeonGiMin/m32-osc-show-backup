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
        return { currentSlot: 80, lastSlot: null, lastBackup: null, slots: {} };
    }
}

function saveSceneIndex(consoleId, data) {
    fs.writeFileSync(dataPaths(consoleId).sceneIndex, JSON.stringify(data, null, 2), 'utf8');
}

function nextSlot(current, range) {
    const next = current + 1;
    return next > range.end ? range.start : next;
}

// options.specificSlot : 지정 슬롯에 백업 (로테이션 포지션 유지)
// options.slotRange    : 스케줄별 슬롯 범위 오버라이드 { start, end }
// options.scheduleId   : 스케줄 ID (per-schedule currentSlot 추적)
async function backupScene(oscClient, config, consoleId, options = {}) {
    if (!oscClient.online) throw new Error('Console is offline');

    const slotRange = options.slotRange || config.sceneBackup.slotRange;
    const sceneIndex = loadSceneIndex(consoleId);
    const scheduleStates = { ...(sceneIndex.scheduleStates || {}) };

    let slot;
    if (options.specificSlot !== undefined) {
        slot = options.specificSlot;
    } else if (options.scheduleId) {
        const state = scheduleStates[options.scheduleId] || {};
        slot = state.currentSlot ?? slotRange.start;
        if (slot < slotRange.start || slot > slotRange.end) slot = slotRange.start;
    } else {
        slot = sceneIndex.currentSlot ?? slotRange.start;
        if (slot < slotRange.start || slot > slotRange.end) slot = slotRange.start;
    }

    await oscClient.saveScene(slot);

    const slotEntry = { time: new Date().toISOString() };
    if (options.name) slotEntry.name = options.name;
    if (options.desc) slotEntry.desc = options.desc;
    const slots = { ...(sceneIndex.slots || {}), [String(slot)]: slotEntry };

    // 로테이션 포인터 전진 (specificSlot 이면 포인터 불변)
    let newCurrentSlot = sceneIndex.currentSlot ?? slotRange.start;
    let newLastSlot    = sceneIndex.lastSlot ?? null;

    if (options.specificSlot === undefined) {
        const next = nextSlot(slot, slotRange);
        if (options.scheduleId) {
            scheduleStates[options.scheduleId] = { currentSlot: next, lastSlot: slot };
        } else {
            newCurrentSlot = next;
            newLastSlot    = slot;
        }
    }

    saveSceneIndex(consoleId, {
        currentSlot: newCurrentSlot,
        lastSlot:    newLastSlot,
        lastBackup:  new Date().toISOString(),
        slots,
        scheduleStates,
    });

    logger.info({ consoleId, slot }, 'Scene backup completed');
    return { consoleId, slot };
}

async function backupShow(oscClient, config, consoleId) {
    if (!oscClient.online) throw new Error('Console is offline');

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

async function restoreScene(oscClient, slot, consoleId) {
    if (!oscClient.online) throw new Error('Console is offline');
    logger.info({ consoleId, slot }, 'Restoring scene from slot');
    await oscClient.loadScene(slot);
    logger.info({ consoleId, slot }, 'Scene restore completed');
    return { consoleId, slot };
}

function loadShows(consoleId) {
    try {
        return JSON.parse(fs.readFileSync(dataPaths(consoleId).shows, 'utf8'));
    } catch (e) {
        return [];
    }
}

module.exports = { backupScene, backupShow, restoreScene, loadSceneIndex, loadShows };
