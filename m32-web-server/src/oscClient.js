const osc = require('osc');
const logger = require('./logger');

const PROBE_INTERVAL_MS   = 30_000; // 오프라인 상태: 30초마다 /info 전송
const PROBE_TIMEOUT_MS    =  2_000; // 응답 대기 시간
const XREMOTE_INTERVAL_MS =  9_000; // 온라인 상태: 9초마다 /xremote 갱신
const LIVENESS_EVERY      =      3; // keepalive 3회(~27s)마다 /info 생존 확인

class OSCClient {
    constructor(ip, port) {
        this.ip   = ip;
        this.port = port;
        this.udpPort = null;
        this.isReady = false;
        this.online  = false;

        this._messageHandlers = [];
        this._stateHandlers   = [];
        this._keepaliveTimer  = null;
        this._probeTimer      = null;
        this._probing         = false;
        this._keepaliveCount  = 0;
    }

    // ── 연결 ──────────────────────────────────────────────────────────────────

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
                this._startProbe();
                resolve();
            });

            this.udpPort.on('error', (err) => {
                logger.error({ err: err.message }, 'OSC error');
                if (!this.isReady) reject(err);
            });

            this.udpPort.on('message', (oscMsg) => {
                for (const handler of this._messageHandlers) {
                    handler(oscMsg);
                }
            });

            this.udpPort.open();
        });
    }

    // ── 상태 전환 ─────────────────────────────────────────────────────────────

    _goOnline() {
        if (this.online) return;
        this.online = true;
        logger.info({ ip: this.ip }, 'Console came online');
        for (const h of this._stateHandlers) try { h('online'); } catch {}
        this._stopProbe();
        this._startKeepalive();
    }

    _goOffline() {
        if (!this.online) return;
        this.online = false;
        logger.warn({ ip: this.ip }, 'Console went offline');
        for (const h of this._stateHandlers) try { h('offline'); } catch {}
        this._stopKeepalive();
        this._startProbe();
    }

    // ── 오프라인 프로브: 30초마다 /info 전송 → 응답 오면 온라인 전환 ──────────

    _startProbe() {
        this._doProbe();
        this._probeTimer = setInterval(() => this._doProbe(), PROBE_INTERVAL_MS);
    }

    _stopProbe() {
        if (this._probeTimer) { clearInterval(this._probeTimer); this._probeTimer = null; }
    }

    _doProbe() {
        if (this.online || this._probing || !this.isReady) return;
        this._probing = true;

        const timer = setTimeout(() => {
            remove();
            this._probing = false;
        }, PROBE_TIMEOUT_MS);

        const remove = this.onMessage((msg) => {
            if (msg.address === '/info' || msg.address === '/xinfo') {
                clearTimeout(timer);
                remove();
                this._probing = false;
                this._goOnline();
            }
        });

        try {
            this.sendMessage('/info', []);
        } catch {
            clearTimeout(timer);
            remove();
            this._probing = false;
        }
    }

    // ── 온라인 keepalive: 9초마다 /xremote, 27초마다 생존 확인 ───────────────

    _startKeepalive() {
        this._keepaliveCount = 0;
        try { this.sendMessage('/xremote', []); } catch {}

        this._keepaliveTimer = setInterval(() => {
            try { this.sendMessage('/xremote', []); } catch {}
            this._keepaliveCount++;
            if (this._keepaliveCount % LIVENESS_EVERY === 0) {
                this._livenessCheck();
            }
        }, XREMOTE_INTERVAL_MS);
    }

    _stopKeepalive() {
        if (this._keepaliveTimer) { clearInterval(this._keepaliveTimer); this._keepaliveTimer = null; }
        this._keepaliveCount = 0;
    }

    // /info 를 보내고 2초 내 응답 없으면 오프라인 전환
    _livenessCheck() {
        const timer = setTimeout(() => {
            remove();
            this._goOffline();
        }, PROBE_TIMEOUT_MS);

        const remove = this.onMessage(() => {
            clearTimeout(timer);
            remove();
            // 응답 확인 → 온라인 유지
        });

        try {
            this.sendMessage('/info', []);
        } catch {
            clearTimeout(timer);
            remove();
            this._goOffline();
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    // 메시지 수신 핸들러 등록 (cleanup 함수 반환)
    onMessage(handler) {
        this._messageHandlers.push(handler);
        return () => {
            this._messageHandlers = this._messageHandlers.filter(h => h !== handler);
        };
    }

    // 상태 변화(online/offline) 핸들러 등록 (cleanup 함수 반환)
    onStateChange(handler) {
        this._stateHandlers.push(handler);
        return () => {
            this._stateHandlers = this._stateHandlers.filter(h => h !== handler);
        };
    }

    sendMessage(address, args = []) {
        if (!this.isReady) throw new Error('OSC client is not ready');
        this.udpPort.send({ address, args }, this.ip, this.port);
        logger.debug({ address }, 'OSC sent');
    }

    // 캐시된 상태 반환 (네트워크 I/O 없음)
    checkReachability() {
        return Promise.resolve(this.online);
    }

    // 씬 슬롯 0~(count-1) 의 이름과 hasdata 를 일괄 조회
    // 반환: { 0: { name, hasData }, 1: {...}, ... }
    getSceneList(count = 100, timeoutMs = 3000) {
        return new Promise((resolve) => {
            const results = {};
            const pending = new Map(); // addr -> slot+type

            for (let i = 0; i < count; i++) {
                const idx = String(i).padStart(3, '0');
                pending.set(`/-show/showfile/scene/${idx}/name`,    { slot: i, type: 'name' });
                pending.set(`/-show/showfile/scene/${idx}/hasdata`, { slot: i, type: 'hasData' });
                if (!results[i]) results[i] = { name: '', hasData: 0 };
            }

            const timer = setTimeout(() => { remove(); resolve(results); }, timeoutMs);

            const remove = this.onMessage((msg) => {
                const entry = pending.get(msg.address);
                if (entry) {
                    const val = msg.args?.[0]?.value;
                    results[entry.slot][entry.type] = val ?? (entry.type === 'name' ? '' : 0);
                    pending.delete(msg.address);
                    if (pending.size === 0) { clearTimeout(timer); remove(); resolve(results); }
                }
            });

            for (const addr of pending.keys()) {
                try { this.sendMessage(addr, []); } catch {}
            }
        });
    }

    // 현재 로드된 쇼 이름 조회
    getShowName(timeoutMs = 2000) {
        return new Promise((resolve) => {
            const addr = '/-show/showfile/show/name';
            const timer = setTimeout(() => { remove(); resolve(null); }, timeoutMs);
            const remove = this.onMessage((msg) => {
                if (msg.address === addr) {
                    clearTimeout(timer); remove();
                    resolve(msg.args?.[0]?.value ?? null);
                }
            });
            try { this.sendMessage(addr, []); } catch { clearTimeout(timer); remove(); resolve(null); }
        });
    }

    async saveScene(slot) {
        logger.info({ slot }, 'Saving scene');
        this.sendMessage('/-snap/save', [{ type: 'i', value: slot }]);
        await this.delay(500);
    }

    async loadScene(slot) {
        logger.info({ slot }, 'Loading scene from slot');
        this.sendMessage('/-snap/load', [{ type: 'i', value: slot }]);
        await this.delay(500);
    }

    async saveShow(name) {
        logger.info({ name }, 'Saving show');
        this.sendMessage('/save/show', [{ type: 's', value: name }]);
        await this.delay(1000);
    }

    deleteShow(name) {
        this.sendMessage('/delete/show', [{ type: 's', value: name }]);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    close() {
        this._stopProbe();
        this._stopKeepalive();
        if (this.udpPort) {
            this.udpPort.close();
            this.isReady = false;
            this.online  = false;
            logger.info({ ip: this.ip }, 'OSC disconnected');
        }
    }
}

module.exports = OSCClient;
