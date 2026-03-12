const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logger = require('../logger');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config.json');

// GET /api/config/ui — return current UI settings
router.get('/ui', (req, res) => {
    const { config } = req.app.locals;
    res.json({
        pollingInterval: config.ui?.pollingInterval ?? 60,
    });
});

// PUT /api/config/ui — persist UI settings to config.json
router.put('/ui', (req, res) => {
    const { pollingInterval } = req.body;
    if (typeof pollingInterval !== 'number' || (pollingInterval !== 0 && pollingInterval < 5)) {
        return res.status(400).json({ error: 'pollingInterval must be 0 (off) or >= 5' });
    }

    const config = req.app.locals.config;
    if (!config.ui) config.ui = {};
    config.ui.pollingInterval = pollingInterval;

    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
        logger.info({ pollingInterval }, 'UI config saved to server');
        res.json({ success: true, pollingInterval });
    } catch (err) {
        logger.error({ err: err.message }, 'Failed to write config.json');
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
