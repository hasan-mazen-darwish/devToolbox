import type { Browser, Page } from "puppeteer"

interface ScreenshotOptions {
  url: string
  option?: "buffer" | "base64",
  imageExtension?: "webp" | "png" | "jpeg",
  qualityOfImage?: number
}

/**
 * The main screenshotting function that returns the image in either base64 string or a buffer object.
 * 
 * @param browser The puppeteer browser instance used for the screenshotting.
 * 
 * @param options the options you give to the screenshotting function.
 * 
 * `options.url`: **required**. the URL given to the function so it can copy it.
 * 
 * `options.option`: *optional*. takes the value of either `buffer` or `base64`. default is `buffer`.
 * 
 * `options.imageExtension`: *optional*. takes three values: `webp`, `png` or `jpeg`. this defines the type of the image (as follows). default is `webp`
 * 
 * `options.qualityOfImage`: *optional*. takes a number
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

async function takeScreenshot(browser: Browser, options: ScreenshotOptions & { option: "buffer" }): Promise<Buffer>
async function takeScreenshot(browser: Browser, options: ScreenshotOptions & { option: "base64" }): Promise<string>
// @ts-ignore
async function takeScreenshot(browser: Browser, options: ScreenshotOptions): Promise<Buffer | string> {
  let page: Page | null = null
  const retriesCount = 3

  for(let i = 1 ; i <= retriesCount ; i++) {
    try {
      page = await browser.newPage()
      await page.goto(options.url, {
        waitUntil: "networkidle2"
      })

      const defaultQuality = 70
      const qualityOfImage = Math.max(Math.min(options.qualityOfImage || defaultQuality), 0)

      const screenshot = await page.screenshot({
        fullPage: true,
        encoding: options.option ? (options.option == "buffer" ? "binary" : "base64") : "binary",
        type: options.imageExtension || "webp",
        quality: qualityOfImage
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

export { takeScreenshot }