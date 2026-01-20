import { chromium } from 'playwright';

async function testPageHandles() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });

  console.log('Navigating to http://localhost:5174/');
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);

  // Double-click on Page in sidebar to add Page node
  console.log('Adding Page node...');
  const pageItem = await page.getByText('Page', { exact: true }).first();
  await pageItem.dblclick();
  await page.waitForTimeout(1000);

  // Find the Page Layout node
  const pageNode = await page.locator('.react-flow__node').filter({ hasText: 'Page Layout' }).first();

  if (await pageNode.isVisible()) {
    console.log('\n=== PAGE NODE FOUND ===');

    const box = await pageNode.boundingBox();
    console.log(`Node dimensions: ${box?.width}x${box?.height} at (${box?.x}, ${box?.y})`);

    // Find ALL handles (both inside and outside the node)
    const allPageHandles = await page.locator('.react-flow__handle').all();
    console.log(`\nTotal handles on page: ${allPageHandles.length}`);

    // Get handles specifically for the Page node by checking data-nodeid
    // React Flow uses data-nodeid on handles
    const pageNodeId = await pageNode.getAttribute('data-id');
    console.log(`Page node ID: ${pageNodeId}`);

    // Find handles associated with this node
    const nodeHandles = await pageNode.locator('.react-flow__handle').all();
    console.log(`Handles within Page node container: ${nodeHandles.length}`);

    // Get detailed info about each handle
    console.log('\n--- Handle Details ---');
    for (let i = 0; i < nodeHandles.length; i++) {
      const handle = nodeHandles[i];
      const handleBox = await handle.boundingBox();
      const handleId = await handle.getAttribute('data-handleid');
      const handlePos = await handle.getAttribute('data-handlepos');
      const isTarget = (await handle.getAttribute('class'))?.includes('target');
      const style = await handle.getAttribute('style');

      console.log(`\nHandle ${i}:`);
      console.log(`  ID: ${handleId}`);
      console.log(`  Position: ${handlePos}`);
      console.log(`  Is Target (input): ${isTarget}`);
      console.log(`  Bounding box: x=${handleBox?.x?.toFixed(1)}, y=${handleBox?.y?.toFixed(1)}, w=${handleBox?.width}, h=${handleBox?.height}`);

      // Calculate relative Y position within the node
      if (box && handleBox) {
        const relativeY = handleBox.y - box.y;
        const percentY = ((relativeY / box.height) * 100).toFixed(1);
        console.log(`  Relative Y: ${relativeY.toFixed(1)}px (${percentY}% from top)`);
      }
    }

    // Check for overlapping handles
    console.log('\n--- Overlap Check ---');
    const targetHandles = nodeHandles.filter(async h =>
      (await h.getAttribute('class'))?.includes('target')
    );

    const handlePositions: { id: string; y: number }[] = [];
    for (const handle of nodeHandles) {
      const isTarget = (await handle.getAttribute('class'))?.includes('target');
      if (isTarget) {
        const hBox = await handle.boundingBox();
        const id = await handle.getAttribute('data-handleid');
        if (hBox && id) {
          handlePositions.push({ id, y: hBox.y });
        }
      }
    }

    // Sort by Y and check spacing
    handlePositions.sort((a, b) => a.y - b.y);
    console.log('Target handles sorted by Y:');
    for (let i = 0; i < handlePositions.length; i++) {
      const h = handlePositions[i];
      const spacing = i > 0 ? (h.y - handlePositions[i - 1].y).toFixed(1) : 'N/A';
      console.log(`  ${h.id}: y=${h.y.toFixed(1)}, spacing from prev: ${spacing}px`);
    }

    // Take screenshots
    await page.screenshot({ path: 'screenshots/handles-test-full.png', fullPage: true });

    if (box) {
      await page.screenshot({
        path: 'screenshots/handles-test-closeup.png',
        clip: {
          x: Math.max(0, box.x - 100),
          y: Math.max(0, box.y - 50),
          width: box.width + 150,
          height: box.height + 100
        }
      });
    }

    console.log('\n=== TEST COMPLETE ===');
  } else {
    console.log('ERROR: Page node not found on canvas');
  }

  console.log('\nScreenshots saved. Closing browser in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
}

testPageHandles().catch(console.error);
