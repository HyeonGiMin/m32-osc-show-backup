const express = require('express');
const router = express.Router();
const { backupScene, backupShow, restoreScene } = require('../backup');
const logger = require('../logger');

function resolveClient(req, res) {
    const consoleId = req.body?.consoleId;
    if (!consoleId) { res.status(400).json({ error: 'consoleId is required' }); return null; }

    const client = req.app.locals.consoleManager.getClient(consoleId);
    if (!client) { res.status(404).json({ error: `Console not found: ${consoleId}` }); return null; }

    return { client, consoleId };
}

router.post('/scene', async (req, res) => {
    const resolved = resolveClient(req, res);
    if (!resolved) return;
    const { client, consoleId } = resolved;

    const options = {};
    if (req.body?.slot !== undefined) options.specificSlot = parseInt(req.body.slot, 10);
    if (req.body?.name) options.name = req.body.name;
    if (req.body?.desc) options.desc = req.body.desc;

    try {
        const result = await backupScene(client, req.app.locals.config, consoleId, options);
        res.json({ success: true, ...result });
    } catch (err) {
        logger.error({ err: err.message, consoleId }, 'Scene backup failed');
        res.status(500).json({ error: err.message });
    }
});

router.post('/show', async (req, res) => {
    const resolved = resolveClient(req, res);
    if (!resolved) return;
    const { client, consoleId } = resolved;

    try {
        const result = await backupShow(client, req.app.locals.config, consoleId);
        res.json({ success: true, ...result });
    } catch (err) {
        logger.error({ err: err.message, consoleId }, 'Show backup failed');
        res.status(500).json({ error: err.message });
    }
});

router.post('/scene/restore', async (req, res) => {
    const resolved = resolveClient(req, res);
    if (!resolved) return;
    const { client, consoleId } = resolved;

    const slot = parseInt(req.body?.slot, 10);
    if (isNaN(slot)) return res.status(400).json({ error: 'slot is required' });

    try {
        const result = await restoreScene(client, slot, consoleId);
        res.json({ success: true, ...result });
    } catch (err) {
        logger.error({ err: err.message, consoleId }, 'Scene restore failed');
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
