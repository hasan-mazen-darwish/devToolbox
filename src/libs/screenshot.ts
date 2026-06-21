import type { Page, Viewport } from "puppeteer"

interface ScreenshotOptions {
  url: string
  option?: "buffer" | "base64",
  imageExtension?: "webp" | "png" | "jpeg",
  qualityOfImage?: number,
  optimizeForSpeed?: boolean,
  viewport?: Viewport,
  fullPage?: boolean,
}

/**
 * The main screenshotting function that returns the image in either base64 string or a buffer object.
 * 
 * @param page The puppeteer page instance used for the screenshotting.
 * 
 * @param options the options you give to the screenshotting function.
 * 
 * `options.url`: **required**. the URL given to the function so it can copy it.
 * 
 * `options.option`: *optional*. takes the value of either `buffer` or `base64`. default is `buffer`.
 * 
 * `options.imageExtension`: *optional*. takes three values: `webp`, `png` or `jpeg`. this defines the type of the image (as follows). default is `webp`
 * 
 * `options.qualityOfImage`: *optional*. takes a number between 0 and 100. **NOT** applicable to PNG screenshots.
 * 
 * `options.optimizeForSpeed`: *optional*. self explanatory, default is `true`.
 * 
 * `options.viewport`: *optional*. has these properties:
 * - `width`: the width of the viewed page. (number)
 * - `height`: the height of the viewed page. (number)
 * - `deviceScaleFactor`: the "zoom" the page will be screenshotted at. (number)
 * - `isMobile`: self explanatory. (boolean)
 * - `isLandscape`: tells the page if the device is on landscape mode, in other words, if the width is always the biggest number. (boolean)
 * - `hasTouch`: self explanatory. (boolean)
 * 
 * `options.fullPage`: *optional*. it defines to either capture an image of the full page or just a part. default is `true`.
 * 
 * @example
 * import puppeteer from "puppeteer";
 * 
 * const browser = await puppeteer
 * takeScreenshot(browser, {
 *  url: "https://google.com/",
 *  option: "base64"
 * });
 */

async function takeScreenshot(page: Page, options: ScreenshotOptions & { option: "buffer" }): Promise<Buffer>
async function takeScreenshot(page: Page, options: ScreenshotOptions & { option: "base64" }): Promise<string>
// @ts-ignore
async function takeScreenshot(page: Page, options: ScreenshotOptions): Promise<Buffer | string> {
  const retriesCount = 3

  for(let i = 1 ; i <= retriesCount ; i++) {
    try {
      await page.goto(options.url, {
        waitUntil: "networkidle2",
        timeout: 30_000
      })

      // Add user-agent to avoid blocking
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

      const defaultQuality = 70
      const qualityOfImage = Math.max(0, Math.min(options.qualityOfImage || defaultQuality, 100));

      await page.setViewport(options.viewport || null)
      const screenshot = await page.screenshot({
        fullPage: options.fullPage ?? true,
        encoding: options.option ? (options.option == "buffer" ? "binary" : "base64") : "binary",
        type: options.imageExtension || "webp",
        quality: qualityOfImage,
        optimizeForSpeed: options.optimizeForSpeed ?? true
      })

      return screenshot as Buffer | string
    }
    catch(error) {
      console.error(`Opening new page with URL ${options.url}, Try ${i} failed with error. Retrying...`)
      console.log(error)
      if(i == retriesCount) throw error
    }
  }
}

export { takeScreenshot, type ScreenshotOptions }