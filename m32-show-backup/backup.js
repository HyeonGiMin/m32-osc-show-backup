const fs = require('fs');
const path = require('path');
const osc = require('osc');

// ===== 설정 =====
const M32_IP = process.env.M32_IP || '127.0.0.1'; // 실제 운영 시 M32 콘솔 IP 입력
const M32_PORT = parseInt(process.env.M32_PORT || '10023', 10);
const MAX_SHOWS = parseInt(process.env.MAX_SHOWS || '10', 10);
const SHOW_PREFIX = process.env.SHOW_PREFIX || 'auto_weekly_';

const ROOT = __dirname;
const LOG_DIR = path.join(ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'backup.log');
const SHOWS_FILE = path.join(ROOT, 'shows.json');

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

function loadShows() {
  if (!fs.existsSync(SHOWS_FILE)) return [];
  try {
    const data = fs.readFileSync(SHOWS_FILE, 'utf8');
    const arr = JSON.parse(data);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch (e) {
    log(`WARN: shows.json 읽기 실패: ${e.message}`);
    return [];
  }
}

function saveShows(list) {
  try {
    fs.writeFileSync(SHOWS_FILE, JSON.stringify(list, null, 2));
  } catch (e) {
    log(`ERROR: shows.json 저장 실패: ${e.message}`);
  }
}

function makeShowName() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${SHOW_PREFIX}${yyyy}-${mm}-${dd}`;
}

// ===== OSC 포트 =====
const udpPort = new osc.UDPPort({
  localAddress: '0.0.0.0', // 수신용 (필요 시 변경 가능)
  localPort: 0,            // 임시 포트 바인딩
  metadata: true
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

async function main() {
  ensureDirs();
  log('=== M32 Show 자동 백업 시작 ===');
  log(`TARGET ${M32_IP}:${M32_PORT}, MAX_SHOWS=${MAX_SHOWS}`);

  const shows = loadShows();
  const showName = makeShowName();

  // 저장 요청
  log(`SAVE 요청: ${showName}`);
  await sendOSC('/save/show', [{ type: 's', value: showName }]);

  // 로컬 목록 업데이트 (최신 우선)
  const entry = { name: showName, savedAt: new Date().toISOString() };
  shows.push(entry);
  saveShows(shows);
  log(`저장 완료: ${showName}`);

  // 개수 제한 처리
  if (shows.length > MAX_SHOWS) {
    const overflow = shows.length - MAX_SHOWS;
    const toDelete = shows.slice(0, overflow); // 오래된 것부터 (앞쪽)

    for (const s of toDelete) {
      log(`DELETE 요청: ${s.name}`);
      await sendOSC('/delete/show', [{ type: 's', value: s.name }]);
      log(`삭제 완료: ${s.name}`);
    }

    const remain = shows.slice(overflow);
    saveShows(remain);
    log(`정리 완료: 남은 개수 ${remain.length}`);
  }

  log('=== 백업 스크립트 완료 ===');
}

udpPort.on('ready', () => {
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

udpPort.on('error', (err) => {
  log(`OSC 포트 에러: ${err.message}`);
});

udpPort.open();
