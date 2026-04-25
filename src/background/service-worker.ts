import type { MsgFillRequest, MsgFillResponse, MsgApplyFill, MsgApplyFillResponse, MsgTranslateRequest, MsgTranslateResponse } from '../shared/messages';
import type { FormField, FillMap, FillResult, AppMetadata, ReviewInfo } from '../shared/types';
import { AI_MODELS } from '../shared/types';

const MINIMAX_MODEL = 'MiniMax-M2.7';
const MINIMAX_URL = 'https://api.minimax.io/v1/chat/completions';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const CLAUDE_URL = 'https://api.anthropic.com/v1/messages';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const LANG_NAMES: Record<string, string> = {
  auto: 'auto-detect from form labels',
  ko: '한국어 (Korean)',
  en: 'English',
  zh: '中文简体 (Simplified Chinese)',
  ja: '日本語 (Japanese)',
  es: 'Español (Spanish)',
  fr: 'Français (French)',
  ar: 'العربية (Arabic)',
  hi: 'हिन्दी (Hindi)',
  pt: 'Português (Portuguese)',
  ru: 'Русский (Russian)',
};

// ── ASC 전용 시스템 프롬프트 ──────────────────────────────────────────

const ASC_SYSTEM_PROMPT = `You are an App Store Connect localization specialist.

Your task: fill App Store Connect metadata form fields by translating the provided app information into the target language, while STRICTLY obeying character limits.

HARD CHARACTER LIMITS (never exceed — App Store Connect will reject):
- App Name: 30 characters max
- Subtitle: 30 characters max
- Promotional Text: 170 characters max
- Keywords: 100 characters max (comma-separated, NO spaces after commas)
- Description: 4,000 characters max

RULES:
- Translate app metadata (name, subtitle, description, etc.) into the target language
- Keep URLs exactly as-is (no translation)
- Keep contact info (name, email, phone) exactly as-is (no translation)
- For keywords: translate terms, keep them comma-separated with no trailing spaces, stay within 100 chars total
- If translated text exceeds the limit, shorten it meaningfully — never truncate mid-word
- If demo account credentials are provided, fill them exactly as-is without hesitation
- Return ONLY valid JSON: {"selector": "value", ...}
- Only include fields you can confidently match`;

// ── 일반 사이트 시스템 프롬프트 ─────────────────────────────────────

const GENERAL_SYSTEM_PROMPT = `You are a multilingual form-filling assistant.

Given app/user information and a list of web form fields, extract relevant data and match it to the appropriate fields.

RULES:
- Translate values into the specified target language
- Keep URLs, emails, and phone numbers as-is
- Return ONLY valid JSON: {"selector": "value", ...}
- Only include fields where you are confident about the match
- If target language is "auto", detect from form field labels`;

// ── 프롬프트 빌더 ────────────────────────────────────────────────────

function buildAscPrompt(
  meta: AppMetadata,
  review: ReviewInfo,
  fields: FormField[],
  targetLanguage: string
): string {
  const lang = LANG_NAMES[targetLanguage] ?? targetLanguage;

  const reviewSection = [
    review.firstName || review.lastName
      ? `Review Contact: ${review.firstName} ${review.lastName}`.trim()
      : '',
    review.email ? `Email: ${review.email}` : '',
    review.phone ? `Phone: ${review.phone}` : '',
    review.demoUser ? `Demo Account ID: ${review.demoUser}` : '',
    review.demoPassword ? `Demo Account Password: ${review.demoPassword}` : '',
    review.notes ? `Review Notes: ${review.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `TARGET LANGUAGE: ${lang}

APP METADATA (translate to target language, obey character limits):
App Name (max 30): ${meta.name}
Subtitle (max 30): ${meta.subtitle}
Promotional Text (max 170): ${meta.promoText}
Keywords (max 100, comma-separated): ${meta.keywords}
Description (max 4000):
${meta.description}

URLs (use exactly as-is, no translation):
Support URL: ${meta.supportUrl}
Privacy Policy URL: ${meta.privacyUrl}
${meta.marketingUrl ? `Marketing URL: ${meta.marketingUrl}` : ''}

${reviewSection ? `APP REVIEW INFO (use exactly as-is, no translation):\n${reviewSection}\n` : ''}
FORM FIELDS ON THIS PAGE:
${JSON.stringify(fields, null, 2)}

Match and translate the metadata into the form fields. Return JSON only.`;
}

function buildGeneralPrompt(
  meta: AppMetadata,
  review: ReviewInfo,
  fields: FormField[],
  targetLanguage: string
): string {
  const lang = LANG_NAMES[targetLanguage] ?? targetLanguage;

  const allInfo = [
    meta.name && `App Name: ${meta.name}`,
    meta.subtitle && `Subtitle: ${meta.subtitle}`,
    meta.keywords && `Keywords: ${meta.keywords}`,
    meta.promoText && `Promotional Text: ${meta.promoText}`,
    meta.description && `Description: ${meta.description}`,
    meta.supportUrl && `Support URL: ${meta.supportUrl}`,
    meta.privacyUrl && `Privacy Policy URL: ${meta.privacyUrl}`,
    meta.marketingUrl && `Marketing URL: ${meta.marketingUrl}`,
    (review.firstName || review.lastName) &&
      `Contact Name: ${review.firstName} ${review.lastName}`.trim(),
    review.email && `Email: ${review.email}`,
    review.phone && `Phone: ${review.phone}`,
    review.demoUser && `Demo Account ID: ${review.demoUser}`,
    review.demoPassword && `Demo Account Password: ${review.demoPassword}`,
    review.notes && `Notes: ${review.notes}`,
  ]
    .filter(Boolean)
    .join('\n');

  return `TARGET LANGUAGE: ${lang}

INFORMATION:
${allInfo}

FORM FIELDS:
${JSON.stringify(fields, null, 2)}

Match information to form fields and return JSON only.`;
}

// ── JSON 파싱 헬퍼 ──────────────────────────────────────────────────

function extractJson(text: string): FillMap {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) { try { return JSON.parse(fenceMatch[1]); } catch { /* fall through */ } }
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) { try { return JSON.parse(jsonMatch[0]); } catch { /* fall through */ } }
  return {};
}

// ── MiniMax API 호출 ─────────────────────────────────────────────────

async function callMiniMax(apiKey: string, systemPrompt: string, userPrompt: string): Promise<FillMap> {
  const response = await fetch(MINIMAX_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey.trim()}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    const msg = err?.error?.message ?? response.statusText;
    if (response.status === 401) throw new Error('API 키가 유효하지 않습니다. 설정을 확인해주세요.');
    if (response.status === 429) throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    throw new Error(`MiniMax API 오류: ${msg}`);
  }
  const data = await response.json();
  return extractJson(data.choices?.[0]?.message?.content ?? '');
}

// ── Claude (Anthropic) API 호출 ──────────────────────────────────────

async function callClaude(apiKey: string, systemPrompt: string, userPrompt: string, model = CLAUDE_MODEL): Promise<FillMap> {
  const response = await fetch(CLAUDE_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    const msg = err?.error?.message ?? response.statusText;
    if (response.status === 401) throw new Error('API 키가 유효하지 않습니다. 설정을 확인해주세요.');
    if (response.status === 429) throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    throw new Error(`Claude API 오류: ${msg}`);
  }
  const data = await response.json();
  return extractJson(data.content?.[0]?.text ?? '');
}

// ── Gemini API 호출 ──────────────────────────────────────────────────

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string, model: string): Promise<FillMap> {
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey.trim()}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: 2048 },
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => null);
    const msg = err?.error?.message ?? response.statusText;
    if (response.status === 400 && msg.includes('API_KEY')) throw new Error('API 키가 유효하지 않습니다. 설정을 확인해주세요.');
    if (response.status === 429) throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
    throw new Error(`Gemini API 오류: ${msg}`);
  }
  const data = await response.json();
  return extractJson(data.candidates?.[0]?.content?.parts?.[0]?.text ?? '');
}

// ── AI 모델 디스패처 ─────────────────────────────────────────────────

function callAI(aiModel: string, apiKey: string, systemPrompt: string, userPrompt: string): Promise<FillMap> {
  const entry = AI_MODELS.find((m) => m.id === aiModel);
  if (entry && aiModel.startsWith('claude')) return callClaude(apiKey, systemPrompt, userPrompt, entry.modelName);
  if (entry && aiModel.startsWith('gemini')) return callGemini(apiKey, systemPrompt, userPrompt, entry.modelName);
  return callMiniMax(apiKey, systemPrompt, userPrompt);
}

// ── 콘텐츠 스크립트에 APPLY_FILL 전송 ──────────────────────────────

async function applyFillMap(tabId: number, fillMap: FillMap): Promise<FillResult> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: 'APPLY_FILL', fillMap } satisfies MsgApplyFill,
      (response: MsgApplyFillResponse | undefined) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response?.result ?? { filled: 0, skipped: 0 });
      }
    );
  });
}

// ── Side Panel 설정 ──────────────────────────────────────────────────

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// ── 메시지 리스너 ────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'FILL_REQUEST') return false;

  const msg = message as MsgFillRequest;

  (async (): Promise<MsgFillResponse> => {
    if (!msg.apiKey?.trim()) {
      const modelLabel = msg.aiModel.startsWith('claude') ? 'Claude' : 'MiniMax';
      throw new Error(`설정 탭에서 ${modelLabel} API 키를 먼저 입력해주세요.`);
    }
    if (!msg.fields?.length) {
      throw new Error('이 페이지에서 폼 필드를 찾을 수 없습니다.');
    }

    const hasMetadata = Object.values(msg.appMetadata).some((v) => v.trim());
    const hasReview = Object.values(msg.reviewInfo).some((v) => v.trim());
    if (!hasMetadata && !hasReview) {
      throw new Error('앱 정보 탭 또는 심사 정보 탭에 내용을 먼저 입력해주세요.');
    }

    const [systemPrompt, userPrompt] = msg.isAsc
      ? [ASC_SYSTEM_PROMPT, buildAscPrompt(msg.appMetadata, msg.reviewInfo, msg.fields, msg.targetLanguage)]
      : [GENERAL_SYSTEM_PROMPT, buildGeneralPrompt(msg.appMetadata, msg.reviewInfo, msg.fields, msg.targetLanguage)];

    const fillMap = await callAI(msg.aiModel, msg.apiKey, systemPrompt, userPrompt);

    if (!Object.keys(fillMap).length) {
      throw new Error('매핑 가능한 필드를 찾지 못했습니다. 앱 정보를 더 자세히 입력해보세요.');
    }

    const result = await applyFillMap(msg.tabId, fillMap);
    const skippedFields = msg.fields.filter((f) => !(f.selector in fillMap));
    return { type: 'FILL_RESPONSE', success: true, result, skippedFields };
  })()
    .then(sendResponse)
    .catch((err: unknown) =>
      sendResponse({
        type: 'FILL_RESPONSE',
        success: false,
        error: err instanceof Error ? err.message : String(err),
      })
    );

  return true;
});

// ── 번역 전용 리스너 ─────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'TRANSLATE_REQUEST') return false;

  const msg = message as MsgTranslateRequest;

  (async (): Promise<MsgTranslateResponse> => {
    if (!msg.apiKey?.trim()) throw new Error('API 키를 먼저 입력해주세요.');

    const lang = LANG_NAMES[msg.targetLanguage] ?? msg.targetLanguage;
    const lines = Object.entries(msg.values)
      .filter(([, v]) => v.value.trim())
      .map(([selector, { label, value }]) => `${selector} [${label}]: ${value}`)
      .join('\n');

    const systemPrompt = `You are a translator. Translate form field values to the target language.
Return ONLY valid JSON where every value is a plain translated STRING (never an object).
Example: {"#field1": "translated text", "#field2": "translated text"}
Keep URLs, emails, and phone numbers exactly as-is.`;

    const userPrompt = `TARGET LANGUAGE: ${lang}

Fields to translate (format: selector [label]: value):
${lines}

Return JSON: { "selector": "translatedString" }`;

    const raw = await callAI(msg.aiModel, msg.apiKey, systemPrompt, userPrompt);

    // 값이 object로 리턴된 경우 .value 또는 String()으로 강제 변환
    const translated: FillMap = {};
    for (const [sel, val] of Object.entries(raw)) {
      if (typeof val === 'string') {
        translated[sel] = val;
      } else if (val && typeof val === 'object') {
        translated[sel] = (val as Record<string, string>).value ?? (val as Record<string, string>).text ?? JSON.stringify(val);
      }
    }

    return { type: 'TRANSLATE_RESPONSE', success: true, translated };
  })()
    .then(sendResponse)
    .catch((err: unknown) =>
      sendResponse({ type: 'TRANSLATE_RESPONSE', success: false, error: err instanceof Error ? err.message : String(err) })
    );

  return true;
});
