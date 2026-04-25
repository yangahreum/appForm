# 개인정보처리방침 / Privacy Policy

**최종 업데이트: 2025년 4월 25일**
**Last Updated: April 25, 2025**

---

## 한국어

### 1. 개요

AppForm(이하 "익스텐션")은 웹 폼 자동입력을 지원하는 Chrome 브라우저 익스텐션입니다. 본 방침은 익스텐션이 수집·사용·저장하는 데이터에 대해 설명합니다.

### 2. 수집하는 데이터

#### 로컬 저장 데이터 (기기 내 저장, 외부 전송 없음)
| 데이터 | 목적 |
|--------|------|
| AI API 키 (MiniMax, Claude, Gemini) | 사용자가 선택한 AI 서비스 호출 |
| 폼 프리셋 (필드 정의) | 자주 사용하는 폼 구조 저장 |
| 프리셋별 입력값 | 자동입력에 사용할 값 저장 |
| 마지막 선택 프리셋 ID | UX 편의를 위한 상태 유지 |
| AI 모델 선택 / 언어 설정 | 사용자 설정 유지 |

위 데이터는 모두 **사용자의 기기 내 `chrome.storage.local`에만 저장**되며, 익스텐션 개발자 또는 제3자 서버로 전송되지 않습니다.

#### AI API로 전송되는 데이터 (번역·자동입력 기능 사용 시)
사용자가 AI 번역 기능을 사용할 경우, 사용자가 직접 입력한 폼 값과 필드 레이블이 사용자 본인이 선택한 AI 서비스(MiniMax / Anthropic Claude / Google Gemini)로 전송됩니다.

- 전송 주체: 사용자 본인
- 전송 대상: 사용자가 설정한 API 키의 소유 서비스
- 익스텐션 개발자는 이 데이터를 수신·저장하지 않습니다.

### 3. 수집하지 않는 데이터

익스텐션은 다음 데이터를 **수집하지 않습니다**:

- 이름, 이메일, 전화번호 등 개인 식별 정보
- 브라우저 방문 기록 또는 검색 기록
- 위치 정보
- 결제 또는 금융 정보
- 사용 통계, 분석 데이터
- 사용자 행동 추적 데이터

### 4. 제3자 서비스

AI 번역 기능 사용 시 아래 제3자 서비스와 통신할 수 있습니다. 각 서비스의 개인정보처리방침을 확인하세요:

- [MiniMax](https://www.minimaxi.com/privacy-policy)
- [Anthropic (Claude)](https://www.anthropic.com/privacy)
- [Google (Gemini)](https://policies.google.com/privacy)

### 5. 데이터 보관 및 삭제

모든 로컬 데이터는 사용자가 직접 삭제할 수 있습니다:
- Chrome 설정 → 익스텐션 → AppForm → 데이터 지우기
- 또는 익스텐션을 제거하면 모든 로컬 데이터가 삭제됩니다.

### 6. 보안

API 키는 사용자 기기의 로컬 스토리지에만 저장되며 암호화된 채널(HTTPS)을 통해서만 AI 서비스로 전달됩니다. 익스텐션 개발자는 API 키에 접근할 수 없습니다.

### 7. 아동 개인정보

본 익스텐션은 13세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 의도적으로 수집하지 않습니다.

### 8. 방침 변경

방침이 변경될 경우 이 페이지를 업데이트하며, 중요한 변경 사항은 익스텐션 업데이트 노트를 통해 안내합니다.

### 9. 문의

개인정보 관련 문의: yabgareum@gmail.com

---

## English

### 1. Overview

AppForm is a Chrome browser extension that helps users automatically fill web forms. This policy describes what data the extension collects, uses, and stores.

### 2. Data We Collect

#### Locally Stored Data (stored on device only, never transmitted to our servers)
| Data | Purpose |
|------|---------|
| AI API Keys (MiniMax, Claude, Gemini) | To call the AI service chosen by the user |
| Form Presets (field definitions) | To save frequently used form structures |
| Preset input values | To store values for auto-fill |
| Last selected preset ID | To maintain UI state |
| AI model / language settings | To persist user preferences |

All of the above data is stored **only in `chrome.storage.local` on the user's device** and is never transmitted to the extension developer or any third-party server.

#### Data Sent to AI APIs (only when using translation/AI fill features)
When a user uses the AI translation feature, the form values and field labels entered by the user are sent to the AI service (MiniMax / Anthropic Claude / Google Gemini) selected by the user.

- The user initiates all transmissions.
- Data is sent only to the service corresponding to the user's own API key.
- The extension developer does not receive or store this data.

### 3. Data We Do NOT Collect

The extension does **not** collect:

- Personally identifiable information (name, email, phone number, etc.)
- Browsing history or search history
- Location data
- Payment or financial information
- Usage statistics or analytics
- User behavior tracking data

### 4. Third-Party Services

When using AI features, the extension may communicate with the following third-party services. Please review their respective privacy policies:

- [MiniMax](https://www.minimaxi.com/privacy-policy)
- [Anthropic (Claude)](https://www.anthropic.com/privacy)
- [Google (Gemini)](https://policies.google.com/privacy)

### 5. Data Retention and Deletion

All local data can be deleted by the user at any time:
- Chrome Settings → Extensions → AppForm → Clear Data
- Or uninstalling the extension will remove all locally stored data.

### 6. Security

API keys are stored only in local storage on the user's device and are transmitted to AI services only through encrypted channels (HTTPS). The extension developer has no access to API keys.

### 7. Children's Privacy

This extension is not directed at children under the age of 13, and we do not knowingly collect personal information from children.

### 8. Changes to This Policy

If this policy changes, this page will be updated. Significant changes will be communicated through extension update notes.

### 9. Contact

For privacy-related inquiries: yabgareum@gmail.com
