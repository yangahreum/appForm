import type { Status } from '../App';

const STATUS_LABELS: Record<Status, string> = {
  idle: '폼 자동입력 시작',
  scanning: '필드 스캔 중...',
  thinking: 'AI 분석 중...',
  done: '완료!',
  error: '오류 발생',
};

interface Props {
  status: Status;
  onClick: () => void;
}

export default function FillButton({ status, onClick }: Props) {
  const isLoading = status === 'scanning' || status === 'thinking';

  return (
    <button
      className={`fill-btn fill-btn--${status}`}
      onClick={onClick}
      disabled={status !== 'idle'}
    >
      {isLoading && <span className="spinner" aria-hidden="true" />}
      {STATUS_LABELS[status]}
    </button>
  );
}
