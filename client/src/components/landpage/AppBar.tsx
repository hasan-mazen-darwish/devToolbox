import { styled, alpha } from '@mui/material/styles'
import {AppBar as AppBarMaterial, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem} from '@mui/material'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import React from 'react'
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import InfoIcon from '@mui/icons-material/Info'
import ConstructionIcon from '@mui/icons-material/Construction'

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

export default function AppBar() {
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null)
  const menuOpen = Boolean(menuAnchor)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setMenuAnchor(event.currentTarget)
  }
  const handleClose = (): void => setMenuAnchor(null)

  const buttonId = React.useId()
  const menuId   = React.useId()

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
            <IconButton onClick={handleClick} id={buttonId}><AccountCircleRoundedIcon fontSize='large'/></IconButton>
            <Menu id={menuId} open={menuOpen} anchorEl={menuAnchor} onClose={handleClose} slotProps={{
              list: {
                "aria-labelledby": buttonId
              }
            }}>
              <MenuItem>
                <ListItemIcon><LoginIcon fontSize='small' /></ListItemIcon>
                <ListItemText>Log in</ListItemText>
              </MenuItem>

              <MenuItem>
                <ListItemIcon><PersonAddAltIcon fontSize='small' /></ListItemIcon>
                <ListItemText>Sign up</ListItemText>
              </MenuItem>

              <Divider />
              
              <MenuItem>
                <ListItemIcon><InfoIcon fontSize='small' /></ListItemIcon>
                <ListItemText>About us</ListItemText>
              </MenuItem>
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
            <ConstructionIcon fontSize='large' />
            DevToolbox
          </Container>
        </StyledToolbar>
      </Container>
    </AppBarMaterial>
  );
}