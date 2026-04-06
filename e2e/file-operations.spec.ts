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

test.describe('File Operations', () => {
  test('should show Untitled in title bar for new file', async () => {
    const title = await page.textContent('.titlebar-title')
    expect(title).toContain('Untitled')
  })

  test('should show Page 1/1 in status bar', async () => {
    const statusbar = await page.textContent('.statusbar')
    expect(statusbar).toContain('Page 1/1')
  })

  test('should show No selection initially', async () => {
    const statusbar = await page.textContent('.statusbar')
    expect(statusbar).toContain('No selection')
  })

  test('title should contain ThinkRender', async () => {
    const title = await app.evaluate(async ({ BrowserWindow }) => {
      return BrowserWindow.getAllWindows()[0].getTitle()
    })
    expect(title).toContain('ThinkRender')
  })
})
