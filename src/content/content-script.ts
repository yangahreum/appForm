import type { MsgApplyFill, MsgApplyFillResponse, MsgScanFieldsResponse } from '../shared/messages';
import type { FormField, FillMap } from '../shared/types';

function getLabel(el: HTMLElement): string {
  // 1. <label for="id">
  if (el.id) {
    const label = document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(el.id)}"]`);
    if (label) return label.textContent?.trim() ?? '';
  }

  // 2. aria-labelledby
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const parts = labelledBy.split(' ').map((id) => document.getElementById(id)?.textContent?.trim()).filter(Boolean);
    if (parts.length) return parts.join(' ');
  }

  // 3. aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  // 4. Closest <label> ancestor (grab text nodes only, not input value)
  const closestLabel = el.closest('label');
  if (closestLabel) {
    return Array.from(closestLabel.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent?.trim())
      .filter(Boolean)
      .join(' ');
  }

  // 5. Previous sibling label
  const prev = el.previousElementSibling;
  if (prev?.tagName === 'LABEL') return prev.textContent?.trim() ?? '';

  // 6. Parent element text nodes
  const parentTextNodes = Array.from(el.parentElement?.childNodes ?? [])
    .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
    .map((n) => n.textContent?.trim())
    .join(' ');
  if (parentTextNodes) return parentTextNodes;

  return '';
}

function getUniqueSelector(el: HTMLElement): string {
  // Prefer unique #id
  if (el.id) {
    const escaped = `#${CSS.escape(el.id)}`;
    if (document.querySelectorAll(escaped).length === 1) return escaped;
  }

  // Try unique [name="x"]
  const name = el.getAttribute('name');
  if (name) {
    const sel = `${el.tagName.toLowerCase()}[name="${CSS.escape(name)}"]`;
    if (document.querySelectorAll(sel).length === 1) return sel;
  }

  // Build nth-of-type path up the DOM
  function buildPath(element: Element): string {
    if (!element.parentElement || element === document.documentElement) {
      return element.tagName.toLowerCase();
    }
    const siblings = Array.from(element.parentElement.children).filter(
      (c) => c.tagName === element.tagName
    );
    const idx = siblings.indexOf(element);
    const nth = siblings.length > 1 ? `:nth-of-type(${idx + 1})` : '';
    return `${buildPath(element.parentElement)} > ${element.tagName.toLowerCase()}${nth}`;
  }

  return buildPath(el);
}

function isVisible(el: HTMLElement): boolean {
  if (!el.offsetParent && el.tagName !== 'BODY') return false;
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function getMaxLength(el: HTMLElement): number | undefined {
  // 1. HTML maxlength 속성
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    if (el.maxLength > 0) return el.maxLength;
  }

  // 2. 근처 요소에서 "0/30" 또는 "최대 N자" 패턴 탐색
  const counterPattern = /\b(\d+)\s*\/\s*(\d+)\b/;
  const hintPattern = /최대\s*(\d+)\s*(?:자|글자|characters?)|max(?:imum)?\s*(\d+)\s*(?:char|글자|자)/i;

  const candidates: Element[] = [];
  if (el.nextElementSibling) candidates.push(el.nextElementSibling);
  if (el.previousElementSibling) candidates.push(el.previousElementSibling);
  const parent = el.parentElement;
  if (parent) {
    candidates.push(...Array.from(parent.children).filter((c) => c !== el));
    const grandParent = parent.parentElement;
    if (grandParent) {
      candidates.push(...Array.from(grandParent.children).filter((c) => c !== parent));
    }
  }

  for (const candidate of candidates) {
    const text = candidate.textContent?.trim() ?? '';
    const m1 = text.match(counterPattern);
    if (m1) {
      const num = parseInt(m1[2], 10); // "현재/최대" 중 최대값
      if (!isNaN(num) && num > 0) return num;
    }
    const m2 = text.match(hintPattern);
    if (m2) {
      const num = parseInt(m2[1] ?? m2[2], 10);
      if (!isNaN(num) && num > 0) return num;
    }
  }

  return undefined;
}

function scanFormFields(): FormField[] {
  const query = [
    'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=image]):not([type=file])',
    'textarea',
    'select',
  ].join(', ');

  return Array.from(document.querySelectorAll<HTMLElement>(query))
    .filter(isVisible)
    .map((el) => ({
      selector: getUniqueSelector(el),
      type: el.getAttribute('type') ?? el.tagName.toLowerCase(),
      label: getLabel(el),
      placeholder: el.getAttribute('placeholder') ?? '',
      name: el.getAttribute('name') ?? '',
      id: el.id ?? '',
      ariaLabel: el.getAttribute('aria-label') ?? '',
      options: el instanceof HTMLSelectElement
        ? Array.from(el.options).map((o) => ({ value: o.value, text: o.text.trim() }))
        : undefined,
      currentValue:
        el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')
          ? String(el.checked)
          : (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)
            ? el.value
            : undefined,
      radioValue: el instanceof HTMLInputElement && el.type === 'radio' ? el.value : undefined,
      maxLength: getMaxLength(el),
    }));
}

function highlightFilled(el: HTMLElement) {
  const origBg = el.style.backgroundColor;
  const origTransition = el.style.transition;
  el.style.transition = 'background-color 0.3s ease';
  el.style.backgroundColor = '#fef9c3';
  setTimeout(() => {
    el.style.backgroundColor = '#d1fae5';
    setTimeout(() => {
      el.style.transition = origTransition;
      el.style.backgroundColor = origBg;
    }, 1500);
  }, 300);
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descriptor?.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }
}

function fillField(el: HTMLElement, value: string): boolean {
  try {
    if (el instanceof HTMLSelectElement) {
      const option =
        Array.from(el.options).find((o) => o.value === value) ??
        Array.from(el.options).find((o) => o.textContent?.trim() === value);
      if (!option) return false;
      el.value = option.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
      const checked = value === 'true' || value === '1' || value.toLowerCase() === 'yes';
      el.checked = checked;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      // Use native value setter for React controlled component compatibility
      setNativeValue(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function applyFillMap(fillMap: FillMap): { filled: number; skipped: number } {
  let filled = 0;
  let skipped = 0;

  for (const [selector, value] of Object.entries(fillMap)) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) { skipped++; continue; }

    const success = fillField(el, value);
    if (success) {
      highlightFilled(el);
      filled++;
    } else {
      skipped++;
    }
  }

  return { filled, skipped };
}

// ── 언어 선택기 기반 언어 감지 ──────────────────────────────────────
//
// 페이지의 언어 선택 드롭다운(native select / custom ARIA dropdown)에서
// 현재 선택된 언어를 읽어 언어 코드로 반환합니다.

// 언어명 → 코드 매핑 (표시 텍스트 또는 value 값 기준)
const LANG_MAP: Record<string, string> = {
  '한국어': 'ko', 'korean': 'ko', 'ko': 'ko', 'ko-kr': 'ko',
  'english': 'en', '영어': 'en', 'en': 'en', 'en-us': 'en', 'en-gb': 'en',
  '中文': 'zh', '中文 (简体)': 'zh', 'chinese': 'zh', 'zh': 'zh', 'zh-cn': 'zh', 'zh-hans': 'zh',
  '日本語': 'ja', 'japanese': 'ja', 'ja': 'ja', 'ja-jp': 'ja',
  'español': 'es', 'spanish': 'es', 'es': 'es',
  'français': 'fr', 'french': 'fr', 'fr': 'fr',
  'العربية': 'ar', 'arabic': 'ar', 'ar': 'ar',
  'हिन्दी': 'hi', 'hindi': 'hi', 'hi': 'hi',
  'português': 'pt', 'portuguese': 'pt', 'pt': 'pt',
  'русский': 'ru', 'russian': 'ru', 'ru': 'ru',
};

function toLangCode(raw: string): string | null {
  const key = raw.toLowerCase().trim();
  if (LANG_MAP[key]) return LANG_MAP[key];
  // "한국어 (기본 언어)" 처럼 괄호 앞 텍스트만 뽑아서 재시도
  const bare = key.split('(')[0].trim();
  return LANG_MAP[bare] ?? null;
}

function detectPageLanguage(): string {
  // 1. Native <select> — 선택된 옵션의 value 또는 텍스트로 판별
  for (const select of Array.from(document.querySelectorAll<HTMLSelectElement>('select'))) {
    const selected = select.options[select.selectedIndex];
    if (!selected) continue;

    // value로 먼저 시도 (예: "ko", "en-US")
    const byValue = toLangCode(select.value) ?? toLangCode(select.value.split(/[-_]/)[0]);
    if (byValue) return byValue;

    // 옵션 표시 텍스트로 시도 (예: "English", "日本語")
    const byText = toLangCode(selected.textContent ?? '');
    if (byText) return byText;
  }

  // 2. ARIA custom dropdown — role="listbox" 안의 aria-selected="true" 항목
  const ariaSelected = document.querySelector<HTMLElement>(
    '[role="listbox"] [aria-selected="true"], [role="option"][aria-selected="true"]'
  );
  if (ariaSelected) {
    const code = toLangCode(ariaSelected.textContent ?? '')
      ?? toLangCode(ariaSelected.getAttribute('data-value') ?? '');
    if (code) return code;
  }

  // 3. <html lang=""> 속성 폴백
  const htmlLang = document.documentElement.lang;
  if (htmlLang) {
    return toLangCode(htmlLang) ?? htmlLang.split(/[-_]/)[0].toLowerCase();
  }

  return 'auto';
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SCAN_FIELDS') {
    const fields = scanFormFields();
    const detectedLanguage = detectPageLanguage();
    sendResponse({ type: 'SCAN_FIELDS_RESPONSE', fields, detectedLanguage } satisfies MsgScanFieldsResponse);
    return false;
  }

  if (message.type === 'APPLY_FILL') {
    const result = applyFillMap((message as MsgApplyFill).fillMap);
    sendResponse({ type: 'APPLY_FILL_RESPONSE', result } satisfies MsgApplyFillResponse);
    return false;
  }
});
