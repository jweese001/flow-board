import { chromium } from 'playwright';

async function testPageNode() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to http://localhost:5174/');
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({ path: 'screenshots/01-initial.png' });
  console.log('Screenshot: 01-initial.png');

  // Open the add node menu and find Page node
  console.log('Looking for Add Node button...');

  // Try to find the add button or right-click menu
  const addButton = await page.locator('button:has-text("Add")').first();
  if (await addButton.isVisible()) {
    await addButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/02-add-menu.png' });
  } else {
    // Try right-click on canvas
    console.log('No Add button found, trying right-click...');
    const canvas = await page.locator('.react-flow').first();
    await canvas.click({ button: 'right', position: { x: 400, y: 300 } });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/02-context-menu.png' });
  }

  // Look for Page option
  const pageOption = await page.locator('text=Page').first();
  if (await pageOption.isVisible()) {
    console.log('Found Page option, clicking...');
    await pageOption.click();
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: 'screenshots/03-after-add.png' });

  // Check for handles on the Page node
  console.log('Looking for Page node handles...');
  const handles = await page.locator('.react-flow__handle').all();
  console.log(`Found ${handles.length} handles total`);

  // Get handle positions
  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    const box = await handle.boundingBox();
    if (box) {
      console.log(`Handle ${i}: x=${box.x}, y=${box.y}, width=${box.width}, height=${box.height}`);
    }
  }

  await page.screenshot({ path: 'screenshots/04-handles-visible.png' });

  console.log('Test complete. Browser left open for manual inspection.');
  // Don't close - leave open for manual testing
  // await browser.close();
}

testPageNode().catch(console.error);
