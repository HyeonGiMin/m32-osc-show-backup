const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

class Scheduler {
    constructor(config, performBackup) {
        this.config = config;
        this.performBackup = performBackup; // (type, consoleId) => Promise
        this.jobs = new Map(); // scheduleId -> cron task
    }

    start() {
        for (const schedule of this.config.schedules) {
            if (schedule.enabled) this._startJob(schedule);
        }
        logger.info({ count: this.jobs.size }, 'Scheduler started');
    }

    _startJob(schedule) {
        if (!cron.validate(schedule.cron)) {
            logger.error({ name: schedule.name, cron: schedule.cron }, 'Invalid cron expression, skipping');
            return false;
        }

        const task = cron.schedule(schedule.cron, async () => {
            logger.info({ name: schedule.name, consoleId: schedule.consoleId }, 'Scheduled backup triggered');
            try {
                await this.performBackup(schedule.type || 'scene', schedule.consoleId);
            } catch (err) {
                logger.error({ err: err.message, name: schedule.name }, 'Scheduled backup failed');
            }
        });

        this.jobs.set(schedule.id, task);
        logger.info({ name: schedule.name, cron: schedule.cron, consoleId: schedule.consoleId }, 'Job scheduled');
        return true;
    }

    _stopJob(id) {
        const task = this.jobs.get(id);
        if (task) { task.stop(); this.jobs.delete(id); }
    }

    getSchedules() {
        return this.config.schedules;
    }

    addSchedule(data, consoleIds) {
        if (!data.name || !data.cron)      throw new Error('name and cron are required');
        if (!data.consoleId)               throw new Error('consoleId is required');
        if (!cron.validate(data.cron))     throw new Error(`Invalid cron expression: ${data.cron}`);
        if (!consoleIds.includes(data.consoleId)) throw new Error(`Unknown consoleId: ${data.consoleId}`);

        const schedule = {
            id:        uuidv4(),
            name:      data.name,
            type:      data.type || 'scene',
            consoleId: data.consoleId,
            enabled:   data.enabled !== false,
            cron:      data.cron,
        };

        this.config.schedules.push(schedule);
        if (schedule.enabled) this._startJob(schedule);
        this._persist();
        return schedule;
    }

    updateSchedule(id, data, consoleIds) {
        const idx = this.config.schedules.findIndex(s => s.id === id);
        if (idx === -1) throw new Error('Schedule not found');
        if (data.cron && !cron.validate(data.cron)) throw new Error(`Invalid cron expression: ${data.cron}`);
        if (data.consoleId && !consoleIds.includes(data.consoleId)) throw new Error(`Unknown consoleId: ${data.consoleId}`);

        this._stopJob(id);
        const schedule = { ...this.config.schedules[idx], ...data, id };
        this.config.schedules[idx] = schedule;
        if (schedule.enabled) this._startJob(schedule);
        this._persist();
        return schedule;
    }

    deleteSchedule(id) {
        const idx = this.config.schedules.findIndex(s => s.id === id);
        if (idx === -1) throw new Error('Schedule not found');
        this._stopJob(id);
        this.config.schedules.splice(idx, 1);
        this._persist();
    }

    _persist() {
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), 'utf8');
        } catch (err) {
            logger.error({ err: err.message }, 'Failed to persist config.json');
        }
    }
}

module.exports = Scheduler;
