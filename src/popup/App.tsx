import { useState } from 'react';
import InfoTab from './components/InfoTab';
import PageFieldsTab from './components/PageFieldsTab';
import SettingsTab from './components/SettingsTab';

type Tab = 'info' | 'fields' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('info');

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-logo">✦</span>
          <div>
            <h1 className="app-title">AppForm</h1>
            <p className="app-subtitle">AI 폼 자동입력</p>
          </div>
          <button className="app-close-btn" onClick={() => window.close()} title="닫기">✕</button>
        </div>
      </header>

      <div className="tabs">
        <button
          className={`tab-btn${activeTab === 'info' ? ' active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          정보 입력
        </button>
        <button
          className={`tab-btn${activeTab === 'fields' ? ' active' : ''}`}
          onClick={() => setActiveTab('fields')}
        >
          폼 생성
        </button>
        <button
          className={`tab-btn${activeTab === 'settings' ? ' active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          설정
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'info' && <InfoTab />}
        {activeTab === 'fields' && <PageFieldsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
