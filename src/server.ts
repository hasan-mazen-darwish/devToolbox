import express from "express"
import { config as dotEnvConfig } from "dotenv"

dotEnvConfig()
const app = express()
const PORT: Number = Number(process.env.PORT) || 7000

app.get("/", (req, res) => {
  res.send("Hello from \"/\"")
})

app.listen(PORT, () => {
  console.log(`--------------------------------------------`)
  console.log(`App is running successfully on port ${PORT}.`)
  console.log("\n")
})