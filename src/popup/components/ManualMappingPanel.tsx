import { useState, useEffect } from 'react';
import type { FormField, AppMetadata, ReviewInfo, FillMap } from '../../shared/types';
import type { MsgApplyFill, MsgApplyFillResponse } from '../../shared/messages';

interface DataOption {
  key: string;
  label: string;
  value: string;
}

function getDataOptions(meta: AppMetadata, review: ReviewInfo): DataOption[] {
  return [
    { key: 'meta.name',        label: '앱 이름',        value: meta.name },
    { key: 'meta.subtitle',    label: '부제목',          value: meta.subtitle },
    { key: 'meta.promoText',   label: '홍보 문구',       value: meta.promoText },
    { key: 'meta.keywords',    label: '키워드',          value: meta.keywords },
    { key: 'meta.description', label: '설명',            value: meta.description },
    { key: 'meta.supportUrl',  label: '지원 URL',        value: meta.supportUrl },
    { key: 'meta.privacyUrl',  label: '개인정보 URL',    value: meta.privacyUrl },
    { key: 'meta.marketingUrl',label: '마케팅 URL',      value: meta.marketingUrl },
    { key: 'review.firstName', label: '담당자 이름',     value: review.firstName },
    { key: 'review.lastName',  label: '담당자 성',       value: review.lastName },
    { key: 'review.email',     label: '담당자 이메일',   value: review.email },
    { key: 'review.phone',     label: '담당자 전화',     value: review.phone },
    { key: 'review.demoUser',  label: '데모 계정 ID',    value: review.demoUser },
    { key: 'review.demoPassword', label: '데모 비밀번호', value: review.demoPassword },
    { key: 'review.notes',     label: '심사 메모',       value: review.notes },
  ].filter((o) => o.value.trim());
}

interface Props {
  fields: FormField[];
  appMetadata: AppMetadata;
  reviewInfo: ReviewInfo;
  tabId: number;
  hostname: string;
  onClose: () => void;
}

export default function ManualMappingPanel({ fields, appMetadata, reviewInfo, tabId, hostname, onClose }: Props) {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [saveEnabled, setSaveEnabled] = useState(true);
  const [applying, setApplying] = useState(false);
  const [resultMsg, setResultMsg] = useState('');

  const dataOptions = getDataOptions(appMetadata, reviewInfo);

  useEffect(() => {
    chrome.storage.local.get('savedMappings', (data) => {
      const hostSaved: Record<string, string> = data.savedMappings?.[hostname] ?? {};
      const preselected: Record<string, string> = {};
      for (const f of fields) {
        if (hostSaved[f.selector]) preselected[f.selector] = hostSaved[f.selector];
      }
      setMappings(preselected);
    });
  }, [fields, hostname]);

  const handleApply = async () => {
    setApplying(true);
    setResultMsg('');

    const fillMap: FillMap = {};
    for (const [selector, dataKey] of Object.entries(mappings)) {
      if (!dataKey) continue;
      const opt = dataOptions.find((o) => o.key === dataKey);
      if (opt) fillMap[selector] = opt.value;
    }

    if (!Object.keys(fillMap).length) {
      setResultMsg('매핑된 항목이 없습니다.');
      setApplying(false);
      return;
    }

    if (saveEnabled) {
      chrome.storage.local.get('savedMappings', (data) => {
        const saved = data.savedMappings ?? {};
        saved[hostname] = { ...(saved[hostname] ?? {}), ...mappings };
        chrome.storage.local.set({ savedMappings: saved });
      });
    }

    try {
      const response: MsgApplyFillResponse = await chrome.tabs.sendMessage(
        tabId,
        { type: 'APPLY_FILL', fillMap } satisfies MsgApplyFill
      );
      const { filled, skipped } = response?.result ?? { filled: 0, skipped: 0 };
      setResultMsg(`${filled}개 입력 완료${skipped > 0 ? `, ${skipped}개 건너뜀` : ''}`);
    } catch {
      setResultMsg('적용 중 오류가 발생했습니다.');
    }

    setApplying(false);
  };

  const displayLabel = (f: FormField) =>
    f.label || f.placeholder || f.ariaLabel || f.name || f.selector;

  return (
    <div className="manual-mapping-panel">
      <div className="manual-mapping-header">
        <span className="manual-mapping-title">미입력 필드 수동 매핑</span>
        <span className="manual-mapping-count">{fields.length}개</span>
        <button className="manual-mapping-close" onClick={onClose} title="닫기">✕</button>
      </div>

      <div className="manual-mapping-list">
        {fields.map((f) => (
          <div key={f.selector} className="mapping-row">
            <div className="mapping-field-info">
              <span className="mapping-field-label" title={f.selector}>{displayLabel(f)}</span>
              <span className="mapping-field-type">{f.type}</span>
            </div>
            <select
              className="mapping-select"
              value={mappings[f.selector] ?? ''}
              onChange={(e) =>
                setMappings((prev) => ({ ...prev, [f.selector]: e.target.value }))
              }
            >
              <option value="">선택 안 함</option>
              {dataOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="manual-mapping-footer">
        <label className="save-toggle">
          <input
            type="checkbox"
            checked={saveEnabled}
            onChange={(e) => setSaveEnabled(e.target.checked)}
          />
          <span>매핑 저장 (다음에 자동 적용)</span>
        </label>
        <button className="mapping-apply-btn" onClick={handleApply} disabled={applying}>
          {applying ? '적용 중...' : '적용'}
        </button>
      </div>

      {resultMsg && <p className="mapping-result">{resultMsg}</p>}
    </div>
  );
}
