export interface BrowserSnapshot {
  url: string;
  title: string;
  content: string;
  screenshot?: string; // base64 encoded
}

export interface IBrowserSession {
  readonly id: string;
  navigate(url: string): Promise<{ url: string; status: number }>;
  snapshot(): Promise<BrowserSnapshot>;
  click(selector: string): Promise<boolean>;
  fill(selector: string, value: string): Promise<boolean>;
  extract(selector: string): Promise<string[]>;
  close(): Promise<void>;
}

export interface IBrowserProvider {
  createSession(options?: { headless?: boolean }): Promise<IBrowserSession>;
  getStatus(): 'FOUNDATION' | 'IMPLEMENTED' | 'INTEGRATED' | 'VERIFIED' | 'PRODUCTION-READY';
}
