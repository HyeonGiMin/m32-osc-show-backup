const express = require('express');
const router = express.Router();
const logger = require('../logger');

function consoleIds(req) {
    return req.app.locals.consoleManager.getAll().map(c => c.id);
}

router.get('/', (req, res) => {
    res.json(req.app.locals.scheduler.getSchedules());
});

router.post('/', (req, res) => {
    try {
        const schedule = req.app.locals.scheduler.addSchedule(req.body, consoleIds(req));
        logger.info({ name: schedule.name, consoleId: schedule.consoleId }, 'Schedule added');
        res.status(201).json(schedule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', (req, res) => {
    try {
        const schedule = req.app.locals.scheduler.updateSchedule(req.params.id, req.body, consoleIds(req));
        logger.info({ name: schedule.name }, 'Schedule updated');
        res.json(schedule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        req.app.locals.scheduler.deleteSchedule(req.params.id);
        logger.info({ id: req.params.id }, 'Schedule deleted');
        res.json({ success: true });
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

module.exports = router;
