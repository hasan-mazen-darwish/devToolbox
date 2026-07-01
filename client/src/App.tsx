import CssBaseLine from "@mui/material/CssBaseline"

import AppBar from './components/landpage/AppBar'
import { Route, Routes } from "react-router-dom"
import { Container, createTheme, ThemeProvider } from "@mui/material"
import SignupPage from "./pages/signup"
import { useTranslation } from "react-i18next"
import { useEffect, useMemo } from "react"
import rtlPlugin from "@mui/stylis-plugin-rtl"
import createCache from "@emotion/cache"
import { CacheProvider } from "@emotion/react"

function App() {
  const { i18n } = useTranslation()
  const rtlLangs = useMemo(() => ["ar"], [])
  const isRTL = rtlLangs.includes(i18n.language)

  const cacheRtl = useMemo(() => 
    createCache({
      key: 'muirtl',
      stylisPlugins: isRTL ? [rtlPlugin] : [],
    }),
    [isRTL]
  )

  const theme = useMemo(() => createTheme({
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

      divider: "#BDBDBD",
    },
    direction: isRTL ? "rtl" : "ltr",
    
  }), [isRTL])

  useEffect(() => {
    document.documentElement.lang = i18n.language
    document.documentElement.dir = isRTL ? "rtl" : "ltr"
  }, [i18n.language])

  return (
    <CacheProvider value={cacheRtl}>
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
    </CacheProvider>
  )
}

export default App