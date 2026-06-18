import express from "express"
import { config as dotEnvConfig } from "dotenv"
import puppeteer from "puppeteer"

dotEnvConfig()
const app = express()
const PORT: Number = Number(process.env.PORT) || 7000

async function takeScreenshot(url: string, option: "buffer"): Promise<Buffer>
async function takeScreenshot(url: string, option: "base64"): Promise<string>
async function takeScreenshot(url: string, option: "buffer" | "base64"): Promise<Buffer | string> {
  const browser = await puppeteer.launch({ headless: true })

  try {
    const page = await browser.newPage()
    await page.goto(url, {
      waitUntil: "networkidle2"
    })

    const screenshot = await page.screenshot({
      fullPage: true,
      encoding: option == "buffer" ? "binary" : "base64",
      type: "webp"
    })

    return screenshot as Buffer | string
  }
  catch(error) {
    throw error
  }
  finally {
    await browser.close()
  }
}

app.get("/", (req, res) => {
  res.send("Hello from \"/\"")
})

app.get("/dev/screenshot", async (req, res) => {
  const file = await takeScreenshot("http://localhost:7000/", "base64")
  res.send(`<img src="data:image/webp;base64,${file}" />`)
})

app.listen(PORT, () => {
  console.log(`--------------------------------------------`)
  console.log(`App is running successfully on port ${PORT}.`)
  console.log("\n")
})