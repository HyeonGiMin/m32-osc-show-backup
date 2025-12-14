# 🎛 M32 Show Auto Backup (OSC)

Raspberry Pi 또는 PC에서 **Behringer M32 콘솔의 Show를 주기적으로 자동 백업**하기 위한 프로젝트입니다.

-   Node.js (JavaScript)
-   OSC (UDP)
-   OS 무관 (Windows / Linux / Raspberry Pi OS)

---

## 🎯 목표

-   주기적으로 현재 상태를 **Show로 자동 저장**
-   Show 이름을 **날짜 기반으로 생성**
-   **최대 N개(기본 10개)**만 유지
-   오래된 Show 자동 삭제
-   콘솔 내부 메모리 사용 (USB 불필요)

---

## ⚙️ 요구 사항

-   Behringer **M32 / M32R / X32** 콘솔
-   같은 네트워크(LAN/Wi-Fi)에 연결된 PC 또는 Raspberry Pi
-   Node.js **LTS 이상**

---

## 📦 사용 기술

-   **Node.js**
-   **osc (UDP 기반 OSC 라이브러리)**
-   cron / Windows 작업 스케줄러

---

## 📁 프로젝트 구조

```
m32-show-backup/
 ├─ backup.js          # 메인 백업 스크립트
 ├─ shows.json         # 자동 백업된 Show 목록 관리 파일
 ├─ logs/
 │   └─ backup.log     # 실행 로그
 └─ README.md
```

---

## 🚀 설치 방법

### 1️⃣ Node.js 설치

```bash
node -v
npm -v
```

(Node.js가 없다면 LTS 버전 설치)

---

### 2️⃣ 프로젝트 생성 및 라이브러리 설치

```bash
mkdir m32-show-backup
cd m32-show-backup
npm init -y
npm install osc
```

---

## 🔧 설정 항목

`backup.js`에서 아래 값 수정

```js
const M32_IP = "192.168.1.100"; // M32 콘솔 IP
const M32_PORT = 10023; // 기본 OSC 포트
const MAX_SHOWS = 10; // 유지할 Show 개수
```

---

## 🧠 동작 방식

1. 현재 날짜 기준으로 Show 이름 생성

    ```
    auto_weekly_YYYY-MM-DD
    ```

2. OSC로 `/save/show` 명령 전송
3. `shows.json`에 기록
4. 최대 개수 초과 시 오래된 Show부터 `/delete/show`

⚠️ **Show 목록은 콘솔에서 조회할 수 없기 때문에**
외부(`shows.json`)에서 직접 관리합니다.

---

## 🧪 콘솔 없이 테스트하는 방법 (Mock)

```bash
node mock-server.js
```

-   로컬에서 OSC 메시지 수신 확인
-   실제 M32 없이 로직 검증 가능

---

## ⏰ 자동 실행 설정

### 🐧 Linux / Raspberry Pi (cron)

```bash
crontab -e
```

```bash
0 3 * * 0 /usr/bin/node /home/pi/m32-show-backup/backup.js
```

➡ 매주 일요일 03:00 실행

---

### 🪟 Windows (작업 스케줄러)

-   프로그램: `node.exe`
-   인수: `backup.js`
-   시작 위치: 프로젝트 폴더

---

## 🔒 운영 시 주의사항 (중요)

-   공연 중 **Show LOAD 금지**
-   자동 백업 Show는 `auto_weekly_` 접두사 사용 권장
-   수동 Show와 혼용 시 삭제 주의
-   월 1회 USB Export 권장

---

## ❌ 제한 사항

-   Show 목록 조회 불가 (OSC 미지원)
-   Show 파일 다운로드 불가
-   USB 저장 제어 불가

➡ 콘솔 내부 설계 제한

---

## 📌 권장 운영 전략

-   개발/테스트: Windows
-   무인 운영: Raspberry Pi
-   동일 코드 사용

---

## ✅ 한 줄 요약

> **M32 Show를 안전하게, 자동으로, 날짜 기반으로 백업하는 Node.js 프로젝트**

---

필요 시 확장 가능:

-   Scene 동시 저장
-   실패 시 재시도
-   Slack / Telegram 알림
-   dry-run 모드
