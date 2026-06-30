import { styled, alpha } from '@mui/material/styles'
import {AppBar as AppBarMaterial, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, MenuList} from '@mui/material'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import React from 'react'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import InfoIcon from '@mui/icons-material/Info'
import ConstructionIcon from '@mui/icons-material/Construction'
import LanguageIcon from '@mui/icons-material/Language'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  borderRadius: `calc(${theme.shape.borderRadius}px + 8px)`,
  backdropFilter: 'blur(24px)',
  border: '1px solid',
  borderColor: (theme.vars || theme).palette.divider,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.background.defaultChannel} / 0.4)`
    : alpha(theme.palette.background.default, 0.4),
  boxShadow: (theme.vars || theme).shadows[1],
  padding: '8px 12px',
}));

// Available Languages
const availableLanguages = ["en", "ar"]

export default function AppBar() {
  const [profileMenuAnchor, setProfileMenuAnchor] = React.useState<null | HTMLElement>(null)
  const profileMenuOpen = Boolean(profileMenuAnchor)

  const [languageMenuAnchor, setLanguageMenuAnchor] = React.useState<null | HTMLElement>(null)
  const languageMenuOpen = Boolean(languageMenuAnchor)

  const { t, i18n } = useTranslation()
  
  const handleClickForProfileButton = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setProfileMenuAnchor(event.currentTarget)
  }
  const handleClickForLanguageButton = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setLanguageMenuAnchor(event.currentTarget)
  }
  const handleProfileMenuClose = (): void => setProfileMenuAnchor(null)
  const handleLanguageMenuClose = (): void => setLanguageMenuAnchor(null)

  const profileButtonId = React.useId()
  const profileMenuId   = React.useId()
  const languageButtonId = React.useId()
  const languageMenuId   = React.useId()

  return (
    <AppBarMaterial
      position="fixed"
      enableColorOnDark
      sx={{
        boxShadow: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
        mt: 'calc(var(--template-frame-height, 0px) + 28px)',
      }}
    >
      <Container maxWidth="lg">
        <StyledToolbar variant="dense" disableGutters>
          {/* Buttons of menus: */}
          <Container>
            {/* The profile button: */}
            <IconButton onClick={handleClickForProfileButton} id={profileButtonId}><AccountCircleRoundedIcon fontSize='large'/></IconButton>
            <Menu id={profileMenuId} open={profileMenuOpen} anchorEl={profileMenuAnchor} onClose={handleProfileMenuClose} slotProps={{
              list: {
                "aria-labelledby": profileButtonId
              }
            }}>
              <MenuItem>
                <ListItemIcon><LoginIcon fontSize='small' /></ListItemIcon>
                <ListItemText>{t("appBar.login")}</ListItemText>
              </MenuItem>

              <MenuItem>
                <ListItemIcon><PersonAddAltIcon fontSize='small' /></ListItemIcon>
                <ListItemText><NavLink to="signup">{t("appBar.signup")}</NavLink></ListItemText>
              </MenuItem>

              <Divider />
              
              <MenuItem>
                <ListItemIcon><InfoIcon fontSize='small' /></ListItemIcon>
                <ListItemText>{t("appBar.about")}</ListItemText>
              </MenuItem>
            </Menu>

            {/* The language button: */}
            <IconButton onClick={handleClickForLanguageButton} id={languageButtonId}><LanguageIcon fontSize='large' /></IconButton>
            <Menu id={languageMenuId} open={languageMenuOpen} anchorEl={languageMenuAnchor} onClose={handleLanguageMenuClose} slotProps={{
              list: {
                "aria-labelledby": profileButtonId
              }
            }}>
              {availableLanguages.map(lang => <MenuItem sx={{color: lang == i18n.language ? "green" : "inherit"}} onClick={() => {i18n.changeLanguage(lang)}}>{t("language." + lang)}</MenuItem>)}
            </Menu>
          </Container>

          {/* Logo: (Temporarily without a visual logo) */}
            <Container sx={{
              color: "black",
              display: "flex",
              alignItems: "center",
              fontSize: "x-large",
              fontFamily: "titleFont, sans-serif",
              userSelect: "none"
            }}>
            <NavLink to=".">
              <ConstructionIcon fontSize='large' />
              DevToolbox
            </NavLink>
          </Container>
        </StyledToolbar>
      </Container>
    </AppBarMaterial>
  );
}