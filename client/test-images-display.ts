import { chromium } from 'playwright';

async function testImagesDisplay() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1920, height: 1080 });

  console.log('Navigating to http://localhost:5174/');
  await page.goto('http://localhost:5174/');
  await page.waitForTimeout(2000);

  // Open settings to set mock provider
  console.log('\n=== Checking Settings ===');
  const settingsBtn = await page.getByText('Settings', { exact: true }).first();
  if (await settingsBtn.isVisible()) {
    await settingsBtn.click();
    await page.waitForTimeout(500);

    // Look for model selector
    const modelSelect = await page.locator('select').first();
    if (await modelSelect.isVisible()) {
      const options = await modelSelect.locator('option').allTextContents();
      console.log('Available models:', options);

      // Check if mock is selected
      const selected = await modelSelect.inputValue();
      console.log('Currently selected model:', selected);
    }

    // Close settings
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }

  // Start fresh
  console.log('\n=== Starting Fresh Project ===');
  const newBtn = await page.locator('button:has-text("New"), div:has-text("New")').first();
  await newBtn.click();
  await page.waitForTimeout(1000);

  // Add a Parameters node to set mock model
  console.log('\n=== Adding Parameters Node (for mock model) ===');
  await page.getByText('Parameters', { exact: true }).first().dblclick();
  await page.waitForTimeout(500);

  // Find the Parameters node and set model to mock
  const paramsNode = await page.locator('.react-flow__node:has-text("PARAMETERS")').first();
  if (await paramsNode.isVisible()) {
    await paramsNode.click();
    await page.waitForTimeout(300);

    // Look for model dropdown in the node or properties panel
    const modelDropdown = await page.locator('select').first();
    if (await modelDropdown.isVisible()) {
      // Check for 'mock' option
      try {
        await modelDropdown.selectOption('mock');
        console.log('Set model to mock');
      } catch (e) {
        console.log('Could not set model to mock, options:', await modelDropdown.locator('option').allTextContents());
      }
    }
  }

  // Add an Action node (provides prompt content)
  console.log('\n=== Adding Action Node ===');
  await page.getByText('Action', { exact: true }).first().dblclick();
  await page.waitForTimeout(500);

  // Set action text
  const actionNode = await page.locator('.react-flow__node:has-text("ACTION")').first();
  if (await actionNode.isVisible()) {
    const actionInput = await actionNode.locator('textarea, input').first();
    if (await actionInput.isVisible()) {
      await actionInput.fill('A beautiful sunset over mountains');
    }
  }

  // Add Output node
  console.log('\n=== Adding Output Node ===');
  await page.getByText('Output', { exact: true }).first().dblclick();
  await page.waitForTimeout(500);

  // Position nodes
  const nodes = await page.locator('.react-flow__node').all();
  console.log(`Total nodes: ${nodes.length}`);

  // Connect Action to Output (or whatever setup is needed)
  // For now, let's just position and generate

  await page.screenshot({ path: 'screenshots/image-test-01-setup.png', fullPage: true });

  // Find Output node and click Generate
  console.log('\n=== Generating Images ===');
  const outputNode = await page.locator('.react-flow__node:has-text("OUTPUT")').first();

  // Click on Generate button
  const generateBtn = await outputNode.locator('button:has-text("Generate")').first();
  if (await generateBtn.isVisible()) {
    console.log('Found Generate button, clicking...');
    await generateBtn.click();

    // Wait for generation (mock takes 1.5-2.5 seconds)
    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'screenshots/image-test-02-generated.png', fullPage: true });
  } else {
    console.log('Generate button not found in Output node');
  }

  // Check if image was generated
  const outputImage = await outputNode.locator('img').first();
  if (await outputImage.isVisible()) {
    console.log('SUCCESS: Image generated in Output node!');
    const imgSrc = await outputImage.getAttribute('src');
    console.log('Image URL:', imgSrc?.slice(0, 60) + '...');
  } else {
    console.log('No image found in Output node');
  }

  // Now add a Page node and connect the Output to it
  console.log('\n=== Adding Page Node ===');
  await page.getByText('Page', { exact: true }).first().dblclick();
  await page.waitForTimeout(500);

  // Move Page node to the right
  const pageNode = await page.locator('.react-flow__node:has-text("Page Layout")').first();
  const pageBox = await pageNode.boundingBox();
  if (pageBox) {
    await page.mouse.move(pageBox.x + pageBox.width / 2, pageBox.y + 20);
    await page.mouse.down();
    await page.mouse.move(1400, 300, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: 'screenshots/image-test-03-page-added.png', fullPage: true });

  // Connect Output to Page
  console.log('\n=== Connecting Output to Page ===');
  const refreshedOutputNode = await page.locator('.react-flow__node:has-text("OUTPUT")').first();
  const refreshedPageNode = await page.locator('.react-flow__node:has-text("Page Layout")').first();

  // Get source handle (right side of Output - but only if it has a generated image)
  const sourceHandle = await refreshedOutputNode.locator('.react-flow__handle-right, .react-flow__handle[data-handlepos="right"]').first();
  const targetHandle = await refreshedPageNode.locator('.react-flow__handle-left, .react-flow__handle[data-handlepos="left"]').first();

  if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
    const sourceBox = await sourceHandle.boundingBox();
    const targetBox = await targetHandle.boundingBox();

    if (sourceBox && targetBox) {
      console.log('Connecting Output to Page panel 0...');
      await page.mouse.move(sourceBox.x + 5, sourceBox.y + 5);
      await page.mouse.down();
      await page.mouse.move(targetBox.x + 5, targetBox.y + 5, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(500);
    }
  }

  await page.screenshot({ path: 'screenshots/image-test-04-connected.png', fullPage: true });

  // Check if image appears in Page preview
  console.log('\n=== Checking Page Preview ===');
  const pagePreviewImages = await refreshedPageNode.locator('img').all();
  console.log(`Images in Page node preview: ${pagePreviewImages.length}`);

  if (pagePreviewImages.length > 0) {
    for (let i = 0; i < pagePreviewImages.length; i++) {
      const img = pagePreviewImages[i];
      const src = await img.getAttribute('src');
      console.log(`  Image ${i}: ${src?.slice(0, 60)}...`);
    }
  }

  // Take a closeup of the Page node to see the preview
  const finalPageBox = await refreshedPageNode.boundingBox();
  if (finalPageBox) {
    await page.screenshot({
      path: 'screenshots/image-test-05-page-closeup.png',
      clip: {
        x: Math.max(0, finalPageBox.x - 50),
        y: Math.max(0, finalPageBox.y - 50),
        width: finalPageBox.width + 100,
        height: finalPageBox.height + 100
      }
    });
  }

  // Final screenshot
  await page.screenshot({ path: 'screenshots/image-test-final.png', fullPage: true });

  // Summary
  console.log('\n======== SUMMARY ========');
  console.log('1. Output node image generated:', await outputImage.isVisible() ? 'YES' : 'NO');
  console.log('2. Images in Page preview:', pagePreviewImages.length);

  const edges = await page.locator('.react-flow__edge').all();
  console.log('3. Total connections:', edges.length);

  console.log('\n========================');
  console.log('Test complete. Browser will close in 20 seconds.');

  await page.waitForTimeout(20000);
  await browser.close();
}

testImagesDisplay().catch(console.error);
