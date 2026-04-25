import { useState, useEffect, useCallback } from 'react';
import type { FieldPreset, EditableField, FillMap } from '../../shared/types';
import { SUPPORTED_LANGUAGES } from '../../shared/types';
import type { MsgApplyFill, MsgApplyFillResponse, MsgTranslateRequest, MsgTranslateResponse } from '../../shared/messages';
import { useStorage } from '../hooks/useStorage';

const FILL_LANG_OPTIONS = [
  { code: 'direct', label: '직접 입력' },
  ...SUPPORTED_LANGUAGES.filter((l) => l.code !== 'auto'),
];

type PresetValues = Record<string, string>;

async function sendToTab<T>(tabId: number, msg: object): Promise<T> {
  try {
    return await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/content-script.js'],
    });
    return await chrome.tabs.sendMessage(tabId, msg);
  }
}

export default function InfoTab() {
  const [aiModel] = useStorage<string>('aiModel', 'minimax');
  const [minimaxApiKey] = useStorage<string>('minimaxApiKey', '');
  const [claudeApiKey] = useStorage<string>('claudeApiKey', '');
  const [geminiApiKey] = useStorage<string>('geminiApiKey', '');
  const [fillLang, setFillLang] = useStorage<string>('fillLang', 'direct');

  const apiKey = aiModel.startsWith('claude') ? claudeApiKey
    : aiModel.startsWith('gemini') ? geminiApiKey
    : minimaxApiKey;

  const [presets, setPresets] = useState<FieldPreset[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [values, setValues] = useState<PresetValues>({});
  const [applying, setApplying] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isErr, setIsErr] = useState(false);
  const [translating, setTranslating] = useState(false);

  const showStatus = (msg: string, err = false) => {
    setStatusMsg(msg);
    setIsErr(err);
    if (!err) setTimeout(() => setStatusMsg(''), 2500);
  };

  const loadValues = (presetId: string) => {
    chrome.storage.local.get('presetValues', (data) => {
      setValues(data.presetValues?.[presetId] ?? {});
    });
  };

  // 프리셋 목록 + 마지막 선택 로드
  useEffect(() => {
    chrome.storage.local.get(['fieldPresets', 'lastPresetId'], (data) => {
      const map: Record<string, FieldPreset> = data.fieldPresets ?? {};
      const list = Object.values(map).sort((a, b) => b.createdAt - a.createdAt);
      setPresets(list);
      const lastId: string = data.lastPresetId ?? '';
      if (lastId && map[lastId]) {
        setSelectedId(lastId);
        loadValues(lastId);
      }
    });
  }, []);

  const saveValues = useCallback((presetId: string, vals: PresetValues) => {
    chrome.storage.local.get('presetValues', (data) => {
      const all = data.presetValues ?? {};
      all[presetId] = vals;
      chrome.storage.local.set({ presetValues: all });
    });
  }, []);

  const handlePresetChange = async (id: string) => {
    setSelectedId(id);
    setStatusMsg('');
    chrome.storage.local.set({ lastPresetId: id });
    if (id) {
      loadValues(id);
      const preset = presets.find((p) => p.id === id);
      setFillLang(preset?.lang ?? 'direct');
      if (preset?.url) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) chrome.tabs.update(tab.id, { url: preset.url });
      }
    } else {
      setValues({});
    }
  };

  const handleChange = (selector: string, value: string) => {
    const updated = { ...values, [selector]: value };
    setValues(updated);
    if (selectedId) saveValues(selectedId, updated);
  };

  const handleApply = async () => {
    const fillMap: FillMap = {};
    for (const [sel, val] of Object.entries(values)) {
      if (val) fillMap[sel] = val;
    }
    if (!Object.keys(fillMap).length) { showStatus('입력된 값이 없습니다.', true); return; }

    const currentPresetLang = selectedPreset?.lang;
    const skipTranslation = fillLang === 'direct' || (!!currentPresetLang && fillLang === currentPresetLang);

    if (skipTranslation) {
      setApplying(true);
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) throw new Error('탭을 찾을 수 없습니다.');
        const resp = await sendToTab<MsgApplyFillResponse>(tab.id, { type: 'APPLY_FILL', fillMap } satisfies MsgApplyFill);
        const { filled, skipped } = resp?.result ?? { filled: 0, skipped: 0 };
        showStatus(`${filled}개 입력 완료${skipped > 0 ? `, ${skipped}개 건너뜀` : ''}`);
      } catch (e) {
        showStatus(e instanceof Error ? e.message : '적용 오류', true);
      }
      setApplying(false);
    } else {
      if (!apiKey.trim()) { showStatus('설정에서 API 키를 먼저 입력해주세요.', true); return; }

      const currentPreset = presets.find((p) => p.id === selectedId);
      if (!currentPreset) return;

      const fieldMap: Record<string, EditableField> = {};
      for (const f of currentPreset.fields) fieldMap[f.selector] = f;

      const translateValues: Record<string, { label: string; value: string }> = {};
      for (const [sel, val] of Object.entries(values)) {
        if (!val) continue;
        const f = fieldMap[sel];
        const label = f?.label || f?.placeholder || f?.ariaLabel || sel;
        translateValues[sel] = { label, value: val };
      }
      if (!Object.keys(translateValues).length) { showStatus('입력된 값이 없습니다.', true); return; }

      setTranslating(true);
      try {
        const resp: MsgTranslateResponse = await chrome.runtime.sendMessage({
          type: 'TRANSLATE_REQUEST',
          values: translateValues,
          targetLanguage: fillLang,
          apiKey,
          aiModel,
        } satisfies MsgTranslateRequest);

        if (!resp.success) throw new Error(resp.error);

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) throw new Error('탭을 찾을 수 없습니다.');
        const applyResp = await sendToTab<MsgApplyFillResponse>(tab.id, { type: 'APPLY_FILL', fillMap: resp.translated! } satisfies MsgApplyFill);
        const { filled, skipped } = applyResp?.result ?? { filled: 0, skipped: 0 };
        showStatus(`번역 후 ${filled}개 입력 완료${skipped > 0 ? `, ${skipped}개 건너뜀` : ''}`);
      } catch (e) {
        showStatus(e instanceof Error ? e.message : '번역 오류', true);
      }
      setTranslating(false);
    }
  };

  const selectedPreset = presets.find((p) => p.id === selectedId);
  const dispLabel = (f: EditableField) => f.label || f.placeholder || f.ariaLabel || f.name || f.selector;
  const busy = applying || translating;

  // 라디오 그룹을 첫 등장 위치에서 한 번에 렌더링하기 위한 추적
  const renderedRadioGroups = new Set<string>();

  const renderField = (f: EditableField) => {
    // ── 라디오 그룹 ──
    if (f.type === 'radio' && f.name) {
      if (renderedRadioGroups.has(f.name)) return null;
      renderedRadioGroups.add(f.name);
      const groupFields = selectedPreset!.fields.filter(
        (gf) => gf.type === 'radio' && gf.name === f.name
      );
      const selectedSel = groupFields.find((gf) => values[gf.selector] === 'true')?.selector ?? '';
      return (
        <div key={`radio-group-${f.name}`} className="info-field">
          <label className="meta-label">{f.name}</label>
          <div className="info-radio-group">
            {groupFields.map((gf) => (
              <label key={gf.selector} className="info-radio-option">
                <input
                  type="radio"
                  name={`info-${f.name}`}
                  checked={selectedSel === gf.selector}
                  onChange={() => {
                    const updated = { ...values };
                    groupFields.forEach((g) => { updated[g.selector] = 'false'; });
                    updated[gf.selector] = 'true';
                    setValues(updated);
                    if (selectedId) saveValues(selectedId, updated);
                  }}
                />
                <span>{gf.label || gf.radioValue || gf.ariaLabel || gf.selector}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    // ── 체크박스 ──
    if (f.type === 'checkbox') {
      const checked = values[f.selector] === 'true';
      return (
        <div key={f.selector} className="info-field info-field--checkbox">
          <label className="info-checkbox-option">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => handleChange(f.selector, String(e.target.checked))}
            />
            <span className="meta-label" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
              {dispLabel(f)}
            </span>
          </label>
        </div>
      );
    }

    // ── select ──
    if (f.type === 'select' && f.options?.length) {
      return (
        <div key={f.selector} className="info-field">
          <label className="meta-label">{dispLabel(f)}</label>
          <select
            className="lang-select"
            value={values[f.selector] ?? ''}
            onChange={(e) => handleChange(f.selector, e.target.value)}
          >
            <option value="">선택</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.text}</option>
            ))}
          </select>
        </div>
      );
    }

    // ── textarea ──
    if (f.type === 'textarea') {
      return (
        <div key={f.selector} className="info-field">
          <label className="meta-label">{dispLabel(f)}</label>
          <textarea
            className="meta-textarea"
            rows={3}
            value={values[f.selector] ?? ''}
            onChange={(e) => handleChange(f.selector, e.target.value)}
          />
        </div>
      );
    }

    // ── 일반 input ──
    return (
      <div key={f.selector} className="info-field">
        <label className="meta-label">{dispLabel(f)}</label>
        <input
          className="meta-input"
          type={f.type === 'password' ? 'password' : 'text'}
          value={values[f.selector] ?? ''}
          onChange={(e) => handleChange(f.selector, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div className="info-tab">
      {/* 프리셋 선택 */}
      <div className="info-preset-bar">
        <label className="meta-label">프리셋</label>
        <select
          className="info-preset-select"
          value={selectedId}
          onChange={(e) => handlePresetChange(e.target.value)}
        >
          <option value="">-- 프리셋 선택 --</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {presets.length === 0 && (
        <p className="info-hint">폼 생성 탭에서 프리셋을 먼저 만들어 주세요.</p>
      )}

      {/* 동적 필드 폼 */}
      {selectedPreset && selectedPreset.fields.length > 0 && (
        <>
          <div className="info-fields">
            {selectedPreset.fields.map((f) => renderField(f))}
          </div>

          {/* 액션 버튼 */}
          <div className="info-actions">
            <select
              className="info-lang-select"
              value={fillLang}
              onChange={(e) => setFillLang(e.target.value)}
              disabled={busy}
            >
              {FILL_LANG_OPTIONS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}{selectedPreset?.lang === l.code ? ' (기본)' : ''}
                </option>
              ))}
            </select>
            <button className="info-apply-btn" onClick={handleApply} disabled={busy}>
              {applying ? '적용 중...' : translating ? '번역 중...' : '적용'}
            </button>
          </div>
        </>
      )}

      {selectedPreset && selectedPreset.fields.length === 0 && (
        <p className="info-hint">이 프리셋에 필드가 없습니다. 폼 생성 탭에서 페이지를 스캔해 주세요.</p>
      )}

      {statusMsg && (
        <p className={`info-status${isErr ? ' info-status--err' : ''}`}>{statusMsg}</p>
      )}
    </div>
  );
}
