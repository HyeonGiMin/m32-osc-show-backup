const osc = require('osc');
const logger = require('./logger');

class OSCClient {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.udpPort = null;
        this.isReady = false;
        this._messageHandlers = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.udpPort = new osc.UDPPort({
                localAddress: '0.0.0.0',
                localPort: 0,
                metadata: true,
            });

            this.udpPort.on('ready', () => {
                this.isReady = true;
                logger.info({ ip: this.ip, port: this.port }, 'OSC UDP port ready');
                resolve();
            });

            this.udpPort.on('error', (err) => {
                logger.error({ err: err.message }, 'OSC error');
                if (!this.isReady) reject(err);
            });

            this.udpPort.on('message', (oscMsg) => {
                logger.debug({ address: oscMsg.address }, 'OSC message received');
                for (const handler of this._messageHandlers) {
                    handler(oscMsg);
                }
            });

            this.udpPort.open();
        });
    }

    // Returns a cleanup function
    onMessage(handler) {
        this._messageHandlers.push(handler);
        return () => {
            this._messageHandlers = this._messageHandlers.filter(h => h !== handler);
        };
    }

    sendMessage(address, args = []) {
        if (!this.isReady) throw new Error('OSC client is not ready');
        this.udpPort.send({ address, args }, this.ip, this.port);
        logger.debug({ address, args }, 'OSC sent');
    }

    // Sends /info and waits for a response to confirm reachability
    checkReachability(timeoutMs = 2000) {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                remove();
                resolve(false);
            }, timeoutMs);

            const remove = this.onMessage((msg) => {
                if (msg.address === '/info' || msg.address === '/xinfo') {
                    clearTimeout(timer);
                    remove();
                    resolve(true);
                }
            });

            try {
                this.sendMessage('/info', []);
            } catch (e) {
                clearTimeout(timer);
                remove();
                resolve(false);
            }
        });
    }

    // Save current console state to a scene slot
    async saveScene(slot) {
        logger.info({ slot }, 'Saving scene to slot');
        this.sendMessage('/-snap/save', [{ type: 'i', value: slot }]);
        await this.delay(500);
    }

    // Save current show by name
    async saveShow(name) {
        logger.info({ name }, 'Saving show');
        this.sendMessage('/save/show', [{ type: 's', value: name }]);
        await this.delay(1000);
    }

    // Delete a show by name
    deleteShow(name) {
        this.sendMessage('/delete/show', [{ type: 's', value: name }]);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    close() {
        if (this.udpPort) {
            this.udpPort.close();
            this.isReady = false;
            logger.info('OSC disconnected');
        }
    }
}

module.exports = OSCClient;
