export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface KeyValueParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type BodyType = 'none' | 'json' | 'form-data' | 'urlencoded';

export interface MockConfig {
  enabled: boolean;
  status: number;
  delay: number; // in ms
  body: string;
  headers: { key: string; value: string }[];
}

export interface RequestConfig {
  method: Method;
  url: string;
  headers: KeyValueParam[];
  params: KeyValueParam[];
  bodyType: BodyType;
  body: string;
  mockConfig: MockConfig;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  time: number; // execution duration in ms
  size: number; // approximate size in bytes
  error: string | null;
}

export interface HistoryItem {
  id: string;
  name: string;
  timestamp: number;
  config: RequestConfig;
}

export interface Collection {
  id: string;
  name: string;
  requests: HistoryItem[];
}
