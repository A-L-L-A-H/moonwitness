import { randomUUID } from 'node:crypto';
import type { IBrowserProvider, IBrowserSession, BrowserSnapshot } from './types.js';

export class HeadlessBrowserSession implements IBrowserSession {
  readonly id: string;
  private currentUrl: string = 'about:blank';
  private pageTitle: string = 'Blank Page';
  private pageContent: string = '<html><body></body></html>';

  constructor() {
    this.id = randomUUID();
  }

  async navigate(url: string): Promise<{ url: string; status: number }> {
    this.currentUrl = url;
    this.pageTitle = `Page for ${url}`;
    this.pageContent = `<html><head><title>${this.pageTitle}</title></head><body><h1>Simulated Content for ${url}</h1></body></html>`;
    return { url: this.currentUrl, status: 200 };
  }

  async snapshot(): Promise<BrowserSnapshot> {
    return {
      url: this.currentUrl,
      title: this.pageTitle,
      content: this.pageContent,
    };
  }

  async click(_selector: string): Promise<boolean> {
    return true;
  }

  async fill(_selector: string, _value: string): Promise<boolean> {
    return true;
  }

  async extract(_selector: string): Promise<string[]> {
    return [this.pageTitle];
  }

  async close(): Promise<void> {
    this.pageContent = '';
  }
}

export class HeadlessBrowserProvider implements IBrowserProvider {
  getStatus(): 'FOUNDATION' {
    return 'FOUNDATION';
  }

  async createSession(_options?: { headless?: boolean }): Promise<IBrowserSession> {
    return new HeadlessBrowserSession();
  }
}
