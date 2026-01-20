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

  // First, let's look at the full HTML structure of the sidebar
  const sidebarItems = await page.locator('[class*="sidebar"] button, [class*="sidebar"] div[role="button"]').all();
  console.log(`Found ${sidebarItems.length} sidebar interactive elements`);

  // Find and click the Page item - look for the row containing "Page"
  // The sidebar has items with text - need to find the exact clickable element
  console.log('\nLooking for Page button in sidebar...');

  // Try clicking directly on the element that contains "Page" text
  // First let's inspect the sidebar structure
  const sidebarHTML = await page.locator('.cursor-pointer').first().evaluate(el => el.outerHTML);
  console.log('Sample sidebar element:', sidebarHTML.slice(0, 200));

  // Look for all clickable items and find the one with "Page"
  const clickableItems = await page.locator('.cursor-pointer').all();
  console.log(`Found ${clickableItems.length} clickable items`);

  for (let i = 0; i < clickableItems.length; i++) {
    const text = await clickableItems[i].textContent();
    if (text && text.includes('Page')) {
      console.log(`Found Page item at index ${i}: "${text}"`);
      await clickableItems[i].click();
      await page.waitForTimeout(1000);
      break;
    }
  }

  await page.screenshot({ path: 'screenshots/02-after-click.png', fullPage: true });

  // Check if a Page node appeared on canvas
  const pageNodeOnCanvas = await page.locator('.react-flow__node:has-text("Page")').first();
  if (await pageNodeOnCanvas.isVisible().catch(() => false)) {
    console.log('SUCCESS: Page node added to canvas!');

    // Get details about the node
    const box = await pageNodeOnCanvas.boundingBox();
    console.log(`Page node position: x=${box?.x}, y=${box?.y}, w=${box?.width}, h=${box?.height}`);

    // Find handles
    const handles = await pageNodeOnCanvas.locator('.react-flow__handle').all();
    console.log(`Found ${handles.length} handles on Page node`);

    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i];
      const handleBox = await handle.boundingBox();
      const handleId = await handle.getAttribute('data-handleid');
      const handlePos = await handle.getAttribute('data-handlepos');
      const style = await handle.getAttribute('style');
      console.log(`  Handle ${i}: id="${handleId}", pos="${handlePos}"`);
      console.log(`    Position: x=${handleBox?.x}, y=${handleBox?.y}`);
      console.log(`    Style: ${style?.slice(0, 100)}`);
    }

    // Take closeup
    if (box) {
      await page.screenshot({
        path: 'screenshots/03-page-node-closeup.png',
        clip: {
          x: Math.max(0, box.x - 50),
          y: Math.max(0, box.y - 50),
          width: box.width + 100,
          height: box.height + 100
        }
      });
    }
  } else {
    console.log('Page node not visible on canvas');

    // Let's look at all nodes on canvas
    const allNodes = await page.locator('.react-flow__node').all();
    console.log(`Total nodes on canvas: ${allNodes.length}`);

    for (let i = 0; i < allNodes.length; i++) {
      const text = await allNodes[i].textContent();
      console.log(`  Node ${i}: ${text?.slice(0, 50)}...`);
    }
  }

  // Try to find the Page option and double-click it
  console.log('\nTrying double-click on Page in sidebar...');
  const pageInSidebar = await page.getByText('Page', { exact: true }).first();
  if (await pageInSidebar.isVisible()) {
    await pageInSidebar.dblclick();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/04-after-dblclick.png', fullPage: true });
  }

  // Check canvas again
  const pageNodes = await page.locator('.react-flow__node').filter({ hasText: 'Page Layout' }).all();
  console.log(`Page Layout nodes on canvas: ${pageNodes.length}`);

  await page.screenshot({ path: 'screenshots/final.png', fullPage: true });

  console.log('\nTest complete. Keeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
  await browser.close();
}

testPageNode().catch(console.error);
