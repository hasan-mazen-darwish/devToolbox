import { Button, Container } from "@mui/material"

const EmailSent = () => {
  return <Container style={{fontSize: "20px"}}>
    <div style={{width: "100%", display: "flex", alignItems: "center", justifyContent: "center"}}>
      <img
        src="/images/emailSent.png"
        style={{width: "20%", margin: "10px 0"}}
        alt="E-mail sent image"
      />
    </div>
    
    <center><h2>E-mail sent!</h2></center>
    Please check your inbox (or in the spam folder) and click the verification link!
    <br />

    If you didn't receive any E-mail (check the spam folder!), you can have your E-mail resent by clicking here:
    <br />
    <Button fullWidth variant="contained">Resend E-mail</Button>
    <br />

    Please note that you can't resend an E-mail more than once each 5 minutes, at 5 times an hour max.
  </Container>
}

export default EmailSent