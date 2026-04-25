import type { FormField, FillMap, FillResult, AppMetadata, ReviewInfo } from './types';

export interface MsgFillRequest {
  type: 'FILL_REQUEST';
  tabId: number;
  fields: FormField[];
  appMetadata: AppMetadata;
  reviewInfo: ReviewInfo;
  isAsc: boolean;
  apiKey: string;
  aiModel: string;
  targetLanguage: string;
}

export interface MsgFillResponse {
  type: 'FILL_RESPONSE';
  success: boolean;
  result?: FillResult;
  skippedFields?: FormField[];
  error?: string;
}

export interface MsgApplyFill {
  type: 'APPLY_FILL';
  fillMap: FillMap;
}

export interface MsgScanFields {
  type: 'SCAN_FIELDS';
}

export interface MsgScanFieldsResponse {
  type: 'SCAN_FIELDS_RESPONSE';
  fields: FormField[];
  detectedLanguage: string; // 페이지에서 직접 감지한 언어 코드
}

export interface MsgApplyFillResponse {
  type: 'APPLY_FILL_RESPONSE';
  result: FillResult;
}

export interface MsgTranslateRequest {
  type: 'TRANSLATE_REQUEST';
  values: Record<string, { label: string; value: string }>;
  targetLanguage: string;
  apiKey: string;
  aiModel: string;
}

export interface MsgTranslateResponse {
  type: 'TRANSLATE_RESPONSE';
  success: boolean;
  translated?: FillMap;
  error?: string;
}
