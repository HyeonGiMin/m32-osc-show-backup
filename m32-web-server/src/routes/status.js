const express = require('express');
const router = express.Router();
const { loadSceneIndex } = require('../backup');

function scheduleNextSlots(config, consoleId, sceneIndex) {
    const defaultRange = config.sceneBackup.slotRange;
    return config.schedules
        .filter(s => s.consoleId === consoleId && s.enabled)
        .map(s => {
            const state = sceneIndex.scheduleStates?.[s.id] || {};
            const range = s.slotRange || defaultRange;
            return {
                id:       s.id,
                name:     s.name,
                color:    s.color || '#4a9eff',
                nextSlot: state.currentSlot ?? range.start,
            };
        });
}

// GET all consoles with reachability status
router.get('/', async (req, res) => {
    const { consoleManager, config } = req.app.locals;
    const consoles = consoleManager.getAll();

    const slotRange = config.sceneBackup.slotRange;
    const results = await Promise.all(consoles.map(async (c) => {
        const client = consoleManager.getClient(c.id);
        const reachable = client ? await client.checkReachability() : false;
        const sceneIndex = loadSceneIndex(c.id);
        const schedules = scheduleNextSlots(config, c.id, sceneIndex);
        return { ...c, reachable, oscReady: client?.isReady ?? false, sceneIndex, slotRange, schedules };
    }));

    res.json(results);
});

// GET single console status
router.get('/:id', async (req, res) => {
    const { consoleManager, config } = req.app.locals;
    const consoleConfig = consoleManager.getOne(req.params.id);
    if (!consoleConfig) return res.status(404).json({ error: 'Console not found' });

    const client = consoleManager.getClient(req.params.id);
    const reachable = client ? await client.checkReachability() : false;
    const sceneIndex = loadSceneIndex(req.params.id);
    const slotRange = config.sceneBackup.slotRange;
    const schedules = scheduleNextSlots(config, req.params.id, sceneIndex);

    res.json({ ...consoleConfig, reachable, oscReady: client?.isReady ?? false, sceneIndex, slotRange, schedules });
});

module.exports = router;
