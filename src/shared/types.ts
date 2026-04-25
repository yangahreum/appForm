export interface FormField {
  selector: string;
  type: string;
  label: string;
  placeholder: string;
  name: string;
  id: string;
  ariaLabel: string;
  options?: { value: string; text: string }[];
  currentValue?: string;
  radioValue?: string;
}

export interface EditableField extends FormField {
  isManual?: boolean;
}

export interface FieldPreset {
  id: string;
  name: string;
  hostname: string;
  url?: string;
  lang?: string;
  fields: EditableField[];
  createdAt: number;
}

export type FillMap = Record<string, string>;

export interface FillResult {
  filled: number;
  skipped: number;
}

export interface AppMetadata {
  name: string;        // max 30
  subtitle: string;    // max 30
  promoText: string;   // max 170
  keywords: string;    // max 100, comma-separated
  description: string; // max 4000
  supportUrl: string;
  privacyUrl: string;
  marketingUrl: string;
}

export interface ReviewInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  demoUser: string;
  demoPassword: string;
  notes: string;
}

export const DEFAULT_APP_METADATA: AppMetadata = {
  name: '', subtitle: '', promoText: '', keywords: '',
  description: '', supportUrl: '', privacyUrl: '', marketingUrl: '',
};

export const DEFAULT_REVIEW_INFO: ReviewInfo = {
  firstName: '', lastName: '', email: '', phone: '',
  demoUser: '', demoPassword: '', notes: '',
};

export const ASC_LIMITS = {
  name: 30,
  subtitle: 30,
  promoText: 170,
  keywords: 100,
  description: 4000,
} as const;

export const AI_MODELS = [
  { id: 'minimax',       label: 'MiniMax-M2.7',       modelName: 'MiniMax-M2.7' },
  { id: 'claude-haiku',  label: 'Claude Haiku',        modelName: 'claude-haiku-4-5-20251001' },
  { id: 'claude-opus',   label: 'Claude Opus',         modelName: 'claude-opus-4-7' },
  { id: 'gemini-flash',  label: 'Gemini 2.5 Flash',    modelName: 'gemini-2.5-flash' },
] as const;

export type AiModelId = typeof AI_MODELS[number]['id'];

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', label: '자동 감지 (Auto)' },
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文 (简体)' },
  { code: 'ja', label: '日本語' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];
