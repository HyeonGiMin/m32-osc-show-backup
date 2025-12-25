const fs = require("fs");
const path = require("path");
const osc = require("osc");

// ===== 설정 =====
const M32_IP = process.env.M32_IP || "192.168.0.2";
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
            const message = { address, args };
            udpPort.send(message, M32_IP, M32_PORT);
            console.log(`→ 전송: ${address}`);
            if (args.length > 0) {
                console.log(
                    "  인자:",
                    args
                        .map((arg) => {
                            if (typeof arg === "object") {
                                return `${arg.type}: ${arg.value}`;
                            }
                            return arg;
                        })
                        .join(", "),
                );
            }
            resolve();
        } catch (e) {
            console.error("전송 실패:", e.message);
            reject(e);
        }
    });
}

// 슬롯의 scene 데이터 존재 여부 확인
function checkSceneData(slot) {
    return new Promise((resolve) => {
        let hasData = false;
        let timeout;
        const slotStr = String(slot).padStart(3, "0");
        let targetAddress = `/-show/showfile/scene/${slotStr}/hasdata`;

        targetAddress = targetAddress.normalize("NFKC");
        targetAddress = targetAddress.replace(/[\u2010-\u2015\u2212]/g, "-");

        const messageHandler = (oscMessage) => {
            // hasdata 응답 확인
            if (
                oscMessage.address === targetAddress &&
                oscMessage.args &&
                oscMessage.args.length > 0
            ) {
                const value = oscMessage.args[0].value;
                hasData = value === 1 ? true : false;
                clearTimeout(timeout);
                udpPort.removeListener("message", messageHandler);
                resolve(hasData);
            }
        };

        udpPort.on("message", messageHandler);

        // 타임아웃 설정 (1초)
        timeout = setTimeout(() => {
            udpPort.removeListener("message", messageHandler);
            resolve(hasData);
        }, 1000);

        // Scene 데이터 존재 여부 요청
        try {
            udpPort.send({ address: targetAddress }, M32_IP, M32_PORT);
        } catch (e) {
            log(`WARN: Scene 정보 요청 실패: ${e.message}`);
            clearTimeout(timeout);
            udpPort.removeListener("message", messageHandler);
            resolve(false);
        }
    });
}

async function main() {
    ensureDirs();
    log("=== M32 Scene 자동 백업 시작 ===");
    log(`TARGET ${M32_IP}:${M32_PORT}, SLOTS ${MIN_SLOT}-${MAX_SLOT}`);

    // 슬롯 1의 scene 데이터 확인
    log("Slot 1의 Scene 데이터 확인 중...");
    const hasSceneData = await checkSceneData(1);
    if (hasSceneData) {
        log("✓ Slot 1에 Scene 데이터가 있습니다");
    } else {
        log("✗ Slot 1에 Scene 데이터가 없습니다");
    }

    const indexData = loadIndex();
    const slot = indexData.currentSlot;

    // Scene 저장 요청 (/save "scene" <index> <name> <note>)
    const slotStr = String(slot).padStart(3, "0"); // 3자리 형식 (예: "081")
    const sceneName = `Auto_${slot}`;
    const sceneNote = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식

    log(`SAVE Scene to slot ${slotStr} (${sceneName})`);
    await sendOSC("/save", [
        { type: "s", value: "scene" },
        { type: "s", value: slotStr }, // 정수 대신 3자리 문자열로
        { type: "s", value: sceneName },
        { type: "s", value: sceneNote },
    ]);
    log(`Scene 저장 완료: Slot ${slotStr}`);

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
            log("=== 백업 완료, 프로세스 종료 ===");
            // 프로세스 종료 전 약간의 대기
            setTimeout(() => {
                udpPort.close();
                process.exit(0);
            }, 200);
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
