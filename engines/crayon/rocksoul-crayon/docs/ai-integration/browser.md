# Browser Capability & Provider Abstraction

**Package**: `@rocksoul/ai-browser`  
**Status**: FOUNDATION

---

## 1. Design & Abstraction

Browser automation is strictly decoupled from the API and application routes. Agents interact with browser capabilities through the `IBrowserProvider` and `IBrowserSession` interfaces:

```typescript
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
  getStatus(): string;
}
```

---

## 2. Pluggable Providers

The architecture supports pluggable providers without rewriting agent code:
- **`HeadlessBrowserProvider`**: Built-in foundation implementation for testing and contract compliance.
- **Playwright / Puppeteer Provider**: Production-ready headless browser driver.
- **CDP (Chrome DevTools Protocol)**: Remote browser instance control.
