const express = require('express');
const router = express.Router();
const logger = require('../logger');

// GET all consoles (config only, no reachability check)
router.get('/', (req, res) => {
    res.json(req.app.locals.consoleManager.getAll());
});

// POST add a new console
router.post('/', async (req, res) => {
    try {
        const console = await req.app.locals.consoleManager.addConsole(req.body);
        res.status(201).json(console);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT update a console
router.put('/:id', async (req, res) => {
    try {
        const updated = await req.app.locals.consoleManager.updateConsole(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE remove a console
router.delete('/:id', (req, res) => {
    const { consoleManager, scheduler } = req.app.locals;
    const id = req.params.id;

    // Check if any schedule still references this console
    const refs = scheduler.getSchedules().filter(s => s.consoleId === id);
    if (refs.length > 0) {
        return res.status(409).json({
            error: `Cannot delete: ${refs.length} schedule(s) reference this console`,
            schedules: refs.map(s => s.name),
        });
    }

    try {
        consoleManager.removeConsole(id);
        res.json({ success: true });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

module.exports = router;
