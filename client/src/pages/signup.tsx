import { Button, ButtonGroup, Container, Divider, TextField } from "@mui/material"
import React, { useState } from "react"
import GitHubIcon from '@mui/icons-material/GitHub'
import GoogleIcon from '@mui/icons-material/Google'
import { useTranslation } from "react-i18next"
import useApi from "../lib/hooks/useApi"
import toast from "react-hot-toast"
import type { ApiResponseErrorType } from "../../../shared/types/responses"
import { Turnstile } from "@marsidev/react-turnstile"

export default function SignupPage(): React.ReactElement {
  const { t } = useTranslation()
  const { post, loading } = useApi()
  const [token, setToken] = useState<string | null>(null)

  async function submitSignupFunction(event: React.SyntheticEvent) {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const formData = new FormData(form)

    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const repassword = formData.get("repassword") as string

    const { data, error } = await post("/authentication/signup", {
      name,
      email,
      password,
      repassword,
      turnstileToken: token
    })

    if (error) {
      console.error("Error handling signup:", error.message)
      
      // Get error response from the server
      const errorResponse = error.response?.data as ApiResponseErrorType
      
      if (errorResponse?.errorCode) {
        toast.error(t("error.signup.email." + errorResponse.errorCode))
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

  return <Container>
    <form method="POST" onSubmit={submitSignupFunction}>
      <center><h1>{t("signup.title.bigWelcome")}</h1></center>
      <center><div>{t("signup.title.underBigWelcome")}</div></center>
      <Divider sx={{marginY: 4, fontStyle: "italic"}}>{t("signup.divider.useEmailPassword")}</Divider>

      <TextField
        label={t("signup.textField.name.label")}
        variant="standard"
        type="text"
        fullWidth required
        sx={{marginY: 1}}
        helperText={t("signup.textField.name.helper")}
        id="nameInput"
        name="name"
        key={1}
      />

      <TextField
        label={t("signup.textField.email.label")}
        variant="standard"
        type="email"
        fullWidth required
        sx={{marginY: 1}}
        helperText={t("signup.textField.email.helper")}
        id="emailInput"
        name="email"
        key={2}
      />

      <TextField
        label={t("signup.textField.password.label")}
        variant="standard"
        type="password"
        fullWidth required
        sx={{marginY: 1}}
        helperText={t("signup.textField.password.helper")}
        id="passwordInput"
        name="password"
        key={3}
      />

      <TextField
        label={t("signup.textField.repassword.label")}
        variant="standard"
        type="password"
        fullWidth required
        sx={{marginY: 1}}
        helperText={t("signup.textField.repassword.helper")}
        id="retypePasswordInput"
        name="repassword"
        key={4}
      />

      <Button type="submit" variant="contained" sx={{fontSize: "large"}} loading={loading} fullWidth id="signupButton">{t("signup.signupText")}!</Button>
    </form>

    <br />
    <br />

    {/* Cloudflare's Turnstile */}
    <Turnstile
      siteKey="0x4AAAAAADv5n--RFDmsSatM"
      onSuccess={(token) => setToken(token)}
      onExpire={() => setToken(null)}
      onError={() => toast.error(t("error.general"))}
    />

    <Divider sx={{marginY: 4, fontStyle: "italic"}}>{t("signup.divider.or")}</Divider>

    <center>
      <ButtonGroup variant="contained">
        <Button key={1} sx={{color: "white", fontSize: "large", backgroundColor: "black"}} startIcon={<GitHubIcon />}>{t("signup.githubText")}</Button>
        <Button key={2} sx={{color: "white", fontSize: "large", backgroundColor: "darkcyan"}} startIcon={<GoogleIcon />}>{t("signup.googleText")}</Button>
      </ButtonGroup>
    </center>
  </Container>
}