import { chromium } from 'playwright';

async function testFullWorkflow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  console.log('Navigating to http://localhost:5174/');
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'screenshots/workflow-01-start.png', fullPage: true });

  // Start fresh project
  console.log('\n=== Starting Fresh Project ===');
  const newBtn = await page.locator('button:has-text("New"), div:has-text("New")').first();
  if (await newBtn.isVisible()) {
    await newBtn.click();
    await page.waitForTimeout(500);
    // Handle confirmation if any
    const yesBtn = await page.getByRole('button', { name: /yes|confirm|ok/i }).first();
    if (await yesBtn.isVisible().catch(() => false)) {
      await yesBtn.click();
    }
    await page.waitForTimeout(500);
  }

  // 1. Add a Page node
  console.log('\n=== Adding Page Node ===');
  await page.getByText('Page', { exact: true }).first().dblclick();
  await page.waitForTimeout(500);

  // Find and move the Page node to a better position
  const pageNode = await page.locator('.react-flow__node:has-text("Page Layout")').first();
  const pageBox = await pageNode.boundingBox();
  if (pageBox) {
    // Drag it to the right side
    await page.mouse.move(pageBox.x + pageBox.width / 2, pageBox.y + 20);
    await page.mouse.down();
    await page.mouse.move(1200, 300, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);
  }

  // 2. Add Output nodes and position them
  console.log('\n=== Adding Output Nodes ===');
  for (let i = 0; i < 4; i++) {
    await page.getByText('Output', { exact: true }).first().dblclick();
    await page.waitForTimeout(300);
  }

  // Find and position Output nodes
  const outputNodes = await page.locator('.react-flow__node:has-text("OUTPUT")').all();
  console.log(`Added ${outputNodes.length} Output nodes`);

  // Position them vertically on the left
  for (let i = 0; i < outputNodes.length; i++) {
    const node = outputNodes[i];
    const box = await node.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + 20);
      await page.mouse.down();
      await page.mouse.move(400, 200 + i * 200, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(200);
    }
  }

  await page.screenshot({ path: 'screenshots/workflow-02-nodes-positioned.png', fullPage: true });

  // 3. Now try to connect Output nodes to Page handles
  console.log('\n=== Connecting Output Nodes to Page ===');

  // Re-find nodes after positioning
  const refreshedPageNode = await page.locator('.react-flow__node:has-text("Page Layout")').first();
  const refreshedOutputNodes = await page.locator('.react-flow__node:has-text("OUTPUT")').all();

  // Get page node target handles
  const pageTargetHandles = await refreshedPageNode.locator('.react-flow__handle-left').all();
  console.log(`Page node has ${pageTargetHandles.length} left handles`);

  // Get output node source handles
  for (let i = 0; i < Math.min(refreshedOutputNodes.length, pageTargetHandles.length); i++) {
    const outputNode = refreshedOutputNodes[i];
    const targetHandle = pageTargetHandles[i];

    // Find the right-side handle on output node
    const sourceHandle = await outputNode.locator('.react-flow__handle-right').first();

    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      const sourceBox = await sourceHandle.boundingBox();
      const targetBox = await targetHandle.boundingBox();

      if (sourceBox && targetBox) {
        console.log(`Connecting Output ${i} to Panel ${i}...`);
        console.log(`  Source: (${sourceBox.x + 5}, ${sourceBox.y + 5})`);
        console.log(`  Target: (${targetBox.x + 5}, ${targetBox.y + 5})`);

        // Perform the drag
        await page.mouse.move(sourceBox.x + 5, sourceBox.y + 5);
        await page.waitForTimeout(100);
        await page.mouse.down();
        await page.waitForTimeout(100);
        await page.mouse.move(targetBox.x + 5, targetBox.y + 5, { steps: 20 });
        await page.waitForTimeout(100);
        await page.mouse.up();
        await page.waitForTimeout(500);

        // Screenshot after each connection attempt
        await page.screenshot({ path: `screenshots/workflow-03-connect-${i}.png`, fullPage: true });
      }
    }
  }

  // 4. Check how many connections were made
  const edges = await page.locator('.react-flow__edge').all();
  console.log(`\nTotal connections made: ${edges.length}`);

  // 5. Now check if we can see images in the Page preview
  // First let's see if any Output nodes have generated images
  console.log('\n=== Checking for Generated Images ===');

  // Look for images in Output nodes
  const outputImages = await page.locator('.react-flow__node:has-text("OUTPUT") img').all();
  console.log(`Found ${outputImages.length} images in Output nodes`);

  // Check the Page node preview
  const pageImages = await page.locator('.react-flow__node:has-text("Page Layout") img').all();
  console.log(`Found ${pageImages.length} images in Page node preview`);

  await page.screenshot({ path: 'screenshots/workflow-04-final.png', fullPage: true });

  // Summary
  console.log('\n======== SUMMARY ========');
  console.log(`1. Page Node Handles:`);
  const finalPageHandles = await refreshedPageNode.locator('.react-flow__handle').all();
  console.log(`   Total handles: ${finalPageHandles.length}`);

  const leftHandles = await refreshedPageNode.locator('.react-flow__handle-left, .react-flow__handle[data-handlepos="left"]').all();
  console.log(`   Left (input) handles: ${leftHandles.length}`);

  // Check handle spacing
  const handleYs: number[] = [];
  for (const h of leftHandles) {
    const box = await h.boundingBox();
    if (box) handleYs.push(box.y);
  }
  handleYs.sort((a, b) => a - b);

  if (handleYs.length > 1) {
    let minSpacing = Infinity;
    for (let i = 1; i < handleYs.length; i++) {
      minSpacing = Math.min(minSpacing, handleYs[i] - handleYs[i - 1]);
    }
    console.log(`   Min vertical spacing: ${minSpacing.toFixed(1)}px`);
    console.log(`   Handles overlap: ${minSpacing < 10 ? 'YES (PROBLEM!)' : 'NO (Good)'}`);
  }

  console.log(`\n2. Connections:`);
  console.log(`   Total edges: ${edges.length}`);

  console.log(`\n3. Image Display:`);
  console.log(`   Images in Output nodes: ${outputImages.length}`);
  console.log(`   Images in Page preview: ${pageImages.length}`);

  console.log('\n========================');
  console.log('Test complete. Browser will close in 20 seconds.');
  console.log('Check screenshots/ folder for visual results.');

  await page.waitForTimeout(20000);
  await browser.close();
}

testFullWorkflow().catch(console.error);
