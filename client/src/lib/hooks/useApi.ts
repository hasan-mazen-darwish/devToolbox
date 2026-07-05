import { useRef, useState } from "react"
import api from "../axios"
import type { AxiosError, AxiosRequestConfig } from "axios"
import type { ApiResponseType } from "../../../../shared/types/responses"

export default function useApi<DataType = ApiResponseType, ServerDataType = any>() {
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<DataType | null>(null)
  const [error, setError] = useState<AxiosError | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = async <T>(
    requestFn: (signal: AbortSignal) => Promise<T>
  ): Promise<{ data: T | null; error: AxiosError | null }> => {
    
    if (loading && abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setData(null)
    setError(null)

    try {
      const result = await requestFn(controller.signal)
      setData(result as unknown as DataType)
      return { data: result, error: null }
    } catch (err) {
      // Don't treat aborted requests as errors
      if (err instanceof Error && err.name === 'CanceledError') {
        return { data: null, error: null }
      }
      
      const axiosError = err as AxiosError
      setError(axiosError)
      return { data: null, error: axiosError }
    } finally {
      setLoading(false)
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }

  const post = async (url: string, serverData: ServerDataType, config?: AxiosRequestConfig) => {
    return execute((signal) => 
      api.post(url, serverData, { ...config, signal }).then(res => res.data)
    )
  }

  const get = async (url: string, config?: AxiosRequestConfig) => {
    return execute((signal) => 
      api.get(url, { ...config, signal }).then(res => res.data)
    )
  }

  return { data, error, loading, get, post }
}