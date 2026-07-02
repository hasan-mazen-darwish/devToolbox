import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:7000",
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json"
  }
})

export default api