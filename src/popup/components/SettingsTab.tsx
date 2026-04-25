import { useState } from 'react';
import { AI_MODELS } from '../../shared/types';
import { useStorage } from '../hooks/useStorage';

const CLAUDE_CONFIG = {
  label: 'Claude API 키',
  placeholder: 'sk-ant-...',
  hintUrl: 'https://console.anthropic.com/settings/api-keys',
  hintLinkText: 'Anthropic Console',
};

const MINIMAX_CONFIG = {
  label: 'MiniMax API 키',
  placeholder: 'MiniMax API 키를 입력하세요',
  hintUrl: 'https://platform.minimax.io/user-center/basic-information/interface-key',
  hintLinkText: 'MiniMax Platform',
};

const GEMINI_CONFIG = {
  label: 'Gemini API 키',
  placeholder: 'AIza...',
  hintUrl: 'https://aistudio.google.com/app/apikey',
  hintLinkText: 'Google AI Studio',
};

export default function SettingsTab() {
  const [aiModel, setAiModel] = useStorage<string>('aiModel', 'minimax');
  const [minimaxApiKey, setMinimaxApiKey] = useStorage<string>('minimaxApiKey', '');
  const [claudeApiKey, setClaudeApiKey] = useStorage<string>('claudeApiKey', '');
  const [geminiApiKey, setGeminiApiKey] = useStorage<string>('geminiApiKey', '');
  const [saved, setSaved] = useState(false);

  const cfg = aiModel.startsWith('claude') ? CLAUDE_CONFIG
    : aiModel.startsWith('gemini') ? GEMINI_CONFIG
    : MINIMAX_CONFIG;
  const currentKey = aiModel.startsWith('claude') ? claudeApiKey
    : aiModel.startsWith('gemini') ? geminiApiKey
    : minimaxApiKey;
  const setCurrentKey = aiModel.startsWith('claude') ? setClaudeApiKey
    : aiModel.startsWith('gemini') ? setGeminiApiKey
    : setMinimaxApiKey;

  const handleKeyBlur = () => {
    if (currentKey) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const selectedModel = AI_MODELS.find((m) => m.id === aiModel);

  return (
    <div className="settings-tab">

      <div className="setting-group">
        <label className="field-label" htmlFor="ai-model-select">
          AI 모델
        </label>
        <select
          id="ai-model-select"
          className="lang-select"
          value={aiModel}
          onChange={(e) => setAiModel(e.target.value)}
        >
          {AI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="setting-group">
        <label className="field-label" htmlFor="api-key">
          {cfg.label}
        </label>
        <div className="api-key-row">
          <input
            id="api-key"
            type="password"
            className="api-key-input"
            placeholder={cfg.placeholder}
            value={currentKey}
            onChange={(e) => setCurrentKey(e.target.value)}
            onBlur={handleKeyBlur}
            autoComplete="off"
          />
          {saved && <span className="saved-badge">저장됨 ✓</span>}
        </div>
        <p className="setting-hint">
          <a href={cfg.hintUrl} target="_blank" rel="noreferrer">{cfg.hintLinkText}</a>
          에서 발급받을 수 있습니다.
        </p>
      </div>

      <div className="setting-group">
        <p className="model-info">
          사용 모델: <strong>{selectedModel?.modelName ?? aiModel}</strong>
        </p>
      </div>
    </div>
  );
}
