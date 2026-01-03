const osc = require("osc");
const readline = require("readline");

// ===== 설정 =====
let M32_IP = process.env.M32_IP || "192.168.0.2";
let M32_PORT = parseInt(process.env.M32_PORT || "10023", 10);

console.log("=".repeat(50));
console.log("M32/X32 OSC Command Sender");
console.log("=".repeat(50));
console.log("");

// ===== OSC 포트 설정 =====
let udpPort = null;

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

// ===== 초기 설정 입력 =====
function promptSettings() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

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

            console.log("\n" + "=".repeat(50));
            console.log(`연결 대상: ${M32_IP}:${M32_PORT}`);
            console.log("=".repeat(50));
            console.log("");

            rl.close();
            initializeOSCPort();
        });
    });
}

// 프로그램 시작
promptSettings();

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
    } catch (e) {
        console.error("전송 실패:", e.message);
    }
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

    rl.prompt();

    rl.on("line", (line) => {
        const input = line.trim();

        if (input === "exit" || input === "quit") {
            console.log("종료합니다.");
            rl.close();
            udpPort.close();
            process.exit(0);
        }

        if (input) {
            const cmd = parseCommand(input);
            if (cmd) {
                sendCommand(cmd.address, cmd.args);
            }
        }

        rl.prompt();
    });

    rl.on("close", () => {
        console.log("\n종료합니다.");
        udpPort.close();
        process.exit(0);
    });
}
