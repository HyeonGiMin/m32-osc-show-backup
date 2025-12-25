# M32/X32 OSC Command Sender

Midas M32 또는 Behringer X32 콘솔에 OSC 커맨드를 직접 전송하는 프로그램입니다.

## 설치

```bash
npm install
```

## 실행

```bash
npm start
```

또는

```bash
node send.js
```

## 환경 변수

-   `M32_IP`: M32/X32 콘솔의 IP 주소 (기본값: `192.168.0.2`)
-   `M32_PORT`: OSC 포트 (기본값: `10023`)

예시:

```bash
M32_IP=192.168.1.100 M32_PORT=10023 npm start
```

## 사용법

프로그램을 실행하면 대화형 프롬프트가 나타납니다.

```
OSC> /ch/01/mix/fader 0.75
```

### OSC 커맨드 형식

```
/osc/주소 [인자1] [인자2] ...
```

-   OSC 주소는 `/`로 시작해야 합니다
-   인자는 자동으로 타입이 감지됩니다:
    -   정수: `1`, `-5`, `100`
    -   부동소수점: `0.75`, `-0.5`, `1.0`
    -   문자열: 그 외 모든 값

### 예시

```bash
# 페이더 조정
OSC> /ch/01/mix/fader 0.75

# 씬 로드
OSC> /showfile/scene/010/load

# 채널 이름 변경
OSC> /-snap/name MyScene

# 뮤트
OSC> /ch/01/mix/on 0

# 언뮤트
OSC> /ch/01/mix/on 1
```

## 종료

-   `exit` 입력
-   `quit` 입력
-   `Ctrl+C` 누르기

## 응답 확인

M32/X32에서 응답이 오면 자동으로 표시됩니다:

```
← 응답 수신: /ch/01/mix/fader
  값: 0.75
```

/‐show/showfile/scene/001/hasdata
/save scene 081 test test123
/delete scene 081
