import { Button, Container } from "@mui/material"
import { useTranslation } from "react-i18next"

const EmailSent = () => {
  const {t} = useTranslation()

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
    <p>{t("verification.emailNotSent")}</p>
    <Button fullWidth variant="contained">{t("verification.resendEmailButton")}</Button>
    <br />

    <p>{t("verification.rateLimitNote")}</p>
    <br />
    <p style={{color: "red"}}>{t("verification.noRefreshWarning")}</p>
  </Container>
}

export default EmailSent