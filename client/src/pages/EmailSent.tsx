import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { Button, Container } from "@mui/material"
import { useCallback, useRef, useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import useApi from "../lib/hooks/useApi"
import type { ApiRateLimitData, ApiResponseErrorType } from "../../../shared/types/responses"

const EmailSent = () => {
  const {t} = useTranslation()
  const location = useLocation()
  const [token, setToken] = useState<null | string>(null)
  const turnstileRef = useRef<TurnstileInstance | null>(null)
  const { post, loading } = useApi()

  const email = location.state?.email
  const password = location.state?.password

  const resetToken = useCallback(() => {
    if(turnstileRef.current) turnstileRef.current.reset()
    
    setToken(null)
  }, [turnstileRef.current])

  const handleResetButton = useCallback(async () => {
    if(loading) return
    else {
      const { data, error } = await post("/authentication/resend-verification", {email, password, turnstileToken: token})
      resetToken()

      if(error) {
        console.error("Error handling signup:", error.message)
      
        // Get error response from the server
        const errorResponse = error.response?.data as ApiResponseErrorType<ApiRateLimitData>
        
        if (errorResponse?.errorCode == "rateLimitExceeded") {
          const unitKey = `timeUnit.${errorResponse.data?.unit}`
          const unitTranslation = t(unitKey, {count: errorResponse.data?.remaining})
          toast.error(t(`error.emailVerification.rateLimiting`, {count: errorResponse.data?.remaining, unit: unitTranslation}))
        } else if(errorResponse?.errorCode) {
          toast.error(t("error.emailVerification." + errorResponse.errorCode))
        } else {
          toast.error(t("error.general"))
          console.error("An error occurred in signing up:", error)
        }
        return
      }

      if (data && 'error' in data && data.error) {
        toast.error(t("error.signup.email." + data.error))
        return
      }

      toast.success(t("signup.createdAccountMessage"))
    }
  }, [email, password, token, loading])

  return <Container style={{fontSize: "20px"}}>
    <div style={{width: "100%", display: "flex", alignItems: "center", justifyContent: "center"}}>
      <img
        src="/images/emailSent.png"
        style={{width: "20%", margin: "10px 0"}}
        alt="E-mail sent image"
      />
    </div>
    
    <center><h2>{t("verification.emailSent")}</h2></center>
    <p>{t("verification.checkInbox")}</p>
    {email && password ? <><p>{t("verification.emailNotSent")}</p><Button onClick={handleResetButton} loading={loading} fullWidth variant="contained">{t("verification.resendEmailButton")}</Button></> : <p>{t("verification.noState")}</p>}
    <br />

    <p>{t("verification.rateLimitNote")}</p>
    <br />
    <p style={{color: "red"}}>{t("verification.noRefreshWarning")}</p>

    {/* Cloudflare's Turnstile */}
    <Turnstile
      siteKey={import.meta.env.VITE_CLOUDFLARE_SITE_KEY!}
      onSuccess={(token) => setToken(token)}
      onExpire={() => setToken(null)}
      onError={() => toast.error(t("error.general"))}
      ref={turnstileRef}
    />
  </Container>
}

export default EmailSent