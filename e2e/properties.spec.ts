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
  await page.waitForSelector('.canvas-container canvas')
})

test.afterAll(async () => {
  await app.close()
})

test.describe('Editable Properties & Layers', () => {
  test('should draw an object and edit its properties without crashing', async () => {
    // Select Rect tool via asset panel
    const assetBtn = page.locator('button[aria-label="Shapes / Assets"]')
    await assetBtn.click()
    await page.waitForTimeout(500)
    await page.locator('.asset-item', { hasText: 'Rectangle' }).click()
    
    // Draw it matching drawing.spec.ts
    const canvas = page.locator('.canvas-container canvas').first()
    const box = await canvas.boundingBox()
    if (!box) throw new Error('Canvas not found')
    
    const startX = box.x + 100
    const startY = box.y + 100

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 100, startY + 100, { steps: 5 }) // Small square
    await page.mouse.up()

    // Wait for the tool to automatically switch back to select
    await page.waitForTimeout(300)
    
    // Must click the object to select it!
    await page.mouse.click(startX + 50, startY + 50)

    // Check panel has property inputs
    const panel = page.locator('.panel')
    await expect(panel).toContainText('rect', { timeout: 10000 })
    
    // Edit X coordinate
    const xInput = panel.getByLabel('X Position')
    await xInput.fill('50')
    await xInput.blur() // triggers handleCommit -> fabric:save-history
    
    // The input should retain 50 as it syncs back to Zustand
    await expect(xInput).toHaveValue('50')
    
    // Edit Opacity Op
    const opInput = panel.getByLabel('Opacity').nth(0) 
    await opInput.fill('50')
    await opInput.blur()
    await expect(opInput).toHaveValue('50')
    
    // -- Layer Reordering --
    // Check buttons are present since it is still selected
    const sendToBack = panel.getByTitle('Send to Back')
    await expect(sendToBack).toBeVisible()
    
    // Click them to ensure no crash
    await sendToBack.click()
    await panel.getByTitle('Bring Forward').click()
    await panel.getByTitle('Bring to Front').click()
    
    // Use clear active object
    await page.mouse.click(box.x + 10, box.y + 10) // click empty space to clear selection
    await expect(panel).toContainText('No object selected')
  })
})
