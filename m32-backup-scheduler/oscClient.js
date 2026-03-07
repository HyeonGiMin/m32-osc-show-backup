const osc = require("osc");
const logger = require("./logger");

class OSCClient {
    constructor(ip, port) {
        this.ip = ip;
        this.port = port;
        this.udpPort = null;
        this.isReady = false;
        this.xremoteTimer = null;
        this.receiveMode = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.udpPort = new osc.UDPPort({
                localAddress: "0.0.0.0",
                localPort: 0,
                metadata: true,
            });

            this.udpPort.on("ready", () => {
                this.isReady = true;
                logger.info({ ip: this.ip, port: this.port }, "OSC connected");
                resolve();
            });

            this.udpPort.on("error", (err) => {
                logger.error({ err }, "OSC error");
                reject(err);
            });

            this.udpPort.on("message", (oscMsg) => {
                if (this.receiveMode) {
                    logger.info(
                        { address: oscMsg.address, args: oscMsg.args },
                        "← M32 메시지 수신",
                    );
                } else {
                    logger.debug({ msg: oscMsg }, "OSC message received");
                }
            });

            this.udpPort.open();
        });
    }

    sendMessage(address, args = []) {
        if (!this.isReady) {
            throw new Error("OSC Client is not ready");
        }

        return new Promise((resolve) => {
            this.udpPort.send(
                {
                    address: address,
                    args: args,
                },
                this.ip,
                this.port,
            );

            logger.debug({ address, args }, "OSC sent");
            resolve();
        });
    }

    async backupScene(sourceSlot, targetSlot) {
        logger.info({ sourceSlot, targetSlot }, "Backup scene: load->save");
        await this.sendMessage("/-snap/load", [
            { type: "i", value: sourceSlot },
        ]);
        await this.delay(1000);
        await this.sendMessage("/-snap/save", [
            { type: "i", value: targetSlot },
        ]);
    }

    async backupShow(sourceSlot, targetSlot) {
        logger.info({ sourceSlot, targetSlot }, "Backup show: load->save");
        await this.sendMessage("/-show/showfile/load", [
            { type: "i", value: sourceSlot },
        ]);
        await this.delay(2000);
        await this.sendMessage("/-show/showfile/save", [
            { type: "i", value: targetSlot },
        ]);
    }

    async startXremote() {
        if (!this.isReady) {
            throw new Error("OSC Client is not ready");
        }

        logger.info("Starting /xremote keepalive mode (9초 간격)");
        this.receiveMode = true;

        // 첫 /xremote 전송
        await this.sendMessage("/xremote", []);

        // 9초마다 keepalive
        this.xremoteTimer = setInterval(async () => {
            try {
                await this.sendMessage("/xremote", []);
                logger.debug("→ /xremote keepalive");
            } catch (err) {
                logger.error({ err }, "xremote keepalive failed");
            }
        }, 9000);

        logger.info(
            "Receive mode 활성화 - M32 변경사항을 실시간으로 수신합니다",
        );
    }

    stopXremote() {
        if (this.xremoteTimer) {
            clearInterval(this.xremoteTimer);
            this.xremoteTimer = null;
            this.receiveMode = false;
            logger.info("Stopped /xremote keepalive mode");
        }
    }

    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    close() {
        this.stopXremote();
        if (this.udpPort) {
            this.udpPort.close();
            this.isReady = false;
            logger.info("OSC disconnected");
        }
    }
}

module.exports = OSCClient;
