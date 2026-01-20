import { chromium } from 'playwright';

async function testPageNode() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });

  console.log('Navigating to http://localhost:5174/');
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);

  // Take initial screenshot
  await page.screenshot({ path: 'screenshots/01-initial.png', fullPage: true });
  console.log('Screenshot: 01-initial.png');

  // Click on "Page" in the left sidebar to add a Page node
  console.log('Looking for Page in sidebar...');
  const pageAddButton = await page.locator('text=Page').first();

  // Check if the Page item has a + button
  const pageRow = await page.locator('.cursor-pointer:has-text("Page")').first();
  if (await pageRow.isVisible()) {
    console.log('Found Page row in sidebar, clicking...');
    await pageRow.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/02-clicked-page.png', fullPage: true });
  }

  // Now look for Page node on canvas
  const pageNode = await page.locator('text=Page Layout').first();
  if (await pageNode.isVisible()) {
    console.log('Page node added to canvas!');

    // Take screenshot of the Page node
    await page.screenshot({ path: 'screenshots/03-page-node-added.png', fullPage: true });

    // Find all handles on the page node
    // First find the page node container
    const pageNodeContainer = await page.locator('.react-flow__node:has-text("Page Layout")').first();

    if (await pageNodeContainer.isVisible()) {
      const box = await pageNodeContainer.boundingBox();
      console.log(`Page node bounding box: x=${box?.x}, y=${box?.y}, w=${box?.width}, h=${box?.height}`);

      // Find handles within/near the page node
      const handles = await pageNodeContainer.locator('.react-flow__handle').all();
      console.log(`Found ${handles.length} handles in Page node`);

      // Get details on each handle
      for (let i = 0; i < handles.length; i++) {
        const handle = handles[i];
        const handleBox = await handle.boundingBox();
        const id = await handle.getAttribute('data-handleid');
        const type = await handle.getAttribute('data-handlepos');
        console.log(`Handle ${i}: id=${id}, type=${type}, x=${handleBox?.x}, y=${handleBox?.y}`);
      }

      // Take a zoomed screenshot of just the page node area
      if (box) {
        await page.screenshot({
          path: 'screenshots/04-page-node-closeup.png',
          clip: {
            x: Math.max(0, box.x - 50),
            y: Math.max(0, box.y - 50),
            width: box.width + 100,
            height: box.height + 100
          }
        });
        console.log('Screenshot: 04-page-node-closeup.png');
      }
    }
  } else {
    console.log('Page node not found. Trying to add it via the + button...');

    // Look for the + button next to Page
    const plusButton = await page.locator('button:has-text("+")').last();
    if (await plusButton.isVisible()) {
      await plusButton.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'screenshots/03-after-add-attempt.png', fullPage: true });
  }

  // Now let's try different layouts
  console.log('\n--- Testing Layout Selection ---');

  // Click on the Page node to select it (if it exists)
  const pageNodeForSelect = await page.locator('.react-flow__node:has-text("Page Layout")').first();
  if (await pageNodeForSelect.isVisible()) {
    await pageNodeForSelect.click();
    await page.waitForTimeout(500);

    // Look for layout selector
    const layoutSelect = await page.locator('select').first();
    if (await layoutSelect.isVisible()) {
      // Get all layout options
      const options = await layoutSelect.locator('option').allTextContents();
      console.log('Available layouts:', options);

      // Try selecting 6-up layout (should have 6 handles)
      await layoutSelect.selectOption('6-up');
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/05-layout-6up.png', fullPage: true });

      // Count handles again
      const handles6up = await pageNodeForSelect.locator('.react-flow__handle').all();
      console.log(`6-up layout handles: ${handles6up.length}`);
    }
  }

  console.log('\n--- Final State ---');
  await page.screenshot({ path: 'screenshots/final.png', fullPage: true });

  console.log('Test complete. Check screenshots folder.');
  console.log('Browser left open for manual inspection - press Ctrl+C to close.');

  // Keep browser open
  await page.waitForTimeout(60000);
  await browser.close();
}

testPageNode().catch(console.error);
