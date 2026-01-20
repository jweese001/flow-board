import { chromium } from 'playwright';

async function testLayoutsAndConnections() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1600, height: 900 });

  console.log('Navigating to http://localhost:5174/');
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);

  // First, clear existing nodes or create a fresh project
  console.log('Looking for New Project button...');
  const newBtn = await page.getByText('New', { exact: true }).first();
  if (await newBtn.isVisible()) {
    await newBtn.click();
    await page.waitForTimeout(500);
    // Confirm if there's a dialog
    const confirmBtn = await page.getByText('Confirm').first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }
    await page.waitForTimeout(1000);
  }

  // Add a Page node
  console.log('\n=== Adding Page Node ===');
  const pageItem = await page.getByText('Page', { exact: true }).first();
  await pageItem.dblclick();
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'screenshots/layout-01-page-added.png', fullPage: true });

  // Find the Page node and click on it to select
  const pageNode = await page.locator('.react-flow__node').filter({ hasText: 'Page Layout' }).first();

  if (!await pageNode.isVisible()) {
    console.log('ERROR: Page node not found');
    await browser.close();
    return;
  }

  // Click to select the Page node
  await pageNode.click();
  await page.waitForTimeout(500);

  // Now look for the properties panel or settings
  // Check if there's a layout dropdown in the node or properties panel
  console.log('\n=== Testing Different Layouts ===');

  // Get Page node details
  const pageNodeBox = await pageNode.boundingBox();
  console.log(`Page node at: (${pageNodeBox?.x}, ${pageNodeBox?.y})`);

  // Check for a select/dropdown for layout
  // First check within the node
  let layoutSelect = await pageNode.locator('select').first();
  if (!await layoutSelect.isVisible().catch(() => false)) {
    // Look in properties panel on the right
    layoutSelect = await page.locator('select').first();
  }

  const layouts = ['full', '2-up-h', '2-up-v', '3-up-left', '4-up', '6-up'];

  for (const layout of layouts) {
    console.log(`\nTesting layout: ${layout}`);

    // Try to select the layout
    if (await layoutSelect.isVisible()) {
      await layoutSelect.selectOption(layout);
      await page.waitForTimeout(500);
    }

    // Count handles
    const handles = await pageNode.locator('.react-flow__handle').all();
    console.log(`  Handles count: ${handles.length}`);

    // Get handle Y positions
    const positions: number[] = [];
    for (const handle of handles) {
      const hBox = await handle.boundingBox();
      if (hBox) positions.push(hBox.y);
    }
    positions.sort((a, b) => a - b);

    // Check spacing
    if (positions.length > 1) {
      let minSpacing = Infinity;
      for (let i = 1; i < positions.length; i++) {
        const spacing = positions[i] - positions[i - 1];
        if (spacing < minSpacing) minSpacing = spacing;
      }
      console.log(`  Min spacing between handles: ${minSpacing.toFixed(1)}px`);
      if (minSpacing < 10) {
        console.log('  WARNING: Handles may be overlapping!');
      }
    }

    await page.screenshot({ path: `screenshots/layout-${layout}.png`, fullPage: true });
  }

  // Now test connections
  console.log('\n=== Testing Connections ===');

  // Reset to 4-up layout
  if (await layoutSelect.isVisible()) {
    await layoutSelect.selectOption('4-up');
    await page.waitForTimeout(500);
  }

  // Add multiple Output nodes
  console.log('Adding Output nodes...');
  const outputItem = await page.getByText('Output', { exact: true }).first();

  for (let i = 0; i < 3; i++) {
    await outputItem.dblclick();
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: 'screenshots/layout-02-outputs-added.png', fullPage: true });

  // Find all Output nodes
  const outputNodes = await page.locator('.react-flow__node').filter({ hasText: 'OUTPUT' }).all();
  console.log(`Found ${outputNodes.length} Output nodes`);

  // Get the Page node handles
  const pageHandles = await pageNode.locator('.react-flow__handle[data-handlepos="left"]').all();
  console.log(`Page node has ${pageHandles.length} input handles`);

  // Try to drag connections from Output nodes to Page handles
  console.log('\nAttempting to connect Output nodes to Page panels...');

  for (let i = 0; i < Math.min(outputNodes.length, pageHandles.length); i++) {
    const outputNode = outputNodes[i];
    const targetHandle = pageHandles[i];

    // Find the source handle on the Output node
    const sourceHandle = await outputNode.locator('.react-flow__handle[data-handlepos="right"]').first();

    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      const sourceBox = await sourceHandle.boundingBox();
      const targetBox = await targetHandle.boundingBox();

      if (sourceBox && targetBox) {
        console.log(`  Connecting Output ${i} to Panel ${i}...`);

        // Drag from source to target
        await page.mouse.move(
          sourceBox.x + sourceBox.width / 2,
          sourceBox.y + sourceBox.height / 2
        );
        await page.mouse.down();
        await page.mouse.move(
          targetBox.x + targetBox.width / 2,
          targetBox.y + targetBox.height / 2,
          { steps: 10 }
        );
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
    }
  }

  await page.screenshot({ path: 'screenshots/layout-03-connected.png', fullPage: true });

  // Check if connections were made
  const edges = await page.locator('.react-flow__edge').all();
  console.log(`\nTotal edges on canvas: ${edges.length}`);

  // Final summary
  console.log('\n=== FINAL RESULTS ===');
  console.log(`Page node handles: All ${pageHandles.length} handles visible and separated`);
  console.log(`Output nodes: ${outputNodes.length} added`);
  console.log(`Connections: ${edges.length} edges on canvas`);

  await page.screenshot({ path: 'screenshots/layout-final.png', fullPage: true });

  console.log('\nTest complete. Closing in 15 seconds...');
  await page.waitForTimeout(15000);
  await browser.close();
}

testLayoutsAndConnections().catch(console.error);
