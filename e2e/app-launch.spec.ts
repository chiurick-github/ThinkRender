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
})

test.afterAll(async () => {
  await app.close()
})

test.describe('App Launch', () => {
  test('should launch without crashing', async () => {
    expect(app).toBeTruthy()
  })

  test('should have a window', async () => {
    const windows = app.windows()
    expect(windows.length).toBeGreaterThan(0)
  })

  test('should display the title bar with ThinkRender', async () => {
    const titleText = await page.textContent('.titlebar-title')
    expect(titleText).toContain('ThinkRender')
  })

  test('should display the toolbar', async () => {
    const toolbar = await page.locator('.toolbar')
    await expect(toolbar).toBeVisible()
  })

  test('should display the canvas container', async () => {
    const canvas = await page.locator('.canvas-container').first()
    await expect(canvas).toBeVisible()
  })

  test('should display the properties panel', async () => {
    const panel = await page.locator('.panel')
    await expect(panel).toBeVisible()
  })

  test('should display the status bar', async () => {
    const statusbar = await page.locator('.statusbar')
    await expect(statusbar).toBeVisible()
  })

  test('should display Page 1 tab', async () => {
    const tab = await page.locator('.page-tab')
    await expect(tab).toHaveText(/Page 1/)
  })

  test('should show Ready in status bar', async () => {
    const ready = await page.textContent('.statusbar')
    expect(ready).toContain('Ready')
  })

  test('should show 100% zoom', async () => {
    const statusbar = await page.textContent('.statusbar')
    expect(statusbar).toContain('100%')
  })
})
