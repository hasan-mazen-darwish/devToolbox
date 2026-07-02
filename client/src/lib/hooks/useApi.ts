import { useState } from "react"
import api from "../axios"
import type { AxiosError, AxiosRequestConfig } from "axios"

export default function useApi<DataType = any, ErrorType = AxiosError, ServerDataType = any>() {
  const [loading, setLoading] = useState<boolean>(false)
  const [data   , setData   ] = useState<DataType | null>(null)
  const [error  , setError  ] = useState<ErrorType | null>(null)

  type FunctionsReturnType = Promise<DataType | null>

  const execute = async (executingFunction: () => FunctionsReturnType): FunctionsReturnType => {
    setLoading(true)
    setData(null)
    setError(null)

    try {
      const d = await executingFunction()
      setData(d)
      return d
    }
    catch(error) {
      setError(error as ErrorType)
    }
    finally {
      setLoading(false)
    }

    return null
  }

  const get = async (url: string, config?: AxiosRequestConfig): FunctionsReturnType => {
    const responseData = await execute(() => api.get(url, config).then(res => res.data))
    return responseData
  }

  const post = async (url: string, serverData: ServerDataType, config?: AxiosRequestConfig): FunctionsReturnType => {
    const responseData = await execute(() => api.post(url, serverData, config).then(res => res.data))
    return responseData
  }


  return { data, error, loading, get, post }
}