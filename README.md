# AppForm — AI 폼 자동입력

<p align="center">
  <img src="public/icons/icon128.png" width="96" alt="AppForm icon"/>
</p>

<p align="center">
  AI가 웹 폼을 자동으로 채워주는 Chrome 사이드패널 익스텐션<br/>
  MiniMax · Claude · Gemini 지원 · 10개 언어 번역
</p>

---

## 주요 기능

- **폼 자동 감지** — 페이지를 스캔해 text, textarea, select, checkbox, radio 등 모든 필드 자동 인식
- **프리셋 관리** — 자주 쓰는 폼을 이름 붙여 저장, 선택 시 해당 URL로 자동 이동
- **AI 번역 자동입력** — 한국어로 입력해두고 영어·일본어·중국어 등 10개 언어로 번역 후 자동 입력
- **다중 AI 모델** — MiniMax M2.7 / Claude Haiku·Opus / Gemini 2.5 Flash 선택 가능
- **사이드패널 UI** — 페이지를 가리지 않고 옆에 고정된 패널로 사용

---

## 설치 방법

### Chrome Web Store (권장)
> 준비 중

### 직접 설치 (개발자 모드)

1. 이 저장소를 클론하거나 [Releases](https://github.com/yangahreum/appForm/releases)에서 zip 다운로드
2. 의존성 설치 및 빌드
   ```bash
   npm install
   npm run build
   ```
3. Chrome에서 `chrome://extensions` 열기
4. 우측 상단 **개발자 모드** 활성화
5. **압축해제된 확장 프로그램 로드** 클릭 → `dist/` 폴더 선택

---

## 사용 방법

### 1단계 — API 키 설정

1. 익스텐션 아이콘 클릭 → 사이드패널 열기
2. **설정** 탭 이동
3. 사용할 AI 모델 선택 후 해당 API 키 입력

| AI 모델 | API 키 발급 |
|---------|------------|
| MiniMax M2.7 | [MiniMax Platform](https://platform.minimax.io) |
| Claude Haiku / Opus | [Anthropic Console](https://console.anthropic.com/settings/api-keys) |
| Gemini 2.5 Flash | [Google AI Studio](https://aistudio.google.com/app/apikey) |

---

### 2단계 — 프리셋 만들기

1. 자동입력할 웹페이지로 이동
2. **폼 생성** 탭 → **페이지 스캔** 클릭
3. 감지된 필드 목록 확인 (라벨 수정 · 불필요한 필드 삭제 가능)
4. 입력 언어 선택 후 프리셋 이름 입력 → **저장**

> 필드가 자동 감지되지 않으면 **＋ 필드 추가**로 수동 등록 가능

---

### 3단계 — 자동입력

1. **정보 입력** 탭에서 저장된 프리셋 선택
   - 프리셋 선택 시 저장된 URL로 자동 이동
2. 각 필드에 값 입력 (입력값은 자동 저장됨)
3. 언어 드롭다운에서 적용 언어 선택
   - **직접 입력** — 번역 없이 그대로 적용
   - **언어 선택** — AI가 해당 언어로 번역 후 적용
   - 프리셋 저장 언어와 동일하면 번역 생략 (기본 표시)
4. **적용** 버튼 클릭

---

## 지원 언어

한국어 · English · 中文(简体) · 日本語 · Español · Français · العربية · हिन्दी · Português · Русский

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| UI | React 18 + TypeScript + Vite |
| 익스텐션 | Chrome Manifest V3 · Side Panel API |
| AI | MiniMax · Anthropic Claude · Google Gemini |
| 저장소 | chrome.storage.local |

---

## 개인정보처리방침

수집하는 데이터, AI API 전송 범위 등 자세한 내용은 [개인정보처리방침](PRIVACY_POLICY.md)을 확인하세요.

---

## 라이선스

MIT License
