import { buildWhatsAppServer } from './src/server.js';
import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

async function runVisualTests() {
  console.log('🎭 Starting Playwright End-to-End Visual & Interaction Test for Rocksoul WhatsApp...');

  const screenshotsDir = path.resolve('./screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const testDbPath = path.resolve('./data/visual-test-whatsapp.db');
  const testSessionsPath = path.resolve('./data/visual-test-whatsapp-sessions');

  if (!fs.existsSync(path.resolve('./data'))) {
    fs.mkdirSync(path.resolve('./data'), { recursive: true });
  }

  // 1. Start test server on 3088
  const app = await buildWhatsAppServer({
    port: 3088,
    host: '127.0.0.1',
    databaseUrl: `file:${testDbPath}`,
    baseSessionsDir: testSessionsPath,
    password: '210491',
  });

  await app.listen({ port: 3088, host: '127.0.0.1' });
  console.log('✅ Fastify Server listening on http://127.0.0.1:3088');

  // 2. Launch Chromium browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  let passed = 0;
  let total = 0;

  async function step(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}:`, err);
    }
  }

  // STEP 1: Test Login Page
  await step('1. Navigate to /login and verify password challenge form', async () => {
    await page.goto('http://127.0.0.1:3088/login');
    await page.waitForSelector('input[type="password"]');
    await page.screenshot({ path: path.join(screenshotsDir, '01_login_page.png') });
  });

  // STEP 2: Perform Login
  await step('2. Submit password 210491 and redirect to /chat', async () => {
    await page.fill('input[type="password"]', '210491');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('button[type="submit"]'),
    ]);
    if (!page.url().includes('/chat')) {
      throw new Error(`Expected URL to contain /chat, got ${page.url()}`);
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '02_chat_initial_empty_screen.png') });
  });

  // STEP 3: Verify WhatsApp Web Empty Screen Elements
  await step('3. Verify WhatsApp Web authentic empty state & doodle wallpaper', async () => {
    const title = await page.locator('.empty-title').textContent();
    if (!title?.includes('WhatsApp Web')) {
      throw new Error(`Unexpected title: ${title}`);
    }
    const isLockVisible = await page.locator('.empty-lock').isVisible();
    if (!isLockVisible) throw new Error('Lock encryption label not visible');
  });

  // STEP 4: Test New Chat Modal
  await step('4. Open "Obrolan Baru" modal and start conversation with test number', async () => {
    await page.click('button[title="Obrolan Baru"]');
    await page.waitForSelector('div[role="dialog"]');
    await page.screenshot({ path: path.join(screenshotsDir, '03_modal_new_chat.png') });

    await page.fill('div[role="dialog"] input', '081234567890');
    await page.click('button:has-text("Buka Chat")');
    await page.waitForSelector('div[role="dialog"]', { state: 'detached' });
    await page.waitForTimeout(500);

    // Verify Active Conversation Header
    const headerTitle = await page.locator('.header-name').textContent();
    if (!headerTitle?.includes('6281234567890')) {
      throw new Error(`Expected header title with phone digits, got: ${headerTitle}`);
    }
    await page.screenshot({ path: path.join(screenshotsDir, '04_active_chat_view.png') });
  });

  // STEP 5: Test Emoji Picker
  await step('5. Open Emoji Picker popup and insert emoji to message input', async () => {
    await page.click('button[title="Emoji"]');
    await page.waitForSelector('.emoji-picker-popup');
    await page.screenshot({ path: path.join(screenshotsDir, '05_emoji_picker_popup.png') });

    // Click emoji 👍 and 🔥
    await page.locator('.emoji-btn:has-text("👍")').click();
    await page.locator('.emoji-btn:has-text("🔥")').click();

    const inputValue = await page.inputValue('.chat-input');
    if (!inputValue.includes('👍') || !inputValue.includes('🔥')) {
      throw new Error(`Expected emojis in input, got: ${inputValue}`);
    }
  });

  // STEP 6: Test Attachment Menu Popup
  await step('6. Open Attachment Menu popup (Photos/Documents)', async () => {
    await page.click('button[title="Lampirkan"]');
    await page.waitForSelector('.attach-menu-popup');
    await page.screenshot({ path: path.join(screenshotsDir, '06_attachment_menu.png') });

    // Click Foto & Video to open Media Modal
    await page.click('.attach-item:has-text("Foto & Video")');
    await page.waitForSelector('div[role="dialog"]');
    await page.screenshot({ path: path.join(screenshotsDir, '07_media_send_modal.png') });

    // Cancel modal
    await page.click('button:has-text("Batal")');
    await page.waitForSelector('div[role="dialog"]', { state: 'detached' });
  });

  // STEP 7: Test Unread Filter Chip
  await step('7. Toggle "Belum dibaca" filter chip', async () => {
    await page.click('button:has-text("Belum dibaca")');
    await page.waitForTimeout(300);
    const hasActiveClass = await page.locator('button:has-text("Belum dibaca")').getAttribute('class');
    if (!hasActiveClass?.includes('active')) {
      throw new Error('Unread filter chip did not become active');
    }
    await page.screenshot({ path: path.join(screenshotsDir, '08_unread_filter_active.png') });

    // Toggle back
    await page.click('button:has-text("Belum dibaca")');
  });

  // STEP 8: Test Settings / Dashboard View
  await step('8. Navigate to /dashboard and verify API Key & Session management', async () => {
    await page.goto('http://127.0.0.1:3088/dashboard');
    await page.waitForSelector('.card');
    await page.screenshot({ path: path.join(screenshotsDir, '09_admin_dashboard.png'), fullPage: true });

    const heading = await page.locator('h1, h2, .brand-title').first().textContent();
    if (!heading) throw new Error('Dashboard heading not found');
  });

  // STEP 9: Test QR Code Visual Scan View
  await step('9. Navigate to /sessions/default/qr?format=html and verify scan page', async () => {
    await page.goto('http://127.0.0.1:3088/sessions/default/qr?format=html');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, '10_qr_code_scan_page.png') });
  });

  // Close browser and server
  await browser.close();
  await app.close();

  // Cleanup test db
  try {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  } catch {
    // ignore
  }

  console.log(`\n🎭 Playwright Visual Test Summary: ${passed}/${total} Steps Passed!`);
  console.log(`📸 Screenshots saved to: ${screenshotsDir}`);

  if (passed !== total) {
    process.exit(1);
  }
}

runVisualTests().catch((err) => {
  console.error('Playwright Test Failed:', err);
  process.exit(1);
});
