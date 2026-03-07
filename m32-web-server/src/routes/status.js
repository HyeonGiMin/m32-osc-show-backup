const express = require('express');
const router = express.Router();
const { loadSceneIndex } = require('../backup');

// GET all consoles with reachability status
router.get('/', async (req, res) => {
    const { consoleManager } = req.app.locals;
    const consoles = consoleManager.getAll();

    const results = await Promise.all(consoles.map(async (c) => {
        const client = consoleManager.getClient(c.id);
        const reachable = client ? await client.checkReachability(2000) : false;
        const sceneIndex = loadSceneIndex(c.id);
        return { ...c, reachable, oscReady: client?.isReady ?? false, sceneIndex };
    }));

    res.json(results);
});

// GET single console status
router.get('/:id', async (req, res) => {
    const { consoleManager } = req.app.locals;
    const consoleConfig = consoleManager.getOne(req.params.id);
    if (!consoleConfig) return res.status(404).json({ error: 'Console not found' });

    const client = consoleManager.getClient(req.params.id);
    const reachable = client ? await client.checkReachability(2000) : false;
    const sceneIndex = loadSceneIndex(req.params.id);

    res.json({ ...consoleConfig, reachable, oscReady: client?.isReady ?? false, sceneIndex });
});

module.exports = router;
