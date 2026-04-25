import { useState, useEffect, useCallback } from 'react';
import type { EditableField, FieldPreset } from '../../shared/types';
import { SUPPORTED_LANGUAGES } from '../../shared/types';

const PRESET_LANG_OPTIONS = [
  { code: 'direct', label: '직접 입력' },
  ...SUPPORTED_LANGUAGES,
];

function genId() {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function PageFieldsTab() {
  // ── 프리셋 ────────────────────────────────────────────────────────────
  const [presets, setPresets] = useState<FieldPreset[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [presetLang, setPresetLang] = useState('direct');
  const [mode, setMode] = useState<'create' | 'rename' | 'view'>('view');

  // ── 필드 ──────────────────────────────────────────────────────────────
  const [fields, setFields] = useState<EditableField[]>([]);
  const [scannedValues, setScannedValues] = useState<Record<string, string>>({});
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addSelector, setAddSelector] = useState('');
  const [addLabel, setAddLabel] = useState('');

  // ── 상태 ──────────────────────────────────────────────────────────────
  const [scanning, setScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isErr, setIsErr] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const showStatus = (msg: string, err = false) => {
    setStatusMsg(msg);
    setIsErr(err);
    if (!err) setTimeout(() => setStatusMsg(''), 2500);
  };

  // ── 스토리지 ──────────────────────────────────────────────────────────
  useEffect(() => {
    chrome.storage.local.get('fieldPresets', (data) => {
      const map: Record<string, FieldPreset> = data.fieldPresets ?? {};
      setPresets(Object.values(map).sort((a, b) => b.createdAt - a.createdAt));
    });
  }, []);

  const persistPresets = useCallback((list: FieldPreset[]) => {
    const map: Record<string, FieldPreset> = {};
    for (const p of list) map[p.id] = p;
    chrome.storage.local.set({ fieldPresets: map });
  }, []);

  const savePresetValues = useCallback((presetId: string, vals: Record<string, string>) => {
    if (!Object.keys(vals).length) return;
    chrome.storage.local.get('presetValues', (data) => {
      const all = data.presetValues ?? {};
      // 기존 저장값이 없을 때만 스캔값으로 초기 세팅
      if (!all[presetId]) {
        all[presetId] = vals;
        chrome.storage.local.set({ presetValues: all });
      }
    });
  }, []);

  // ── 페이지 스캔 ───────────────────────────────────────────────────────
  const BLOCKED_ORIGINS = ['chrome://', 'chrome-extension://', 'chromewebstore.google.com', 'chrome.google.com/webstore', 'about:', 'edge://'];
  const isBlockedUrl = (url: string) => BLOCKED_ORIGINS.some((o) => url.includes(o));

  const scanPage = async () => {
    setScanning(true);
    setStatusMsg('');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) throw new Error('탭을 찾을 수 없습니다.');
      if (!tab.url || isBlockedUrl(tab.url)) throw new Error('이 페이지는 보안 정책상 스캔할 수 없습니다. 일반 웹사이트에서 사용해 주세요.');
      let res: { fields: EditableField[] } | undefined;
      try {
        res = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_FIELDS' });
      } catch {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['src/content/content-script.js'] });
        res = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_FIELDS' });
      }
      if (!res?.fields?.length) throw new Error('감지된 필드가 없습니다.');
      setFields(res.fields);
      const existing: Record<string, string> = {};
      for (const f of res.fields) {
        if (f.currentValue) existing[f.selector] = f.currentValue;
      }
      setScannedValues(existing);
    } catch (e) {
      showStatus(e instanceof Error ? e.message : '스캔 오류', true);
    }
    setScanning(false);
  };

  // ── 프리셋 선택 ───────────────────────────────────────────────────────
  const handleSelectChange = (val: string) => {
    if (val === '__new__') {
      setMode('create');
      setSelectedId('');
      setNameInput('');
      setPresetLang('direct');
      setFields([]);
      setScannedValues({});
      return;
    }
    const preset = presets.find((p) => p.id === val);
    if (preset) {
      setSelectedId(val);
      setNameInput(preset.name);
      setPresetLang(preset.lang ?? 'direct');
      setFields(preset.fields);
      setScannedValues({});
      setMode('view');
    }
  };

  // ── 프리셋 저장 ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!nameInput.trim()) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabUrl = tab?.url ?? '';
    const hostname = tabUrl ? new URL(tabUrl).hostname : '';

    if (mode === 'create') {
      const np: FieldPreset = { id: genId(), name: nameInput.trim(), hostname, url: tabUrl, lang: presetLang, fields, createdAt: Date.now() };
      const updated = [np, ...presets];
      setPresets(updated);
      persistPresets(updated);
      savePresetValues(np.id, scannedValues);
      setSelectedId(np.id);
      setMode('view');
    } else {
      const updated = presets.map((p) =>
        p.id === selectedId
          ? { ...p, name: mode === 'rename' ? nameInput.trim() : p.name, url: p.url ?? tabUrl, lang: presetLang, fields }
          : p
      );
      setPresets(updated);
      persistPresets(updated);
      if (Object.keys(scannedValues).length) savePresetValues(selectedId, scannedValues);
      setMode('view');
    }
    showStatus('저장됐습니다.');
  };

  // ── 프리셋 삭제 ───────────────────────────────────────────────────────
  const confirmAndDelete = () => {
    if (!selectedId) return;
    const updated = presets.filter((p) => p.id !== selectedId);
    setPresets(updated);
    persistPresets(updated);
    setSelectedId('');
    setFields([]);
    setNameInput('');
    setMode('view');
    setConfirmDelete(false);
  };

  // ── 필드 라벨 편집 ────────────────────────────────────────────────────
  const startEdit = (idx: number) => {
    const f = fields[idx];
    setEditingIdx(idx);
    setEditingLabel(f.label || f.placeholder || f.ariaLabel || '');
  };

  const commitEdit = () => {
    if (editingIdx === null) return;
    setFields((prev) => prev.map((f, i) => (i === editingIdx ? { ...f, label: editingLabel } : f)));
    setEditingIdx(null);
  };

  const removeField = (idx: number) => setFields((prev) => prev.filter((_, i) => i !== idx));

  const updateMaxLength = (idx: number, val: string) => {
    const num = val === '' ? undefined : Math.max(1, parseInt(val, 10) || 1);
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, maxLength: num } : f)));
  };

  const TEXT_TYPES = ['input', 'text', 'textarea', 'password', 'email', 'url', 'search', 'number', 'tel'];

  const addManualField = () => {
    if (!addSelector.trim()) return;
    setFields((prev) => [
      ...prev,
      { selector: addSelector.trim(), label: addLabel.trim(), type: 'text', placeholder: '', name: '', id: '', ariaLabel: '', isManual: true },
    ]);
    setAddSelector('');
    setAddLabel('');
    setShowAdd(false);
  };

  const dispLabel = (f: EditableField) => f.label || f.placeholder || f.ariaLabel || f.name || f.selector;
  const hasFields = fields.length > 0;
  const canSave = nameInput.trim().length > 0 && (mode === 'create' || mode === 'rename' || selectedId);

  return (
    <div className="pf-tab">

      {/* ── 프리셋 선택 바 ── */}
      <div className="pf-preset-bar">
        <select
          className="pf-preset-select"
          value={mode === 'create' ? '__new__' : selectedId}
          onChange={(e) => handleSelectChange(e.target.value)}
        >
          <option value="">-- 프리셋 선택 --</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
          <option value="__new__">＋ 새 프리셋 만들기</option>
        </select>
        {selectedId && mode === 'view' && (
          <div className="pf-preset-btns">
            <button className="pf-icon-btn" onClick={() => { setMode('rename'); }} title="이름 변경">✎</button>
            <button className="pf-icon-btn pf-icon-btn--danger" onClick={() => setConfirmDelete(true)} title="삭제">✕</button>
          </div>
        )}
      </div>

      {/* ── 이름 입력 (생성/이름변경) ── */}
      {(mode === 'create' || mode === 'rename') && (
        <div className="pf-name-row">
          <input
            className="pf-name-input"
            placeholder={mode === 'create' ? '프리셋 이름' : '새 이름'}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSave) handleSave(); if (e.key === 'Escape') setMode('view'); }}
            autoFocus
          />
          {mode === 'rename' && (
            <button className="pf-cancel-btn" onClick={() => setMode('view')}>취소</button>
          )}
        </div>
      )}

      {/* ── 언어 선택 ── */}
      {(mode === 'create' || (selectedId && (mode === 'view' || mode === 'rename'))) && (
        <div className="pf-lang-row">
          <label className="pf-lang-label">입력 언어</label>
          <select
            className="pf-lang-select"
            value={presetLang}
            onChange={(e) => setPresetLang(e.target.value)}
          >
            {PRESET_LANG_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── 스캔 버튼 ── */}
      {(mode === 'create' || (selectedId && mode === 'view')) && (
        <button className="pf-scan-btn" onClick={scanPage} disabled={scanning}>
          {scanning ? '스캔 중...' : hasFields ? '↺ 재스캔' : '페이지 스캔'}
        </button>
      )}

      {/* ── 필드 목록 ── */}
      {hasFields && (
        <>
          <div className="pf-field-list">
            {fields.map((f, idx) => (
              <div key={f.selector} className="pf-field-row">
                <div className="pf-field-top">
                  {editingIdx === idx ? (
                    <input
                      className="pf-label-edit"
                      value={editingLabel}
                      onChange={(e) => setEditingLabel(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingIdx(null); }}
                      autoFocus
                    />
                  ) : (
                    <span className="pf-field-name" title={f.selector} onDoubleClick={() => startEdit(idx)}>
                      {dispLabel(f)}
                      {f.isManual && <span className="pf-manual-tag">수동</span>}
                    </span>
                  )}
                  <div className="pf-field-actions">
                    <span className="pf-type-tag">{f.type}</span>
                    {scannedValues[f.selector] && (
                      <span className="pf-val-tag" title={scannedValues[f.selector]}>값 있음</span>
                    )}
                    <button className="pf-icon-btn pf-icon-btn--sm" onClick={() => startEdit(idx)} title="라벨 수정">✎</button>
                    <button className="pf-icon-btn pf-icon-btn--sm pf-icon-btn--danger" onClick={() => removeField(idx)} title="제거">✕</button>
                  </div>
                </div>
                {TEXT_TYPES.includes(f.type) && (
                  <div className="pf-maxlength-row">
                    <label className="pf-maxlength-label">최대 자릿수</label>
                    <input
                      className="pf-maxlength-input"
                      type="number"
                      min={1}
                      placeholder="제한 없음"
                      value={f.maxLength ?? ''}
                      onChange={(e) => updateMaxLength(idx, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── 필드 추가 ── */}
          {showAdd ? (
            <div className="pf-add-row">
              <input className="pf-add-input" placeholder="#id 또는 [name=x]" value={addSelector} onChange={(e) => setAddSelector(e.target.value)} />
              <input className="pf-add-input" placeholder="라벨" value={addLabel} onChange={(e) => setAddLabel(e.target.value)} />
              <button className="pf-add-ok" onClick={addManualField}>추가</button>
              <button className="pf-icon-btn pf-icon-btn--danger" onClick={() => setShowAdd(false)}>✕</button>
            </div>
          ) : (
            <button className="pf-add-field-btn" onClick={() => setShowAdd(true)}>＋ 필드 추가</button>
          )}

          {/* ── 저장 버튼 ── */}
          {canSave && (
            <button className="pf-save-btn pf-save-btn--full" onClick={handleSave}>저장</button>
          )}
        </>
      )}

      {/* ── 상태 메시지 ── */}
      {statusMsg && <p className={`pf-status${isErr ? ' pf-status--err' : ''}`}>{statusMsg}</p>}

      {/* ── 빈 상태 ── */}
      {!hasFields && !scanning && (mode === 'create' || selectedId) && (
        <p className="pf-empty">페이지를 스캔하면 필드가 표시됩니다.</p>
      )}
      {!hasFields && !scanning && mode === 'view' && !selectedId && (
        <p className="pf-empty">프리셋을 선택하거나 새로 만드세요.</p>
      )}

      {/* ── 삭제 확인 다이얼로그 ── */}
      {confirmDelete && (
        <div className="pf-dialog-overlay">
          <div className="pf-dialog">
            <p className="pf-dialog-msg">
              「{presets.find((p) => p.id === selectedId)?.name}」 프리셋을 삭제하시겠습니까?
            </p>
            <div className="pf-dialog-btns">
              <button className="pf-dialog-btn pf-dialog-btn--danger" onClick={confirmAndDelete}>예</button>
              <button className="pf-dialog-btn" onClick={() => setConfirmDelete(false)}>아니오</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
