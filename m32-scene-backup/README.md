# M32 Scene Backup

Node.js 스크립트로 Behringer M32/X32 콘솔의 Scene을 슬롯 80-99번에 롤링 방식으로 자동 저장합니다.

## 🎯 목표

- Scene을 **80-99번 슬롯(총 20개)**에 순환 저장
- 슬롯이 가득 차면 **80번부터 다시 덮어쓰기**
- 현재 슬롯 위치를 `scene-index.json`에서 추적
- 콘솔 내부 메모리 사용

## 📦 설치 및 실행

```cmd
cd /d d:\Study_Source\GitHub\m32Backup\m32-scene-backup
npm install
npm start
```

## 🔧 환경 변수

- `M32_IP`: 콘솔 IP (기본 `127.0.0.1`)
- `M32_PORT`: OSC 포트 (기본 `10023`)

## 🔄 동작 방식

1. `scene-index.json`에서 현재 슬롯 번호 로드 (초기값: 80)
2. `/-snap/save <slot>` OSC 명령으로 Scene 저장
3. 슬롯 번호를 +1 증가 (80→81→82...→99→80 순환)
4. 다음 슬롯 번호를 `scene-index.json`에 저장
5. 로그를 `logs/backup.log`에 기록

## ⏰ 자동 실행 설정

### 🐧 Linux / Raspberry Pi (cron)
```bash
crontab -e
```

```bash
# 매시간 정각에 실행
0 * * * * /usr/bin/node /home/pi/m32-scene-backup/backup.js
```

### 🪟 Windows (작업 스케줄러)
- 프로그램: `node.exe`
- 인수: `backup.js`
- 시작 위치: `d:\Study_Source\GitHub\m32Backup\m32-scene-backup`
- 트리거: 1시간마다 반복

## 🧪 테스트 (Mock 서버 사용)

```cmd
# Mock 서버 실행
cd /d d:\Study_Source\GitHub\m32Backup\mockup-server
npm start

# 백업 스크립트 실행 (다른 터미널)
cd /d d:\Study_Source\GitHub\m32Backup\m32-scene-backup
npm start
```

## 📋 슬롯 관리

- **슬롯 범위**: 80-99번 (총 20개)
- **롤링**: 99번 다음은 80번으로 순환
- **추적 파일**: `scene-index.json`

슬롯 범위를 변경하려면 `scene-index.json`의 `minSlot`, `maxSlot` 값을 수정하세요.

```json
{
  "currentSlot": 80,
  "minSlot": 80,
  "maxSlot": 99
}
```

## ⚠️ 주의사항

- 공연 중 **Scene LOAD 금지** (백업 슬롯 80-99번은 공연용으로 사용 안 함 권장)
- 수동으로 80-99번 슬롯 사용 시 백업과 충돌 가능
- 월 1회 USB Export 권장

## 🔒 제한 사항

- Scene 목록 조회 불가 (OSC 미지원)
- Scene 파일 다운로드 불가
- 콘솔 내부 설계 제한

## ✅ 한 줄 요약

> **M32/X32의 Scene을 슬롯 80-99번에 롤링 방식으로 자동 백업하는 Node.js 프로젝트**
