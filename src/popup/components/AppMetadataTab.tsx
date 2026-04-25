import { useStorage } from '../hooks/useStorage';
import { ASC_LIMITS, DEFAULT_APP_METADATA, type AppMetadata } from '../../shared/types';

function CharCounter({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  const cls = ratio >= 1 ? 'over' : ratio >= 0.85 ? 'warn' : '';
  return (
    <span className={`char-counter ${cls}`}>
      {current}/{max}
    </span>
  );
}

interface FieldProps {
  label: string;
  max?: number;
  children: React.ReactNode;
  current?: number;
  hint?: string;
}

function Field({ label, max, current, hint, children }: FieldProps) {
  return (
    <div className="meta-field">
      <div className="meta-field-header">
        <label className="meta-label">{label}</label>
        {max !== undefined && current !== undefined && (
          <CharCounter current={current} max={max} />
        )}
      </div>
      {children}
      {hint && <p className="meta-hint">{hint}</p>}
    </div>
  );
}

export default function AppMetadataTab() {
  const [meta, setMeta] = useStorage<AppMetadata>('appMetadata', DEFAULT_APP_METADATA);

  const update = (key: keyof AppMetadata) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setMeta({ ...meta, [key]: e.target.value });

  return (
    <div className="app-metadata-tab">
      <Field label="앱 이름" max={ASC_LIMITS.name} current={meta.name.length}>
        <input
          className="meta-input"
          value={meta.name}
          onChange={update('name')}
          maxLength={ASC_LIMITS.name}
          placeholder="앱 이름 (최대 30자)"
        />
      </Field>

      <Field label="부제목" max={ASC_LIMITS.subtitle} current={meta.subtitle.length}>
        <input
          className="meta-input"
          value={meta.subtitle}
          onChange={update('subtitle')}
          maxLength={ASC_LIMITS.subtitle}
          placeholder="부제목 (최대 30자)"
        />
      </Field>

      <Field
        label="프로모션 문구"
        max={ASC_LIMITS.promoText}
        current={meta.promoText.length}
        hint="앱 리뷰 없이 수시로 변경 가능"
      >
        <input
          className="meta-input"
          value={meta.promoText}
          onChange={update('promoText')}
          maxLength={ASC_LIMITS.promoText}
          placeholder="프로모션 문구 (최대 170자)"
        />
      </Field>

      <Field
        label="키워드"
        max={ASC_LIMITS.keywords}
        current={meta.keywords.length}
        hint="쉼표로 구분, 공백 없이 입력"
      >
        <input
          className="meta-input"
          value={meta.keywords}
          onChange={update('keywords')}
          maxLength={ASC_LIMITS.keywords}
          placeholder="사진,편집,필터,카메라 (최대 100자)"
        />
      </Field>

      <Field label="설명" max={ASC_LIMITS.description} current={meta.description.length}>
        <textarea
          className="meta-textarea"
          value={meta.description}
          onChange={update('description')}
          maxLength={ASC_LIMITS.description}
          placeholder="앱 설명 (최대 4,000자)"
          rows={6}
        />
      </Field>

      <div className="url-section">
        <p className="url-section-label">URL (번역 없이 그대로 입력)</p>
        <Field label="지원 URL">
          <input
            className="meta-input"
            type="url"
            value={meta.supportUrl}
            onChange={update('supportUrl')}
            placeholder="https://example.com/support"
          />
        </Field>
        <Field label="개인정보 처리방침 URL">
          <input
            className="meta-input"
            type="url"
            value={meta.privacyUrl}
            onChange={update('privacyUrl')}
            placeholder="https://example.com/privacy"
          />
        </Field>
        <Field label="마케팅 URL (선택)">
          <input
            className="meta-input"
            type="url"
            value={meta.marketingUrl}
            onChange={update('marketingUrl')}
            placeholder="https://example.com"
          />
        </Field>
      </div>
    </div>
  );
}
