import { Button, ButtonGroup, Container, Divider, TextField } from "@mui/material"
import React from "react"
import GitHubIcon from '@mui/icons-material/GitHub'
import GoogleIcon from '@mui/icons-material/Google'

export default function SignupPage(): React.ReactElement {
  return <Container>
    <form method="POST">
      <center><h1>Welcome to our website!</h1></center>
      <center><div>Start by making yourself an account here!</div></center>
      <Divider sx={{marginY: 4, fontStyle: "italic"}}>use your email and password</Divider>

      <TextField
        label="E-mail"
        variant="standard"
        type="email"
        fullWidth required
        sx={{marginY: 1}}
        helperText="The E-mail will be used everytime you enter the website. Required."
      />

      <TextField
        label="E-mail password"
        variant="standard"
        type="password"
        fullWidth required
        sx={{marginY: 1}}
        helperText="The password will be used everytime you enter the website with the E-mail above. Required."
      />

      <Button variant="contained" id="button" fullWidth>Signup!</Button>
    </form>

    <Divider sx={{marginY: 4, fontStyle: "italic"}}>or use a third party service</Divider>

    <center>
      <ButtonGroup variant="contained">
        <Button sx={{color: "white", fontSize: "large", backgroundColor: "black"}} startIcon={<GitHubIcon />}>Github</Button>
        <Button sx={{color: "white", fontSize: "large", backgroundColor: "darkcyan"}} startIcon={<GoogleIcon />}>Google</Button>
      </ButtonGroup>
    </center>
  </Container>
}