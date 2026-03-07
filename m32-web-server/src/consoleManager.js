const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const OSCClient = require('./oscClient');
const logger = require('./logger');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const DATA_DIR    = path.join(__dirname, '..', 'data');

class ConsoleManager {
    constructor(config) {
        this.config = config;
        this.clients = new Map(); // consoleId -> OSCClient
    }

    async init() {
        for (const c of this.config.consoles) {
            await this._connect(c);
        }
    }

    async _connect(consoleConfig) {
        // Ensure per-console data directory exists
        fs.mkdirSync(path.join(DATA_DIR, consoleConfig.id), { recursive: true });

        const client = new OSCClient(consoleConfig.ip, consoleConfig.port);
        try {
            await client.connect();
        } catch (err) {
            logger.error({ id: consoleConfig.id, err: err.message }, 'Console connect failed (will retry on next operation)');
        }
        this.clients.set(consoleConfig.id, client);
    }

    getClient(id) {
        return this.clients.get(id);
    }

    getAll() {
        return this.config.consoles;
    }

    getOne(id) {
        return this.config.consoles.find(c => c.id === id) ?? null;
    }

    async addConsole(data) {
        if (!data.name || !data.ip) throw new Error('name and ip are required');

        const existing = this.config.consoles.find(c => c.ip === data.ip && c.port === (data.port || 10023));
        if (existing) throw new Error(`Console with ${data.ip}:${data.port || 10023} already exists`);

        const consoleConfig = {
            id:   data.id || uuidv4(),
            name: data.name,
            ip:   data.ip,
            port: parseInt(data.port, 10) || 10023,
        };

        this.config.consoles.push(consoleConfig);
        await this._connect(consoleConfig);
        this._persist();
        logger.info({ id: consoleConfig.id, name: consoleConfig.name }, 'Console added');
        return consoleConfig;
    }

    async updateConsole(id, data) {
        const idx = this.config.consoles.findIndex(c => c.id === id);
        if (idx === -1) throw new Error('Console not found');

        const updated = { ...this.config.consoles[idx], ...data, id };
        if (data.port) updated.port = parseInt(data.port, 10);

        // Reconnect if ip/port changed
        const old = this.config.consoles[idx];
        if (old.ip !== updated.ip || old.port !== updated.port) {
            const oldClient = this.clients.get(id);
            if (oldClient) oldClient.close();
            this.clients.delete(id);
            await this._connect(updated);
        }

        this.config.consoles[idx] = updated;
        this._persist();
        logger.info({ id, name: updated.name }, 'Console updated');
        return updated;
    }

    removeConsole(id) {
        const idx = this.config.consoles.findIndex(c => c.id === id);
        if (idx === -1) throw new Error('Console not found');

        const client = this.clients.get(id);
        if (client) client.close();
        this.clients.delete(id);
        this.config.consoles.splice(idx, 1);
        this._persist();
        logger.info({ id }, 'Console removed');
    }

    closeAll() {
        for (const client of this.clients.values()) {
            client.close();
        }
    }

    _persist() {
        try {
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), 'utf8');
        } catch (err) {
            logger.error({ err: err.message }, 'Failed to persist config.json');
        }
    }
}

module.exports = ConsoleManager;
