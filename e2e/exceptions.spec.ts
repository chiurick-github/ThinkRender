import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test'

let app: ElectronApplication
let page: Page

test.beforeAll(async () => {
  app = await electron.launch({
    args: ['./out/main/index.js'],
    cwd: __dirname + '/..'
  })
  page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  // Wait for canvas to initialize
  await page.waitForSelector('.canvas-container canvas')
})

test.afterAll(async () => {
  await app.close()
})

test.describe('Exception & Edge Case Handling', () => {
  
  test('should not crash when deleting with no selection', async () => {
    // Ensure nothing is selected
    const panel = page.locator('.panel')
    await expect(panel).toContainText('No object selected')
    
    // Press Backspace and Delete
    await page.keyboard.press('Backspace')
    await page.keyboard.press('Delete')
    
    // App should still be alive and responsive
    const statusbar = page.locator('.statusbar')
    await expect(statusbar).toContainText('Ready')
  })

  test('should survive clicking without dragging (zero size shape)', async () => {
    // Select rectangle tool
    await page.locator('button[aria-label="Rectangle (R)"]').click()
    
    // Just click on canvas without moving to create 0x0 shape
    const canvas = page.locator('.canvas-container').first()
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Canvas not found')
    
    await page.mouse.click(box.x + 100, box.y + 100)
    
    // App should not crash. Check if properties panel says "No object selected"
    // because a 0x0 shape shouldn't normally be selectable or might be filtered out
    const panel = page.locator('.panel')
    await expect(panel).toBeVisible()
    
    // Put tool back to select
    await page.locator('button[aria-label="Select (V)"]').click()
  })

  test('should securely handle undo/redo on empty history', async () => {
    // Press Ctrl+Z or Meta+Z multiple times
    await page.keyboard.press('Meta+Z')
    await page.keyboard.press('Control+Z')
    
    // Press Shift+Meta+Z or Ctrl+Y
    await page.keyboard.press('Shift+Meta+Z')
    await page.keyboard.press('Control+Y')
    
    // Verify canvas is still there
    const canvas = page.locator('.canvas-container').first()
    await expect(canvas).toBeVisible()
  })

  test('should not show delete button on the last remaining page', async () => {
    // There is only Page 1 initially.
    const tabs = page.locator('.page-tab')
    await expect(tabs).toHaveCount(1)
    
    // The X icon (lucide icon inside span) should not exist
    const closeButtons = tabs.locator('span svg')
    await expect(closeButtons).toHaveCount(0)
    
    // Add page 2, close button should appear
    await page.locator('.page-tab-add').click()
    await expect(tabs).toHaveCount(2)
    await expect(closeButtons).toHaveCount(2) // Both tabs now have X
    
    // Delete page 2
    await closeButtons.nth(1).click()
    await expect(tabs).toHaveCount(1)
    
    // X should disappear again
    await expect(closeButtons).toHaveCount(0)
  })
})
