import express from "express"
import { config as dotEnvConfig } from "dotenv"
import puppeteer, { type Browser } from "puppeteer"
import { takeScreenshot } from "./libs/screenshot"

dotEnvConfig()
const app = express()
const PORT: Number = Number(process.env.PORT) || 7000

let globalBrowser: Browser | null = null;

async function getBrowser(): Promise<void> {
  if(!globalBrowser) {
    const browser = await puppeteer.launch()
    globalBrowser = browser
  }
}

await getBrowser()


app.get("/", (req, res) => {
  res.send("Hello from \"/\"")
})

app.get("/dev/screenshot", async (req, res) => {
  const file = await takeScreenshot(globalBrowser!, {
    option: "base64",
    url: "https://google.com/"
  })
  res.send(`<img src="data:image/webp;base64,${file}" />`)
})

app.listen(PORT, async () => {
  await getBrowser()
  console.log(`--------------------------------------------`)
  console.log(`App is running successfully on port ${PORT}.`)
  console.log("\n")
})

// After your app.listen()
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing browser...')
  if (globalBrowser) await globalBrowser.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing browser...')
  if (globalBrowser) await globalBrowser.close()
  process.exit(0)
})