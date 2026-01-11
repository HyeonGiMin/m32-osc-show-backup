#!/usr/bin/env node

const readline = require("readline");
const path = require("path");
const fs = require("fs");

// ===== 로깅 설정 =====
const LOG_DIR = path.join(process.cwd(), "log");
const LOG_START = new Date();
const LOG_BASENAME = LOG_START.toISOString().replace(/[:.]/g, "-");
const LOG_FILE = path.join(LOG_DIR, `m32-console-${LOG_BASENAME}.log`);
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

// ===== OSC 메시지 라이브러리 로드 =====
let oscMessages = null;
try {
    oscMessages = require("../m32-backup-scheduler/oscMessages.js");
} catch (e) {
    console.error("OSC 메시지 라이브러리를 로드할 수 없습니다:", e.message);
    process.exit(1);
}

// ===== UI 상수 =====
const CLEAR = "\x1B[2J\x1B[0f";
const COLORS = {
    RESET: "\x1b[0m",
    BOLD: "\x1b[1m",
    DIM: "\x1b[2m",
    CYAN: "\x1b[36m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    RED: "\x1b[31m",
    BLUE: "\x1b[34m",
    MAGENTA: "\x1b[35m",
};

// ===== M32 연결 설정 =====
let M32_IP = "192.168.0.2";
let M32_PORT = 10023;

// ===== 메인 메뉴 =====
async function showMainMenu() {
    console.clear();
    console.log("");
    console.log(
        COLORS.BOLD +
            COLORS.CYAN +
            "╔════════════════════════════════════════════╗" +
            COLORS.RESET,
    );
    console.log(
        COLORS.BOLD +
            COLORS.CYAN +
            "║      M32/X32 OSC Console 프로그램         ║" +
            COLORS.RESET,
    );
    console.log(
        COLORS.BOLD +
            COLORS.CYAN +
            "╚════════════════════════════════════════════╝" +
            COLORS.RESET,
    );
    console.log("");
    console.log(COLORS.BOLD + "  메뉴를 선택하세요:" + COLORS.RESET);
    console.log("");
    console.log(COLORS.GREEN + "  1. OSC 메시지 리스트" + COLORS.RESET);
    console.log("     → 지원되는 모든 OSC 경로와 설명을 조회");
    console.log("");
    console.log(COLORS.BLUE + "  2. XRemote 리시버 모드" + COLORS.RESET);
    console.log("     → M32에서 오는 변경사항을 실시간으로 수신");
    console.log("");
    console.log(COLORS.YELLOW + "  3. 커맨드 모드" + COLORS.RESET);
    console.log("     → OSC 명령어를 직접 입력하여 M32 제어");
    console.log("");
    console.log(COLORS.RED + "  0. 종료" + COLORS.RESET);
    console.log("");

    return await getUserChoice();
}

function getUserChoice() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(COLORS.BOLD + "선택 (0-3): " + COLORS.RESET, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// ===== OSC 메시지 설명 맵 =====
const OSC_DESCRIPTIONS = {
    // System
    "/info": "콘솔 기본 정보 조회",
    "/xinfo": "콘솔 상세 정보 조회",
    "/status": "콘솔 상태 정보 조회",
    "/xremote": "XRemote 활성화 (실시간 수신)",
    "/renew": "구독 갱신 (10초 타임아웃 재설정)",

    // Channel
    "/ch/{ch}/config/name": "채널 이름 설정",
    "/ch/{ch}/mix/fader": "채널 페이더 (0.0-1.0)",
    "/ch/{ch}/mix/mute": "채널 뮤트 (0/1)",
    "/ch/{ch}/mix/on": "채널 On/Off (0/1)",
    "/ch/{ch}/mix/pan": "채널 Pan (-1.0 ~ 1.0)",
    "/ch/{ch}/preamp/trim": "프리앰프 트림",
    "/ch/{ch}/preamp/invert": "위상 반전 (0/1)",
    "/ch/{ch}/gate/on": "채널 Gate On/Off",
    "/ch/{ch}/dyn/on": "채널 Compressor On/Off",
    "/ch/{ch}/eq/on": "채널 EQ On/Off",

    // Bus
    "/bus/{bus}/config/name": "버스 이름 설정",
    "/bus/{bus}/mix/fader": "버스 페이더 (0.0-1.0)",
    "/bus/{bus}/mix/mute": "버스 뮤트 (0/1)",
    "/bus/{bus}/mix/on": "버스 On/Off (0/1)",
    "/bus/{bus}/mix/pan": "버스 Pan (-1.0 ~ 1.0)",

    // DCA
    "/dca/{dca}/config/name": "DCA 이름 설정",
    "/dca/{dca}/fader": "DCA 페이더 (0.0-1.0)",
    "/dca/{dca}/on": "DCA On/Off (0/1)",

    // Main
    "/main/st/mix/fader": "Main Stereo 페이더",
    "/main/st/mix/mute": "Main Stereo 뮤트",
    "/main/st/mix/on": "Main Stereo On/Off",
    "/main/m/mix/fader": "Main Mono 페이더",
    "/main/m/mix/mute": "Main Mono 뮤트",
    "/main/m/mix/on": "Main Mono On/Off",

    // Scene/Show
    "/-snap/load": "씬 로드 (인자: 번호 0-99)",
    "/-snap/save": "씬 저장",
    "/-snap/name": "씬 이름 조회",
    "/-show/showfile/show/name": "Show 이름 설정",
    "/-show/showfile/cue/{cue}/name": "Cue 이름 설정",
    "/-show/showfile/scene/{scene}/name": "Scene 이름 설정",

    // Subscription
    "/subscribe": "OSC 경로 구독 시작",
    "/formatsubscribe": "포맷된 구독 시작",
    "/batchsubscribe": "배치 구독 시작",
    "/unsubscribe": "구독 중지",

    // FX
    "/fx/{fx}/type": "FX 유형 설정",
    "/fx/{fx}/on": "FX On/Off",
    "/fxrtn/{fx}/mix/fader": "FX Return 페이더",

    // Output
    "/output/{out}/src": "Output 소스 설정",
    "/outputs/main/{out}/src": "Main Output 소스 설정",

    // Preferences
    "/-prefs/style": "콘솔 스타일 설정",
    "/-prefs/bright": "디스플레이 밝기",
    "/-prefs/ip/dhcp": "DHCP 설정",

    // USB
    "/-usb/path": "USB 경로",
    "/-usb/dir/dirpos": "USB 디렉토리 위치",

    // Status
    "/-stat/solo": "Solo 상태",
    "/-stat/solosw/{ch}": "채널 Solo 스위치",
    "/-stat/tape/state": "Tape Recorder 상태",
    "/-stat/urec/state": "X-Live 레코더 상태",

    // Action
    "/-action/initall": "전체 초기화",
    "/-action/savestate": "상태 저장",
    "/-action/doundo": "Undo 실행",
    "/-action/clearsolo": "Solo 모두 해제",

    // UREC (X-Live)
    "/-urec/rec/state": "X-Live 레코킹 상태",
    "/-urec/rec/format": "X-Live 포맷",
};

// ===== 1. OSC 메시지 리스트 =====
async function showOSCMessageList() {
    console.clear();
    console.log("");
    console.log(
        COLORS.BOLD +
            COLORS.CYAN +
            "════════════════════════════════════════════" +
            COLORS.RESET,
    );
    console.log(
        COLORS.BOLD + COLORS.CYAN + "         OSC 메시지 리스트" + COLORS.RESET,
    );
    console.log(
        COLORS.BOLD +
            COLORS.CYAN +
            "════════════════════════════════════════════" +
            COLORS.RESET,
    );
    console.log("");

    // oscMessages.js에서 상수들을 동적으로 추출
    const categories = buildOSCCategories();

    for (const [key, category] of Object.entries(categories)) {
        console.log(COLORS.BOLD + category.title + COLORS.RESET);
        for (const item of category.items) {
            console.log(
                COLORS.DIM +
                    "  • " +
                    COLORS.RESET +
                    COLORS.YELLOW +
                    item.addr +
                    COLORS.RESET,
            );
            console.log("    " + COLORS.DIM + item.desc + COLORS.RESET);
        }
        console.log("");
    }

    console.log(
        COLORS.DIM +
            "(" +
            "Ctrl+C 로 돌아가기, 또는 다른 키를 누르세요" +
            ")" +
            COLORS.RESET,
    );
    await pressAnyKey();
}

function pressAnyKey() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("", () => {
            rl.close();
            resolve();
        });
    });
}

// ===== OSC 카테고리 동적 생성 함수 =====
function buildOSCCategories() {
    return {
        SYSTEM: {
            title: "🔧 시스템",
            items: [
                { addr: "/info", desc: oscMessages.SYSTEM.INFO },
                { addr: "/xinfo", desc: oscMessages.SYSTEM.XINFO },
                { addr: "/status", desc: oscMessages.SYSTEM.STATUS },
                { addr: "/xremote", desc: "XRemote 활성화 (실시간 수신)" },
                { addr: "/renew", desc: "구독 갱신 (10초 타임아웃 재설정)" },
            ].map((item) => ({
                addr: item.addr,
                desc: OSC_DESCRIPTIONS[item.addr] || item.desc,
            })),
        },
        CHANNEL: {
            title: "🎚️ 채널 (입력)",
            items: [
                { addr: "/ch/{ch}/config/name", key: "name" },
                { addr: "/ch/{ch}/mix/fader", key: "fader" },
                { addr: "/ch/{ch}/mix/mute", key: "mute" },
                { addr: "/ch/{ch}/mix/on", key: "on" },
                { addr: "/ch/{ch}/mix/pan", key: "pan" },
                { addr: "/ch/{ch}/preamp/trim", key: "trim" },
                { addr: "/ch/{ch}/preamp/invert", key: "invert" },
                { addr: "/ch/{ch}/gate/on", key: "gate_on" },
                { addr: "/ch/{ch}/dyn/on", key: "dyn_on" },
                { addr: "/ch/{ch}/eq/on", key: "eq_on" },
            ].map((item) => ({
                addr: item.addr,
                desc: OSC_DESCRIPTIONS[item.addr] || "채널 설정",
            })),
        },
        BUS: {
            title: "🚌 버스 (믹싱)",
            items: [
                { addr: "/bus/{bus}/config/name" },
                { addr: "/bus/{bus}/mix/fader" },
                { addr: "/bus/{bus}/mix/mute" },
                { addr: "/bus/{bus}/mix/on" },
                { addr: "/bus/{bus}/mix/pan" },
            ].map((item) => ({
                addr: item.addr,
                desc: OSC_DESCRIPTIONS[item.addr] || "버스 설정",
            })),
        },
        DCA: {
            title: "📊 DCA (동적 제어)",
            items: [
                { addr: "/dca/{dca}/config/name" },
                { addr: "/dca/{dca}/fader" },
                { addr: "/dca/{dca}/on" },
            ].map((item) => ({
                addr: item.addr,
                desc: OSC_DESCRIPTIONS[item.addr] || "DCA 설정",
            })),
        },
        MAIN: {
            title: "🔊 메인 출력",
            items: [
                { addr: "/main/st/mix/fader" },
                { addr: "/main/st/mix/mute" },
                { addr: "/main/st/mix/on" },
                { addr: "/main/m/mix/fader" },
                { addr: "/main/m/mix/mute" },
                { addr: "/main/m/mix/on" },
            ].map((item) => ({
                addr: item.addr,
                desc: OSC_DESCRIPTIONS[item.addr] || "메인 출력 설정",
            })),
        },
        SCENE_SHOW: {
            title: "🎬 씬/쇼 (Snapshot/Show)",
            items: [
                { addr: "/-snap/load" },
                { addr: "/-snap/save" },
                { addr: "/-snap/name" },
                { addr: "/-show/showfile/show/name" },
                { addr: "/-show/showfile/cue/{cue}/name" },
                { addr: "/-show/showfile/scene/{scene}/name" },
            ].map((item) => ({
                addr: item.addr,
                desc: OSC_DESCRIPTIONS[item.addr] || "씬/쇼 설정",
            })),
        },
        FX_OUTPUT: {
            title: "🎚️ 이펙트/출력 (FX/Output)",
            items: [
                { addr: "/fx/{fx}/type" },
                { addr: "/fx/{fx}/on" },
                { addr: "/fxrtn/{fx}/mix/fader" },
                { addr: "/output/{out}/src" },
                { addr: "/outputs/main/{out}/src" },
            ].map((item) => ({
                addr: item.addr,
                desc: OSC_DESCRIPTIONS[item.addr] || "FX/출력 설정",
            })),
        },
        SUBSCRIPTION: {
            title: "📡 구독 (구독 시스템)",
            items: [
                { addr: "/subscribe" },
                { addr: "/formatsubscribe" },
                { addr: "/batchsubscribe" },
                { addr: "/unsubscribe" },
            ].map((item) => ({
                addr: item.addr,
                desc: OSC_DESCRIPTIONS[item.addr] || "구독 설정",
            })),
        },
        PREFS_USB: {
            title: "⚙️ 설정/USB (Preferences/USB)",
            items: [
                { addr: "/-prefs/style" },
                { addr: "/-prefs/bright" },
                { addr: "/-prefs/ip/dhcp" },
                { addr: "/-usb/path" },
                { addr: "/-usb/dir/dirpos" },
            ].map((item) => ({
                addr: item.addr,
                desc: OSC_DESCRIPTIONS[item.addr] || "설정/USB",
            })),
        },
        STATUS_ACTION: {
            title: "📊 상태/액션 (Status/Action)",
            items: [
                { addr: "/-stat/solo" },
                { addr: "/-stat/solosw/{ch}" },
                { addr: "/-stat/tape/state" },
                { addr: "/-stat/urec/state" },
                { addr: "/-action/initall" },
                { addr: "/-action/savestate" },
                { addr: "/-action/clearsolo" },
                { addr: "/-urec/rec/state" },
            ].map((item) => ({
                addr: item.addr,
                desc: OSC_DESCRIPTIONS[item.addr] || "상태/액션",
            })),
        },
    };
}

// ===== 2. XRemote 리시버 모드 =====
async function launchXRemoteMode() {
    console.clear();
    console.log("");
    console.log(
        COLORS.BOLD +
            COLORS.BLUE +
            "════════════════════════════════════════════" +
            COLORS.RESET,
    );
    console.log(
        COLORS.BOLD +
            COLORS.BLUE +
            "     XRemote 리시버 모드 시작" +
            COLORS.RESET,
    );
    console.log(
        COLORS.BOLD +
            COLORS.BLUE +
            "════════════════════════════════════════════" +
            COLORS.RESET,
    );
    console.log("");
    console.log(COLORS.GREEN + "✓ 연결 설정" + COLORS.RESET);
    console.log(`  IP: ${M32_IP}, Port: ${M32_PORT}`);
    console.log("");
    console.log(COLORS.CYAN + "XRemote 모드로 전환합니다..." + COLORS.RESET);
    console.log("");

    // send.js의 XRemote 모드 실행
    setTimeout(() => {
        const { spawn } = require("child_process");
        const sendProcess = spawn("node", ["send.js"], {
            cwd: __dirname,
            stdio: "inherit",
            env: {
                ...process.env,
                M32_IP,
                M32_PORT: M32_PORT.toString(),
            },
        });

        sendProcess.on("close", () => {
            console.log("");
            console.log(
                COLORS.YELLOW + "XRemote 모드를 종료했습니다." + COLORS.RESET,
            );
            setTimeout(() => main(), 1000);
        });
    }, 500);
}

// ===== 3. 커맨드 모드 =====
async function launchCommandMode() {
    console.clear();
    console.log("");
    console.log(
        COLORS.BOLD +
            COLORS.YELLOW +
            "════════════════════════════════════════════" +
            COLORS.RESET,
    );
    console.log(
        COLORS.BOLD + COLORS.YELLOW + "        커맨드 모드 시작" + COLORS.RESET,
    );
    console.log(
        COLORS.BOLD +
            COLORS.YELLOW +
            "════════════════════════════════════════════" +
            COLORS.RESET,
    );
    console.log("");
    console.log(COLORS.GREEN + "✓ 연결 설정" + COLORS.RESET);
    console.log(`  IP: ${M32_IP}, Port: ${M32_PORT}`);
    console.log("");
    console.log(COLORS.CYAN + "커맨드 모드로 전환합니다..." + COLORS.RESET);
    console.log("");

    // send.js의 커맨드 모드 실행
    setTimeout(() => {
        const { spawn } = require("child_process");
        const sendProcess = spawn("node", ["send.js"], {
            cwd: __dirname,
            stdio: "inherit",
            env: {
                ...process.env,
                M32_IP,
                M32_PORT: M32_PORT.toString(),
            },
        });

        sendProcess.on("close", () => {
            console.log("");
            console.log(
                COLORS.YELLOW + "커맨드 모드를 종료했습니다." + COLORS.RESET,
            );
            setTimeout(() => main(), 1000);
        });
    }, 500);
}

// ===== 메인 루프 =====
async function main() {
    try {
        const choice = await showMainMenu();

        switch (choice) {
            case "1":
                await showOSCMessageList();
                await main();
                break;

            case "2":
                await launchXRemoteMode();
                break;

            case "3":
                await launchCommandMode();
                break;

            case "0":
                console.log("");
                console.log(
                    COLORS.GREEN + "프로그램을 종료합니다." + COLORS.RESET,
                );
                console.log("");
                logStream.end();
                process.exit(0);
                break;

            default:
                console.log(COLORS.RED + "잘못된 선택입니다." + COLORS.RESET);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                await main();
                break;
        }
    } catch (error) {
        console.error("오류 발생:", error.message);
        logStream.end();
        process.exit(1);
    }
}

// ===== 초기 설정 입력 =====
async function promptInitialSettings() {
    console.clear();
    console.log("");
    console.log(
        COLORS.BOLD +
            COLORS.CYAN +
            "╔════════════════════════════════════════════╗" +
            COLORS.RESET,
    );
    console.log(
        COLORS.BOLD +
            COLORS.CYAN +
            "║      M32/X32 OSC Console 프로그램         ║" +
            COLORS.RESET,
    );
    console.log(
        COLORS.BOLD +
            COLORS.CYAN +
            "╚════════════════════════════════════════════╝" +
            COLORS.RESET,
    );
    console.log("");
    console.log(COLORS.BOLD + "  연결 설정" + COLORS.RESET);
    console.log("");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(`M32/X32 IP 주소 (기본값: ${M32_IP}): `, (ip) => {
            if (ip.trim()) {
                M32_IP = ip.trim();
            }

            rl.question(`OSC 포트 (기본값: ${M32_PORT}): `, (port) => {
                if (port.trim()) {
                    const parsedPort = parseInt(port.trim(), 10);
                    if (!isNaN(parsedPort)) {
                        M32_PORT = parsedPort;
                    }
                }

                console.log("");
                console.log(COLORS.GREEN + "✓ 설정 완료" + COLORS.RESET);
                console.log(`  IP: ${M32_IP}`);
                console.log(`  Port: ${M32_PORT}`);
                console.log("");

                rl.close();
                resolve();
            });
        });
    });
}

// ===== 프로그램 시작 =====
process.on("SIGINT", () => {
    console.log("");
    console.log(COLORS.YELLOW + "프로그램을 종료합니다." + COLORS.RESET);
    console.log("");
    logStream.end();
    process.exit(0);
});

(async () => {
    await promptInitialSettings();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await main();
})();
