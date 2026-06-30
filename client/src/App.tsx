import CssBaseLine from "@mui/material/CssBaseline"

import AppBar from './components/landpage/AppBar'
import { Route, Routes } from "react-router-dom"
import { Container, createTheme, ThemeProvider } from "@mui/material"
import SignupPage from "./pages/signup"

function App() {
  const theme = createTheme({
    palette: {
      mode: "light",
      
      primary: {
        main: "#3F51B5",
        dark: "#303F9F",
        light: "#C5CAE9",
        contrastText: "#FFFFFF"
      },

      secondary: {
        main: "#03A9F4",
      },

      text: {
        primary: "#212121",
        secondary: "#757575"
      },

      divider: "#BDBDBD"
    }
  })

  return (
    <ThemeProvider theme={theme}>
      <CssBaseLine enableColorScheme />
      <AppBar />
      {/* Giving some padding in order to not having the App Bar covering the whole screen */}
      <Container sx={{paddingTop: "100px"}}></Container>

      <Routes>
        <Route path="/">
          <Route index element={<></>}></Route>
          <Route path="signup/" element={<SignupPage />}></Route>
        </Route>
        <Route path="*"></Route>
      </Routes>
    </ThemeProvider>
  )
}

export default App