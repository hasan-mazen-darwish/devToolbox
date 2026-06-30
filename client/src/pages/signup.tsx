import { Button, ButtonGroup, Container, Divider, TextField } from "@mui/material"
import React from "react"
import GitHubIcon from '@mui/icons-material/GitHub'
import GoogleIcon from '@mui/icons-material/Google'
import { useTranslation } from "react-i18next"

export default function SignupPage(): React.ReactElement {
  const { t } = useTranslation()

  return <Container>
    <form method="POST">
      <center><h1>{t("signup.title.bigWelcome")}</h1></center>
      <center><div>{t("signup.title.underBigWelcome")}</div></center>
      <Divider sx={{marginY: 4, fontStyle: "italic"}}>{t("signup.divider.useEmailPassword")}</Divider>

      <TextField
        label={t("signup.textField.email.label")}
        variant="standard"
        type="email"
        fullWidth required
        sx={{marginY: 1}}
        helperText={t("signup.textField.email.helper")}
        id="emailInput"
      />

      <TextField
        label={t("signup.textField.password.label")}
        variant="standard"
        type="password"
        fullWidth required
        sx={{marginY: 1}}
        helperText={t("signup.textField.password.helper")}
        id="passwordInput"
      />

      <TextField
        label={t("signup.textField.repassword.label")}
        variant="standard"
        type="password"
        fullWidth required
        sx={{marginY: 1}}
        helperText={t("signup.textField.repassword.helper")}
        id="retypePasswordInput"
      />

      <Button variant="contained" sx={{fontSize: "large"}} fullWidth id="signupButton">{t("signup.signupText")}!</Button>
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