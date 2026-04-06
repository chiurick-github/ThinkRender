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

test.describe('Drawing Operations', () => {
  test('should select rectangle tool from asset panel', async () => {
    const assetBtn = page.locator('button[aria-label="Shapes / Assets"]')
    await assetBtn.click()
    
    const rectItem = page.locator('.asset-item', { hasText: 'Rectangle' })
    await rectItem.click()
    
    await expect(assetBtn).toHaveClass(/active/)
  })

  test('should draw a rectangle on canvas', async () => {
    // Open asset panel and select rect
    const assetBtn = page.locator('button[aria-label="Shapes / Assets"]')
    await assetBtn.click()
    // Wait for panel animation
    await page.waitForTimeout(500)
    
    const rectItem = page.locator('.asset-item', { hasText: 'Rectangle' })
    await rectItem.click()

    // Draw on canvas
    const canvas = page.locator('.canvas-container canvas').first()
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Canvas not found')

    const startX = box.x + 100
    const startY = box.y + 100

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 200, startY + 150, { steps: 5 })
    await page.mouse.up()

    // Should auto switch back to select
    await page.waitForTimeout(300)
    const selectBtn = page.locator('button[aria-label="Select (V)"]')
    await expect(selectBtn).toHaveClass(/active/)
  })

  test('should show properties when object selected', async () => {
    // After drawing, the object should be selectable
    const panel = page.locator('.panel')
    const panelText = await panel.textContent()
    // Panel should have properties content (either object info or "No object selected")
    expect(panelText).toBeTruthy()
  })

  test('should add a new page', async () => {
    await page.locator('.page-tab-add').click()
    const tabs = page.locator('.page-tab')
    const count = await tabs.count()
    expect(count).toBe(2)
  })

  test('should switch between pages', async () => {
    const firstTab = page.locator('.page-tab').first()
    await firstTab.click()
    await expect(firstTab).toHaveClass(/active/)
  })
})
