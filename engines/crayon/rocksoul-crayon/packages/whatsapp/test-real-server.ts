import { chromium } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

async function testRealServer() {
  const screenshotsDir = path.resolve('./screenshots_real');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('🚀 Connecting to REAL running server on http://127.0.0.1:3001...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  page.on('console', (msg) => console.log('  [PAGE BROWSER LOG]:', msg.text()));
  page.on('pageerror', (err) => console.error('  [PAGE BROWSER ERROR]:', err.message));

  // 1. Navigate to login
  console.log('1. Logging in to http://127.0.0.1:3001/login...');
  await page.goto('http://127.0.0.1:3001/login');
  await page.fill('input[type="password"]', '210491');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]'),
  ]);
  console.log('  Logged in successfully, current URL:', page.url());
  
  // Wait for React app to mount
  await page.waitForSelector('.app-shell', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(screenshotsDir, 'real_01_chat_home.png') });

  // 2. Check sidebar chips & switch to Saluran (Channels)
  console.log('2. Testing Saluran tab...');
  const saluranButton = page.locator('.filter-chip:has-text("Saluran")');
  if (await saluranButton.isVisible()) {
    console.log('  Found Saluran chip:', await saluranButton.textContent());
    await saluranButton.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'real_02_saluran_tab.png') });
  }

  // 3. Test Status tab
  console.log('3. Testing Status tab...');
  const statusButton = page.locator('.filter-chip:has-text("Status")');
  if (await statusButton.isVisible()) {
    console.log('  Found Status chip:', await statusButton.textContent());
    await statusButton.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'real_03_status_tab.png') });

    // If status item exists, click it to open status viewer
    const firstStatusItem = page.locator('.status-item').first();
    if (await firstStatusItem.isVisible()) {
      console.log('  Clicking first status item to view popup...');
      await firstStatusItem.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(screenshotsDir, 'real_04_status_viewer_popup.png') });

      // Close status viewer
      await page.click('.status-viewer-header button');
      await page.waitForTimeout(500);
    }
  }

  // 4. Test Kontak tab
  console.log('4. Testing Kontak tab...');
  const kontakButton = page.locator('.filter-chip:has-text("Kontak")');
  if (await kontakButton.isVisible()) {
    console.log('  Found Kontak chip:', await kontakButton.textContent());
    await kontakButton.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'real_05_kontak_tab.png') });
  }

  // 5. Switch back to Semua (All Chats) and select first chat
  console.log('5. Testing Semua chats and selecting conversation...');
  await page.click('.filter-chip:has-text("Semua")');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotsDir, 'real_06_semua_chats.png') });

  const firstChat = page.locator('.chat-item').first();
  if (await firstChat.isVisible()) {
    console.log('  Selecting first chat in list...');
    await firstChat.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'real_07_open_chat.png') });

    // 6. Test Emoji picker
    console.log('6. Opening Emoji picker...');
    await page.click('button[title="Emoji"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, 'real_08_emoji_picker.png') });

    // 7. Test Attachment menu
    console.log('7. Opening Attachment menu...');
    await page.click('button[title="Lampirkan"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, 'real_09_attach_menu.png') });
  }

  // 8. Test New Group modal
  console.log('8. Opening New Group modal...');
  const newGroupBtn = page.locator('button[title="Buat Grup Baru"]');
  if (await newGroupBtn.isVisible()) {
    await newGroupBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, 'real_10_new_group_modal.png') });
    // Close modal
    await page.click('button:has-text("Batal")');
    await page.waitForTimeout(500);
  }

  // 9. Test Message hover action buttons & Voice Note Mic
  console.log('9. Checking Voice Note Mic & message action buttons...');
  const micButton = page.locator('button[title="Rekam Pesan Suara"]');
  console.log('  Voice Note Mic button visible:', await micButton.isVisible());

  const firstMsgRow = page.locator('.message-row').first();
  if (await firstMsgRow.isVisible()) {
    await firstMsgRow.hover();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, 'real_11_message_hover_actions.png') });
  }

  // 10. Test Profile modal
  console.log('10. Opening Profile modal...');
  await page.click('div[title="Klik untuk Edit Profil & Foto"]');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(screenshotsDir, 'real_12_profile_modal.png') });

  await browser.close();
  console.log(`✅ Real Server Test Completed! All screenshots saved to: ${screenshotsDir}`);
}

testRealServer().catch((err) => {
  console.error('Real Server Test Error:', err);
  process.exit(1);
});

