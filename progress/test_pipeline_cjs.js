const { chromium } = require('./node_modules/playwright-core');
const { writeFileSync, mkdirSync } = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const BASE_URL = 'http://localhost:3001';
const CHROMIUM_PATH = path.join(
  'C:', 'Users', 'alex', 'AppData', 'Local',
  'ms-playwright', 'chromium-1223', 'chrome-win64', 'chrome.exe'
);

const results = [];
function log(msg) {
  console.log(msg);
  results.push(msg);
}

async function run() {
  log('=== PIPELINE SCROLL TEST ===');
  log('Viewport: 1280x800');
  log('URL: ' + BASE_URL);
  log('');

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
    if (res.status() >= 400) networkErrors.push(res.status() + ' ' + res.url());
  });

  // Step 1: Navigate to login
  log('Step 1: Navigate to login page');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_login_page.png') });
  log('  URL: ' + page.url());

  // Step 2: Login as seller1
  log('Step 2: Login as seller1');
  const textInputs = await page.$$('input[type="text"], input:not([type])');
  const passwordInputs = await page.$$('input[type="password"]');

  if (textInputs.length > 0 && passwordInputs.length > 0) {
    await textInputs[0].fill('seller1');
    await passwordInputs[0].fill('Seller123!');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_login_filled.png') });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
  } else {
    // Try direct URL approach - maybe already logged in or different login form
    log('  Could not find inputs, checking page content...');
    const content = await page.content();
    log('  Page snippet: ' + content.slice(0, 300));
  }

  log('  URL after login attempt: ' + page.url());
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_after_login.png') });

  // If redirected to login, try again
  if (page.url().includes('login') || page.url() === BASE_URL + '/') {
    log('  Re-attempting login...');
    const inputs = await page.$$('input');
    log('  Found ' + inputs.length + ' inputs');
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const name = await inputs[i].getAttribute('name');
      const placeholder = await inputs[i].getAttribute('placeholder');
      log('    input[' + i + ']: type=' + type + ', name=' + name + ', placeholder=' + placeholder);
    }
  }

  // Step 3: Navigate to Pipeline
  log('Step 3: Navigate to Pipeline (/pipeline)');
  await page.goto(BASE_URL + '/pipeline', { waitUntil: 'networkidle', timeout: 10000 });
  await page.waitForTimeout(1500);
  log('  URL: ' + page.url());

  // Take screenshot
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_pipeline_initial.png') });
  log('  Screenshot: 04_pipeline_initial.png');

  // Check if we're on the pipeline page or got redirected to login
  const currentUrl = page.url();
  if (currentUrl.includes('login')) {
    log('  REDIRECTED TO LOGIN - session not maintained. Trying to login again...');
    const textInputs2 = await page.$$('input[type="text"], input:not([type="password"]):not([type="submit"])');
    const passwordInputs2 = await page.$$('input[type="password"]');
    if (textInputs2.length > 0) {
      await textInputs2[0].fill('seller1');
      if (passwordInputs2.length > 0) await passwordInputs2[0].fill('Seller123!');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
      await page.goto(BASE_URL + '/pipeline', { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(1500);
      log('  URL after re-login: ' + page.url());
    }
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04b_pipeline_final.png') });

  // Step 4: Count columns
  log('Step 4: Count Kanban columns');
  const colCount = await page.evaluate(function() {
    return document.querySelectorAll('.pipe-col').length;
  });
  log('  Total .pipe-col elements: ' + colCount + '/7');

  // Get detailed column info
  const colData = await page.evaluate(function() {
    var cols = document.querySelectorAll('.pipe-col');
    return Array.from(cols).map(function(col, i) {
      var rect = col.getBoundingClientRect();
      var headerSpans = col.querySelectorAll('.pipe-col-h span');
      var headerText = headerSpans.length > 0 ? headerSpans[0].textContent.trim() : 'col_' + i;
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
  for (var i = 0; i < colData.length; i++) {
    var col = colData[i];
    var status = col.fullyVisible ? 'FULLY VISIBLE' : (col.inViewport ? 'PARTIALLY VISIBLE' : 'OUT OF VIEWPORT');
    log('    [' + col.index + '] "' + col.header + '": x=' + col.x + ', right=' + col.right + ', width=' + col.width + ' — ' + status);
  }

  // Step 5: Scroll container analysis
  log('Step 5: Analyze .pipeline-scroll container');
  const scrollInfo = await page.evaluate(function() {
    var el = document.querySelector('.pipeline-scroll');
    if (!el) return { found: false };
    var styles = window.getComputedStyle(el);
    return {
      found: true,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollLeft: el.scrollLeft,
      overflowX: styles.overflowX,
      hasHorizontalScroll: el.scrollWidth > el.clientWidth,
      hiddenPx: el.scrollWidth - el.clientWidth
    };
  });

  log('  .pipeline-scroll found: ' + scrollInfo.found);
  if (scrollInfo.found) {
    log('  scrollWidth: ' + scrollInfo.scrollWidth + 'px');
    log('  clientWidth: ' + scrollInfo.clientWidth + 'px');
    log('  overflowX computed: ' + scrollInfo.overflowX);
    log('  Needs horizontal scroll: ' + scrollInfo.hasHorizontalScroll);
    log('  Hidden content: ' + scrollInfo.hiddenPx + 'px');
  }

  // Step 6: Check parent overflow
  log('Step 6: Parent overflow analysis');
  const parentInfo = await page.evaluate(function() {
    var el = document.querySelector('.pipeline-scroll');
    if (!el) return [];
    var info = [];
    var current = el.parentElement;
    var depth = 0;
    while (current && depth < 6) {
      var styles = window.getComputedStyle(current);
      var rect = current.getBoundingClientRect();
      info.push({
        tag: current.tagName,
        id: current.id || '',
        className: current.className.slice(0, 70),
        overflowX: styles.overflowX,
        overflow: styles.overflow,
        width: Math.round(rect.width)
      });
      current = current.parentElement;
      depth++;
    }
    return info;
  });

  log('  Parent chain:');
  for (var j = 0; j < parentInfo.length; j++) {
    var p = parentInfo[j];
    log('    <' + p.tag + ' id="' + p.id + '" class="' + p.className + '"> overflow:' + p.overflow + ', overflowX:' + p.overflowX + ', width:' + p.width + 'px');
  }

  // Step 7: Attempt to scroll
  log('Step 7: Scroll to rightmost position');
  await page.evaluate(function() {
    var el = document.querySelector('.pipeline-scroll');
    if (el) el.scrollLeft = 9999;
  });
  await page.waitForTimeout(500);

  var afterScroll = await page.evaluate(function() {
    var el = document.querySelector('.pipeline-scroll');
    if (!el) return null;
    return { scrollLeft: el.scrollLeft, maxScroll: el.scrollWidth - el.clientWidth };
  });
  log('  scrollLeft after: ' + (afterScroll ? afterScroll.scrollLeft : 'N/A'));
  log('  maxScroll possible: ' + (afterScroll ? afterScroll.maxScroll : 'N/A'));

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_pipeline_scrolled_right.png') });
  log('  Screenshot: 05_pipeline_scrolled_right.png');

  const colDataScrolled = await page.evaluate(function() {
    var cols = document.querySelectorAll('.pipe-col');
    return Array.from(cols).map(function(col, i) {
      var rect = col.getBoundingClientRect();
      var headerSpans = col.querySelectorAll('.pipe-col-h span');
      var headerText = headerSpans.length > 0 ? headerSpans[0].textContent.trim() : 'col_' + i;
      return {
        header: headerText,
        x: Math.round(rect.x),
        right: Math.round(rect.right),
        inViewport: rect.x < window.innerWidth && rect.right > 0,
        fullyVisible: rect.x >= 0 && rect.right <= window.innerWidth
      };
    });
  });

  log('  Columns visible AFTER scrolling right:');
  for (var k = 0; k < colDataScrolled.length; k++) {
    var c = colDataScrolled[k];
    var s = c.fullyVisible ? 'FULLY' : (c.inViewport ? 'PARTIAL' : 'OUT');
    log('    "' + c.header + '": x=' + c.x + ', right=' + c.right + ' — ' + s);
  }

  // Step 8: 1920px test
  log('Step 8: Test at 1920x1080 viewport');
  await context.close();
  var ctx2 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  var page2 = await ctx2.newPage();
  await page2.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
  var inp2 = await page2.$$('input');
  if (inp2.length >= 2) {
    await inp2[0].fill('seller1');
    await inp2[1].fill('Seller123!');
    await page2.keyboard.press('Enter');
    await page2.waitForTimeout(3000);
  }
  await page2.goto(BASE_URL + '/pipeline', { waitUntil: 'networkidle', timeout: 10000 });
  await page2.waitForTimeout(1500);

  var scrollInfo2 = await page2.evaluate(function() {
    var el = document.querySelector('.pipeline-scroll');
    if (!el) return { found: false };
    return {
      found: true,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      hasHorizontalScroll: el.scrollWidth > el.clientWidth
    };
  });
  log('  1920px scroll info: ' + JSON.stringify(scrollInfo2));

  var colCount2 = await page2.evaluate(function() {
    return document.querySelectorAll('.pipe-col').length;
  });
  log('  Columns at 1920px: ' + colCount2);

  var colData2 = await page2.evaluate(function() {
    var cols = document.querySelectorAll('.pipe-col');
    return Array.from(cols).map(function(col, i) {
      var rect = col.getBoundingClientRect();
      var headerSpans = col.querySelectorAll('.pipe-col-h span');
      var headerText = headerSpans.length > 0 ? headerSpans[0].textContent.trim() : 'col_' + i;
      return {
        header: headerText,
        x: Math.round(rect.x),
        right: Math.round(rect.right),
        fullyVisible: rect.x >= 0 && rect.right <= window.innerWidth
      };
    });
  });

  log('  Columns at 1920px:');
  for (var m = 0; m < colData2.length; m++) {
    var cd = colData2[m];
    log('    "' + cd.header + '": x=' + cd.x + ', right=' + cd.right + ', fully=' + cd.fullyVisible);
  }

  await page2.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_pipeline_1920px.png') });
  log('  Screenshot: 06_pipeline_1920px.png');
  await ctx2.close();
  await browser.close();

  // Final summary
  log('');
  log('=== FINAL SUMMARY ===');
  var fullyVis = colData.filter(function(c) { return c.fullyVisible; });
  var partial = colData.filter(function(c) { return c.inViewport && !c.fullyVisible; });
  var outOf = colData.filter(function(c) { return !c.inViewport; });

  log('Columns found: ' + colData.length + '/7');
  log('Fully visible at 1280px: ' + fullyVis.length + ' [' + fullyVis.map(function(c) { return c.header; }).join(', ') + ']');
  log('Partially visible: ' + partial.length + ' [' + partial.map(function(c) { return c.header; }).join(', ') + ']');
  log('Out of viewport: ' + outOf.length + ' [' + outOf.map(function(c) { return c.header; }).join(', ') + ']');
  log('Horizontal scroll available: ' + (scrollInfo.found && scrollInfo.hasHorizontalScroll ? 'YES' : scrollInfo.found ? 'NO (all fits)' : 'N/A - container not found'));

  if (consoleErrors.length > 0) {
    log('\nConsole errors (' + consoleErrors.length + '):');
    consoleErrors.slice(0, 5).forEach(function(e) { log('  ' + e); });
  }
  if (networkErrors.length > 0) {
    log('\nNetwork errors (>=400): ' + networkErrors.length);
    networkErrors.slice(0, 5).forEach(function(e) { log('  ' + e); });
  }

  writeFileSync(path.join(__dirname, 'pipeline_scroll_results.txt'), results.join('\n'));
  log('\nResults written to: progress/pipeline_scroll_results.txt');
}

run().catch(function(e) {
  console.error('FATAL:', e.message);
  writeFileSync(path.join(__dirname, 'pipeline_scroll_results.txt'), results.join('\n') + '\nFATAL: ' + e.message);
  process.exit(1);
});
