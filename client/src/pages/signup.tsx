import { Button, ButtonGroup, Container, Divider, TextField } from "@mui/material"
import React from "react"
import GitHubIcon from '@mui/icons-material/GitHub'
import GoogleIcon from '@mui/icons-material/Google'
import { useTranslation } from "react-i18next"
import useApi from "../lib/hooks/useApi"
import toast from "react-hot-toast"

export default function SignupPage(): React.ReactElement {
  const { t } = useTranslation()

  const { post, loading: signupLoading, error } = useApi()

  async function submitSignupFunction(event: React.SyntheticEvent) {
    event.preventDefault()
    const form =  event.currentTarget as HTMLFormElement
    const formData = new FormData(form)

    const name = formData.get("name")
    const email = formData.get("email")
    const password = formData.get("password")
    const repassword = formData.get("repassword")

    if(!signupLoading) {
      const response = await post("/authentication/signup", {name, email, password, repassword})
      if(error || !response) {
        console.error(`Error handling signup; ${error ? error.message : "No response."}`)
        toast.error(t("error.general"))
      }
      else {
        if(response.error) toast.error(t("error.signup.email." + response.errorCode))
          else toast.success(t("signup.createdAccountMessage"))
      }
    }
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
      />

      <Button variant="contained" sx={{fontSize: "large"}} loading={signupLoading} fullWidth id="signupButton">{t("signup.signupText")}!</Button>
    </form>

    <Divider sx={{marginY: 4, fontStyle: "italic"}}>{t("signup.divider.or")}</Divider>

    <center>
      <ButtonGroup variant="contained">
        <Button sx={{color: "white", fontSize: "large", backgroundColor: "black"}} startIcon={<GitHubIcon />}>{t("signup.githubText")}</Button>
        <Button sx={{color: "white", fontSize: "large", backgroundColor: "darkcyan"}} startIcon={<GoogleIcon />}>{t("signup.googleText")}</Button>
      </ButtonGroup>
    </center>
  </Container>
}