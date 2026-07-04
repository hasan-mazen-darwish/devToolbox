import express from "express"
import { config as dotEnvConfig } from "dotenv"
import { takeScreenshot, type ScreenshotOptions } from "./libs/screenshot"
import { Cluster } from "puppeteer-cluster"
import type { Page } from "puppeteer"
import cors from "cors"
import helmet from "helmet"

// The routers:
import authRoute from "./routes/auth"

dotEnvConfig()
const app = express()
const PORT: number = Number(process.env.PORT) || 7000

// Express middlewares
app.use(express.json())
app.use(cors())
app.use(helmet())

// Routes
app.use("/authentication", authRoute)

// Creating the Cluster (or browser pool)
const cluster = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  maxConcurrency: 5,
  puppeteerOptions: {
    headless: true
  }
})

// Creating the task that will run for screenshots:
await cluster.task(async ({page, data: {options}} : {page: Page, data: {options: ScreenshotOptions}}) => {
  // @ts-ignore
  const screenshot = await takeScreenshot(page, options)
  return screenshot
})


app.get("/", (req, res) => {
  res.send("Hello from \"/\"")
})

app.get("/dev/screenshot", async (req, res) => {
  const file = await cluster.execute({
    options: {
      url: "https://google.com/",
      option: "base64"
    }
  } as {options: ScreenshotOptions})
  res.send(`<img src="data:image/webp;base64,${file}" />`)
})

app.listen(PORT, async () => {
  console.log(`--------------------------------------------`)
  console.log(`App is running successfully on port ${PORT}.`)
  console.log("\n")
})

// After your app.listen()
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing browser...')
  if(cluster) await cluster.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing browser...')
  if(cluster) await cluster.close()
  process.exit(0)
})