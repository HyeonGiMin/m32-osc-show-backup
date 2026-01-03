const fs = require("fs");
const path = require("path");
const osc = require("osc");

// ===== 설정 =====
const M32_IP = process.env.M32_IP || "192.168.0.96";
const M32_PORT = parseInt(process.env.M32_PORT || "10023", 10);
const MIN_SLOT = 80;
const MAX_SLOT = 99;

const ROOT = __dirname;
const LOG_DIR = path.join(ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "backup.log");
const INDEX_FILE = path.join(ROOT, "scene-index.json");

// ===== 유틸 =====
function ensureDirs() {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(line) {
    ensureDirs();
    const msg = `[${new Date().toISOString()}] ${line}\n`;
    fs.appendFileSync(LOG_FILE, msg);
    console.log(line);
}

function loadIndex() {
    if (!fs.existsSync(INDEX_FILE)) {
        return { currentSlot: MIN_SLOT, minSlot: MIN_SLOT, maxSlot: MAX_SLOT };
    }
    try {
        const data = fs.readFileSync(INDEX_FILE, "utf8");
        return JSON.parse(data);
    } catch (e) {
        log(`WARN: scene-index.json 읽기 실패: ${e.message}`);
        return { currentSlot: MIN_SLOT, minSlot: MIN_SLOT, maxSlot: MAX_SLOT };
    }
}

function saveIndex(indexData) {
    try {
        fs.writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2));
    } catch (e) {
        log(`ERROR: scene-index.json 저장 실패: ${e.message}`);
    }
}

function getNextSlot(current, min, max) {
    const next = current + 1;
    return next > max ? min : next;
}

// ===== OSC 포트 =====
const udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 0,
    metadata: true,
});

function sendOSC(address, args = []) {
    return new Promise((resolve, reject) => {
        try {
            udpPort.send({ address, args }, M32_IP, M32_PORT);
            resolve();
        } catch (e) {
            reject(e);
        }
    });
}

async function checkConsoleReachable(timeoutMs = 2000) {
    return new Promise((resolve) => {
        let finished = false;

        const finish = (ok, reason) => {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            udpPort.removeListener("message", onMessage);
            resolve({ ok, reason });
        };

        const onMessage = (oscMsg) => {
            if (oscMsg.address === "/info") {
                finish(true, "info");
            }
        };

        const timer = setTimeout(() => finish(false, "timeout"), timeoutMs);
        udpPort.on("message", onMessage);

        sendOSC("/info").catch(() => finish(false, "send-error"));
    });
}

async function main() {
    ensureDirs();
    log("=== M32 Scene 자동 백업 시작 ===");
    log(`TARGET ${M32_IP}:${M32_PORT}, SLOTS ${MIN_SLOT}-${MAX_SLOT}`);

    const reachable = await checkConsoleReachable();
    if (!reachable.ok) {
        log("ERROR: 콘솔 응답 없음 (/info). IP/포트를 확인 후 재시도하세요.");
        udpPort.close();
        process.exit(1);
        return;
    }
    log("콘솔 응답 확인: /info 수신");

    const indexData = loadIndex();
    const slot = indexData.currentSlot;

    // Scene 저장 요청 (/save "scene" <index> <name> <note>)
    const sceneName = `Auto_${slot}`;
    const sceneNote = new Date().toISOString();

    log(`SAVE Scene to slot ${slot} (${sceneName})`);
    await sendOSC("/save", [
        { type: "s", value: "scene" },
        { type: "i", value: slot },
        { type: "s", value: sceneName },
        { type: "s", value: sceneNote },
    ]);
    log(`Scene 저장 완료: Slot ${slot}`);

    // 다음 슬롯 계산
    const nextSlot = getNextSlot(slot, indexData.minSlot, indexData.maxSlot);
    indexData.currentSlot = nextSlot;
    saveIndex(indexData);
    log(`다음 슬롯: ${nextSlot}`);

    log("=== 백업 스크립트 완료 ===");
}

udpPort.on("ready", () => {
    main()
        .then(() => {
            udpPort.close();
            process.exit(0);
        })
        .catch((err) => {
            log(`ERROR: ${err.message}`);
            udpPort.close();
            process.exit(1);
        });
});

udpPort.on("error", (err) => {
    log(`OSC 포트 에러: ${err.message}`);
});

udpPort.open();
