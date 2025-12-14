# M32 OSC Show Backup

Node.js 스크립트로 Behringer M32/X32 콘솔의 Show를 날짜 기반으로 자동 저장/보관합니다.

## 설치 및 실행

```cmd
cd /d d:\Study_Source\GitHub\m32Backup\m32-show-backup
npm install
npm start
```

## 환경 변수
- `M32_IP`: 콘솔 IP (기본 `127.0.0.1`)
- `M32_PORT`: OSC 포트 (기본 `10023`)
- `MAX_SHOWS`: 유지할 최대 Show 개수 (기본 `10`)
- `SHOW_PREFIX`: Show 이름 접두사 (기본 `auto_weekly_`)

## 동작
- `/save/show <name>` 전송 후 `shows.json`에 기록
- `MAX_SHOWS` 초과 시 오래된 Show부터 `/delete/show` 전송 후 목록 정리
- 로그는 `logs/backup.log`에 누적

## 테스트
Mock 서버 실행 후 스크립트 실행:
```cmd
cd /d d:\Study_Source\GitHub\m32Backup\mockup-server
npm start

cd /d d:\Study_Source\GitHub\m32Backup\m32-show-backup
npm start
```
