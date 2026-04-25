import { useStorage } from '../hooks/useStorage';
import { DEFAULT_REVIEW_INFO, type ReviewInfo } from '../../shared/types';

interface RowProps {
  label: string;
  children: React.ReactNode;
}

function Row({ label, children }: RowProps) {
  return (
    <div className="review-row">
      <label className="meta-label">{label}</label>
      {children}
    </div>
  );
}

export default function ReviewInfoTab() {
  const [info, setInfo] = useStorage<ReviewInfo>('reviewInfo', DEFAULT_REVIEW_INFO);

  const update = (key: keyof ReviewInfo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setInfo({ ...info, [key]: e.target.value });

  return (
    <div className="review-info-tab">
      <p className="review-section-title">담당자 연락처</p>

      <div className="name-row">
        <Row label="이름">
          <input
            className="meta-input"
            value={info.firstName}
            onChange={update('firstName')}
            placeholder="길동"
          />
        </Row>
        <Row label="성">
          <input
            className="meta-input"
            value={info.lastName}
            onChange={update('lastName')}
            placeholder="홍"
          />
        </Row>
      </div>

      <Row label="이메일">
        <input
          className="meta-input"
          type="email"
          value={info.email}
          onChange={update('email')}
          placeholder="review@example.com"
        />
      </Row>

      <Row label="전화번호">
        <input
          className="meta-input"
          type="tel"
          value={info.phone}
          onChange={update('phone')}
          placeholder="+82-10-1234-5678"
        />
      </Row>

      <p className="review-section-title" style={{ marginTop: 16 }}>
        데모 계정 <span className="optional-badge">선택</span>
      </p>

      <Row label="계정 ID">
        <input
          className="meta-input"
          value={info.demoUser}
          onChange={update('demoUser')}
          placeholder="demo@example.com"
        />
      </Row>

      <Row label="비밀번호">
        <input
          className="meta-input"
          type="password"
          value={info.demoPassword}
          onChange={update('demoPassword')}
          placeholder="데모 계정 비밀번호"
          autoComplete="off"
        />
      </Row>

      <p className="review-section-title" style={{ marginTop: 16 }}>
        심사 메모 <span className="optional-badge">선택</span>
      </p>

      <div className="review-row">
        <textarea
          className="meta-textarea"
          value={info.notes}
          onChange={update('notes')}
          placeholder="심사자에게 전달할 내용 (테스트 방법, 특이사항 등)"
          rows={4}
        />
      </div>
    </div>
  );
}
