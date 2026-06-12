import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const SCREENSHOTS_DIR = new URL('./screenshots/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const BASE_URL = 'http://localhost:3001';
const results = [];

function log(msg) {
  console.log(msg);
  results.push(msg);
}

// Find chromium executable
const CHROMIUM_PATH = 'C:\\Users\\alex\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win\\chrome.exe';

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const networkErrors = [];
  page.on('response', res => {
    if (res.status() >= 400) networkErrors.push(`${res.status()} ${res.url()}`);
  });

  log('=== PIPELINE SCROLL TEST ===');
  log('Viewport: 1280x800');
  log(`URL: ${BASE_URL}`);
  log('');

  // Step 1: Navigate to login
  log('Step 1: Navigate to login page');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '01_login_page.png') });
  log(`  URL after load: ${page.url()}`);

  // Step 2: Login as seller1
  log('Step 2: Login as seller1');
  const usernameInput = await page.$('input[type="text"], input[name="username"]');
  const passwordInput = await page.$('input[type="password"]');
  if (usernameInput && passwordInput) {
    await usernameInput.fill('seller1');
    await passwordInput.fill('Seller123!');
    await page.screenshot({ path: join(SCREENSHOTS_DIR, '02_login_filled.png') });
    await page.keyboard.press('Enter');
  } else {
    log('  ERROR: Could not find login inputs');
    const html = await page.content();
    log(`  Page snippet: ${html.slice(0, 500)}`);
  }

  try {
    await page.waitForNavigation({ timeout: 8000 });
  } catch (e) {
    // ignore timeout
  }
  await page.waitForTimeout(1000);
  log(`  URL after login: ${page.url()}`);
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '03_after_login.png') });

  // Step 3: Navigate to Pipeline
  log('Step 3: Navigate to Pipeline page');
  await page.goto(`${BASE_URL}/pipeline`, { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1000);
  log(`  URL: ${page.url()}`);
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '04_pipeline_initial.png') });
  log('  Screenshot: 04_pipeline_initial.png');

  // Step 4: Count pipe-col elements
  log('Step 4: Count Kanban columns');
  const colCount = await page.evaluate(() => document.querySelectorAll('.pipe-col').length);
  log(`  Total .pipe-col elements: ${colCount}/7`);

  // Get column details
  const colData = await page.evaluate(() => {
    const cols = document.querySelectorAll('.pipe-col');
    return Array.from(cols).map((col, i) => {
      const rect = col.getBoundingClientRect();
      const headerEl = col.querySelector('.pipe-col-h span:first-child') || col.querySelector('.pipe-col-h');
      const headerText = headerEl ? headerEl.textContent.trim() : `col_${i}`;
      return {
        index: i,
        header: headerText,
        x: Math.round(rect.x),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        inViewport: rect.x < window.innerWidth && rect.right > 0,
        fullyVisible: rect.x >= 0 && rect.right <= window.innerWidth
      };
    });
  });

  log('  Column positions (viewport 1280px wide):');
  for (const col of colData) {
    const status = col.fullyVisible ? 'FULLY VISIBLE' : col.inViewport ? 'PARTIALLY VISIBLE' : 'OUT OF VIEWPORT';
    log(`    [${col.index}] "${col.header}": x=${col.x}, right=${col.right}, width=${col.width} — ${status}`);
  }

  // Step 5: Analyze scroll container
  log('Step 5: Analyze .pipeline-scroll container');
  const scrollInfo = await page.evaluate(() => {
    const el = document.querySelector('.pipeline-scroll');
    if (!el) return { found: false };
    const styles = window.getComputedStyle(el);
    return {
      found: true,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollLeft: el.scrollLeft,
      overflowX: styles.overflowX,
      hasHorizontalScroll: el.scrollWidth > el.clientWidth,
      difference: el.scrollWidth - el.clientWidth
    };
  });
  log(`  Found: ${scrollInfo.found}`);
  if (scrollInfo.found) {
    log(`  scrollWidth: ${scrollInfo.scrollWidth}px`);
    log(`  clientWidth: ${scrollInfo.clientWidth}px`);
    log(`  overflowX: ${scrollInfo.overflowX}`);
    log(`  Needs scroll: ${scrollInfo.hasHorizontalScroll}`);
    log(`  Hidden content: ${scrollInfo.difference}px`);
  }

  // Step 6: Check parent layout overflow
  log('Step 6: Check parent/ancestor overflow constraints');
  const parentInfo = await page.evaluate(() => {
    const el = document.querySelector('.pipeline-scroll');
    if (!el) return null;
    const info = [];
    let current = el.parentElement;
    let depth = 0;
    while (current && depth < 5) {
      const styles = window.getComputedStyle(current);
      const rect = current.getBoundingClientRect();
      info.push({
        tag: current.tagName,
        className: current.className.slice(0, 60),
        overflowX: styles.overflowX,
        width: Math.round(rect.width),
        clientWidth: current.clientWidth
      });
      current = current.parentElement;
      depth++;
    }
    return info;
  });
  if (parentInfo) {
    log('  Parent elements:');
    for (const p of parentInfo) {
      log(`    <${p.tag} class="${p.className}"> — overflowX:${p.overflowX}, width:${p.width}px`);
    }
  }

  // Step 7: Scroll right and take screenshot
  log('Step 7: Scroll pipeline to the right');
  await page.evaluate(() => {
    const el = document.querySelector('.pipeline-scroll');
    if (el) el.scrollLeft = 9999;
  });
  await page.waitForTimeout(400);

  const afterScrollInfo = await page.evaluate(() => {
    const el = document.querySelector('.pipeline-scroll');
    if (!el) return null;
    return { scrollLeft: el.scrollLeft, scrollWidth: el.scrollWidth };
  });
  log(`  scrollLeft after: ${afterScrollInfo?.scrollLeft}`);
  await page.screenshot({ path: join(SCREENSHOTS_DIR, '05_pipeline_scrolled_right.png') });
  log('  Screenshot: 05_pipeline_scrolled_right.png');

  // Columns after scroll
  const colDataAfterScroll = await page.evaluate(() => {
    const cols = document.querySelectorAll('.pipe-col');
    return Array.from(cols).map((col, i) => {
      const rect = col.getBoundingClientRect();
      const headerEl = col.querySelector('.pipe-col-h span:first-child') || col.querySelector('.pipe-col-h');
      const headerText = headerEl ? headerEl.textContent.trim() : `col_${i}`;
      return {
        header: headerText,
        x: Math.round(rect.x),
        right: Math.round(rect.right),
        inViewport: rect.x < window.innerWidth && rect.right > 0
      };
    });
  });
  log('  Columns visible after scrolling right:');
  for (const col of colDataAfterScroll) {
    log(`    "${col.header}": x=${col.x}, right=${col.right}, inViewport=${col.inViewport}`);
  }

  // Step 8: Mouse wheel scroll attempt
  log('Step 8: Use mouse wheel to scroll horizontally');
  await page.evaluate(() => {
    const el = document.querySelector('.pipeline-scroll');
    if (el) el.scrollLeft = 0; // reset
  });
  const scrollEl = await page.$('.pipeline-scroll');
  if (scrollEl) {
    const box = await scrollEl.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      // Wheel event with deltaX
      await page.evaluate(() => {
        const el = document.querySelector('.pipeline-scroll');
        el.dispatchEvent(new WheelEvent('wheel', { deltaX: 500, bubbles: true }));
      });
      await page.waitForTimeout(300);
      const wheelResult = await page.evaluate(() => {
        const el = document.querySelector('.pipeline-scroll');
        return el ? el.scrollLeft : null;
      });
      log(`  scrollLeft after wheel: ${wheelResult}`);
    }
  }

  // Step 9: Take screenshot at 1920 viewport
  log('Step 9: Test at wider viewport (1920x1080)');
  await context.close();
  const ctx2 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page2 = await ctx2.newPage();
  await page2.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  const input2u = await page2.$('input[type="text"]');
  const input2p = await page2.$('input[type="password"]');
  if (input2u && input2p) {
    await input2u.fill('seller1');
    await input2p.fill('Seller123!');
    await page2.keyboard.press('Enter');
    await page2.waitForTimeout(2000);
  }
  await page2.goto(`${BASE_URL}/pipeline`, { waitUntil: 'networkidle', timeout: 10000 });
  await page2.waitForTimeout(1000);

  const scrollInfo2 = await page2.evaluate(() => {
    const el = document.querySelector('.pipeline-scroll');
    if (!el) return null;
    return {
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      hasHorizontalScroll: el.scrollWidth > el.clientWidth,
    };
  });
  log(`  At 1920px: ${JSON.stringify(scrollInfo2)}`);
  await page2.screenshot({ path: join(SCREENSHOTS_DIR, '06_pipeline_1920px.png') });
  log('  Screenshot: 06_pipeline_1920px.png');

  const colData2 = await page2.evaluate(() => {
    const cols = document.querySelectorAll('.pipe-col');
    return Array.from(cols).map((col, i) => {
      const rect = col.getBoundingClientRect();
      const headerEl = col.querySelector('.pipe-col-h span:first-child') || col.querySelector('.pipe-col-h');
      return {
        index: i,
        header: headerEl ? headerEl.textContent.trim() : `col_${i}`,
        x: Math.round(rect.x),
        right: Math.round(rect.right),
        fullyVisible: rect.x >= 0 && rect.right <= window.innerWidth
      };
    });
  });
  log('  Columns at 1920px:');
  for (const col of colData2) {
    log(`    [${col.index}] "${col.header}": x=${col.x}, right=${col.right}, fully=${col.fullyVisible}`);
  }

  await ctx2.close();
  await browser.close();

  // Final summary
  log('');
  log('=== FINAL SUMMARY ===');
  const fullyVis = colData.filter(c => c.fullyVisible);
  const partial = colData.filter(c => c.inViewport && !c.fullyVisible);
  const outOf = colData.filter(c => !c.inViewport);
  log(`Columns total: ${colData.length}/7`);
  log(`Fully visible at 1280px: ${fullyVis.length} — [${fullyVis.map(c => c.header).join(', ')}]`);
  log(`Partially visible: ${partial.length} — [${partial.map(c => c.header).join(', ')}]`);
  log(`Out of viewport: ${outOf.length} — [${outOf.map(c => c.header).join(', ')}]`);
  log(`Horizontal scroll exists: ${scrollInfo.found && scrollInfo.hasHorizontalScroll ? 'YES' : 'NO'}`);

  if (consoleErrors.length > 0) {
    log(`\nConsole errors: ${consoleErrors.length}`);
    consoleErrors.slice(0, 5).forEach(e => log(`  ${e}`));
  }
  if (networkErrors.length > 0) {
    log(`\nNetwork errors (>=400): ${networkErrors.length}`);
    networkErrors.slice(0, 5).forEach(e => log(`  ${e}`));
  }

  const resultsPath = new URL('./pipeline_scroll_results.txt', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
  writeFileSync(resultsPath, results.join('\n'));
  log(`\nResults written to: progress/pipeline_scroll_results.txt`);
}

run().catch(e => {
  console.error('FATAL:', e.message, e.stack);
  process.exit(1);
});
