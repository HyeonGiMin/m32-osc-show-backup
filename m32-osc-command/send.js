const osc = require("osc");
const readline = require("readline");
const fs = require("fs");
const path = require("path");

// ===== 로깅 설정: 실행 위치 기준 log/ 폴더 + 시작 시각 파일 =====
const LOG_DIR = path.join(process.cwd(), "log");
const LOG_START = new Date();
const LOG_BASENAME = LOG_START.toISOString().replace(/[:.]/g, "-");
const LOG_FILE = path.join(LOG_DIR, `osc-command-${LOG_BASENAME}.log`);
fs.mkdirSync(LOG_DIR, { recursive: true });
const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });

const originalLog = console.log;
const originalError = console.error;

function writeLog(level, args) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] ${args
        .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
        .join(" ")}`;
    try {
        logStream.write(line + "\n");
    } catch (e) {
        originalError("로그 파일 기록 실패:", e.message);
    }
}

console.log = (...args) => {
    originalLog(...args);
    writeLog("INFO", args);
};

console.error = (...args) => {
    originalError(...args);
    writeLog("ERROR", args);
};

// ===== 설정 =====
const M32_IP = process.env.M32_IP || "192.168.0.2";
const M32_PORT = parseInt(process.env.M32_PORT || "10023", 10);

console.log("=".repeat(50));
console.log("M32/X32 OSC Command Sender");
console.log(`연결 대상: ${M32_IP}:${M32_PORT}`);
console.log("=".repeat(50));
console.log("");

// ===== OSC 포트 설정 =====
let udpPort = null;
let xremoteTimer = null;
let subscriptions = new Map(); // { alias: { type, timeFactor } }
let renewTimer = null;
let receiveMode = false;
let currentReadline = null;

// ===== 메시지 설명 생성 =====
function getMessageDescription(oscMessage) {
    const addr = oscMessage.address;
    const args = oscMessage.args || [];

    // 시스템 정보
    if (addr === "/info") {
        return "콘솔 기본 정보";
    }
    if (addr === "/xinfo") {
        if (args.length >= 4) {
            return `콘솔 상세 정보 - IP: ${args[0]?.value}, 모델: ${args[1]?.value}, 펌웨어: ${args[2]?.value}`;
        }
        return "콘솔 상세 정보";
    }
    if (addr === "/status") {
        return "콘솔 상태 정보";
    }

    // 채널 관련
    if (addr.startsWith("/ch/")) {
        const match = addr.match(/\/ch\/(\d+)\/(.+)/);
        if (match) {
            const ch = parseInt(match[1], 10);
            const param = match[2];
            if (param === "config/name") return `채널 ${ch} 이름`;
            if (param === "mix/fader") return `채널 ${ch} 페이더`;
            if (param === "mix/on") return `채널 ${ch} On/Off`;
            if (param === "mix/mute") return `채널 ${ch} Mute`;
            if (param === "mix/pan") return `채널 ${ch} Pan`;
            if (param.startsWith("eq/")) return `채널 ${ch} EQ`;
            if (param.startsWith("dyn/")) return `채널 ${ch} Dynamics`;
            if (param.startsWith("gate/")) return `채널 ${ch} Gate`;
            return `채널 ${ch} - ${param}`;
        }
    }

    // Bus 관련
    if (addr.startsWith("/bus/")) {
        const match = addr.match(/\/bus\/(\d+)\/(.+)/);
        if (match) {
            const bus = parseInt(match[1], 10);
            const param = match[2];
            if (param === "mix/fader") return `Bus ${bus} 페이더`;
            if (param === "mix/on") return `Bus ${bus} On/Off`;
            if (param === "config/name") return `Bus ${bus} 이름`;
            return `Bus ${bus} - ${param}`;
        }
    }

    // DCA 관련
    if (addr.startsWith("/dca/")) {
        const match = addr.match(/\/dca\/(\d+)\/(.+)/);
        if (match) {
            const dca = parseInt(match[1], 10);
            const param = match[2];
            if (param === "fader") return `DCA ${dca} 페이더`;
            if (param === "on") return `DCA ${dca} On/Off`;
            if (param === "config/name") return `DCA ${dca} 이름`;
            return `DCA ${dca} - ${param}`;
        }
    }

    // Main 관련
    if (addr.startsWith("/main/st/")) {
        const param = addr.replace("/main/st/", "");
        if (param === "mix/fader") return "Main Stereo 페이더";
        if (param === "mix/on") return "Main Stereo On/Off";
        return `Main Stereo - ${param}`;
    }
    if (addr.startsWith("/main/m/")) {
        const param = addr.replace("/main/m/", "");
        if (param === "mix/fader") return "Main Mono 페이더";
        if (param === "mix/on") return "Main Mono On/Off";
        return `Main Mono - ${param}`;
    }

    // Scene/Show 관련
    if (addr.startsWith("/-snap/")) {
        if (addr === "/-snap/load") return "Scene 로드";
        if (addr === "/-snap/save") return "Scene 저장";
        if (addr === "/-snap/name") return "Scene 이름";
        return "Scene 관련";
    }
    if (addr.startsWith("/-show/")) {
        if (addr.includes("/showfile/show/name")) return "Show 이름";
        if (addr.includes("/cue/")) return "Cue 정보";
        if (addr.includes("/scene/")) return "Show Scene 정보";
        if (addr.includes("/snippet/")) return "Snippet 정보";
        return "Show 관련";
    }

    // FX 관련
    if (addr.startsWith("/fx/") || addr.startsWith("/fxrtn/")) {
        return "이펙트 설정";
    }

    // Preferences 관련
    if (addr.startsWith("/-prefs/")) {
        return "콘솔 설정";
    }

    // Status 관련
    if (addr.startsWith("/-stat/")) {
        if (addr.includes("/solo")) return "Solo 상태";
        if (addr.includes("/tape/")) return "Recorder 상태";
        if (addr.includes("/urec/")) return "X-Live 상태";
        return "콘솔 상태";
    }

    // USB/UREC 관련
    if (addr.startsWith("/-usb/")) {
        return "USB 정보";
    }
    if (addr.startsWith("/-urec/")) {
        return "X-Live 레코더";
    }

    // 구독 응답 (alias)
    if (
        addr.startsWith("/") &&
        !addr.includes("ch") &&
        !addr.includes("bus") &&
        args.length === 0
    ) {
        return "구독 데이터";
    }

    return null; // 설명이 없으면 기본 출력
}

function initializeOSCPort() {
    udpPort = new osc.UDPPort({
        localAddress: "0.0.0.0",
        localPort: 0,
        metadata: true,
    });

    udpPort.on("ready", () => {
        console.log("OSC 포트 준비됨\n");
        startCommandPrompt();
    });

    udpPort.on("message", (oscMessage) => {
        console.log("\n← 응답 수신:", oscMessage.address);

        // 메시지 타입별 설명 출력
        const description = getMessageDescription(oscMessage);
        if (description) {
            console.log("  📋", description);
        }

        if (oscMessage.args && oscMessage.args.length > 0) {
            const values = oscMessage.args.map((arg) => {
                if (typeof arg === "object" && "value" in arg) {
                    return arg.value;
                }
                return arg;
            });
            console.log("  값:", values.join(", "));
        }
    });

    udpPort.on("error", (err) => {
        console.error("OSC 오류:", err);
    });

    // OSC 포트 열기
    udpPort.open();
}

// 프로그램 시작
initializeOSCPort();

// ===== 커맨드 전송 =====
function sendCommand(address, args = []) {
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

        // /xremote 명령 시 자동 keep-alive 시작 (10초 타임아웃이므로 9초마다 갱신)
        if (address === "/xremote") {
            if (xremoteTimer) {
                clearInterval(xremoteTimer);
            }
            console.log("→ /xremote keep-alive 활성화 (9초 간격)");
            console.log("");
            console.log("=".repeat(50));
            console.log("📡 RECEIVE MODE 활성화");
            console.log("M32 변경사항을 실시간으로 수신합니다.");
            console.log("나가려면 Ctrl+C 또는 'q' + Enter 를 누르세요.");
            console.log("=".repeat(50));
            console.log("");

            receiveMode = true;

            xremoteTimer = setInterval(() => {
                try {
                    udpPort.send(
                        { address: "/xremote", args: [] },
                        M32_IP,
                        M32_PORT,
                    );
                    console.log("→ /xremote (keep-alive)");
                } catch (e) {
                    console.error("keep-alive 전송 실패:", e.message);
                }
            }, 9000);
        }

        // /subscribe, /formatsubscribe, /batchsubscribe 추적
        if (address === "/subscribe" && args.length >= 2) {
            const cmd = args[0].value;
            subscriptions.set(cmd, { type: "subscribe", command: cmd });
            startRenewTimer();
            console.log(`→ 구독 추적: ${cmd}`);
        } else if (address === "/formatsubscribe" && args.length >= 2) {
            const alias = args[0].value;
            subscriptions.set(alias, { type: "formatsubscribe", alias });
            startRenewTimer();
            console.log(`→ 구독 추적: ${alias}`);
        } else if (address === "/batchsubscribe" && args.length >= 2) {
            const alias = args[0].value;
            subscriptions.set(alias, { type: "batchsubscribe", alias });
            startRenewTimer();
            console.log(`→ 구독 추적: ${alias}`);
        } else if (address === "/unsubscribe") {
            if (args.length === 0) {
                subscriptions.clear();
                console.log("→ 모든 구독 추적 해제");
            } else {
                const target = args[0].value;
                subscriptions.delete(target);
                console.log(`→ 구독 추적 해제: ${target}`);
            }
            if (subscriptions.size === 0 && renewTimer) {
                clearInterval(renewTimer);
                renewTimer = null;
                console.log("→ /renew 타이머 중지");
            }
        }
    } catch (e) {
        console.error("전송 실패:", e.message);
    }
}

// ===== 구독 갱신 타이머 시작 =====
function startRenewTimer() {
    if (renewTimer) return; // 이미 실행 중

    console.log("→ /renew 자동 갱신 활성화 (9초 간격)");
    renewTimer = setInterval(() => {
        if (subscriptions.size === 0) return;

        try {
            // /renew (인자 없음) = 모든 구독 갱신
            udpPort.send({ address: "/renew", args: [] }, M32_IP, M32_PORT);
            console.log(`→ /renew (구독 ${subscriptions.size}개 갱신)`);
        } catch (e) {
            console.error("/renew 전송 실패:", e.message);
        }
    }, 9000);
}

// ===== 커맨드 파싱 =====
function parseCommand(input) {
    input = input.trim();
    if (!input) return null;

    // 유니코드 정규화 및 ASCII 변환
    // 특수 하이픈/대시 문자들을 일반 하이픈으로 변환
    input = input.normalize("NFKC");
    input = input.replace(/[\u2010-\u2015\u2212]/g, "-");

    // 공백으로 분리
    const parts = input.split(/\s+/);
    const address = parts[0];

    // OSC 주소는 /로 시작해야 함
    if (!address.startsWith("/")) {
        console.error("오류: OSC 주소는 /로 시작해야 합니다");
        return null;
    }

    const args = [];

    // 나머지를 인자로 처리
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];

        // 정수 체크
        if (/^-?\d+$/.test(part)) {
            args.push({ type: "i", value: parseInt(part, 10) });
        }
        // 부동소수점 체크
        else if (/^-?\d*\.\d+$/.test(part)) {
            args.push({ type: "f", value: parseFloat(part) });
        }
        // 문자열
        else {
            args.push({ type: "s", value: part });
        }
    }

    return { address, args };
}

// ===== 대화형 프롬프트 =====
function startCommandPrompt() {
    console.log("\n사용법:");
    console.log("  OSC 주소와 인자를 입력하세요");
    console.log("  예: /ch/01/mix/fader 0.75");
    console.log("  예: /showfile/scene/010/load");
    console.log("  종료: exit 또는 Ctrl+C");
    console.log("");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "OSC> ",
    });

    currentReadline = rl;

    rl.prompt();

    rl.on("line", (line) => {
        const input = line.trim();

        // Receive mode에서 'q' 입력 시 나가기
        if (receiveMode && input === "q") {
            console.log("");
            console.log("=".repeat(50));
            console.log("🚫 RECEIVE MODE 종료");
            console.log("=".repeat(50));
            console.log("");
            receiveMode = false;
            rl.prompt();
            return;
        }

        // Receive mode에서는 명령 무시
        if (receiveMode) {
            return;
        }

        if (input === "exit" || input === "quit") {
            console.log("종료합니다.");
            if (xremoteTimer) clearInterval(xremoteTimer);
            if (renewTimer) clearInterval(renewTimer);
            rl.close();
            udpPort.close();
            logStream.end();
            process.exit(0);
        }

        if (input) {
            const cmd = parseCommand(input);
            if (cmd) {
                sendCommand(cmd.address, cmd.args);
            }
        }

        if (!receiveMode) {
            rl.prompt();
        }
    });

    rl.on("close", () => {
        console.log("\n종료합니다.");
        if (xremoteTimer) clearInterval(xremoteTimer);
        if (renewTimer) clearInterval(renewTimer);
        udpPort.close();
        logStream.end();
        process.exit(0);
    });
}
