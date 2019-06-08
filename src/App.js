import React, { useEffect } from 'react';
import Main from "./components/Main";
import { createMuiTheme, MuiThemeProvider } from '@material-ui/core/styles';

import './assets/css/launcher.css';

import { Provider } from "react-redux";
import store from './redux/store';
import { FtpProvider } from "./components/providers/FtpProvider";
import { SettingsProvider } from "./components/providers/SettingsProvider";

const theme = createMuiTheme({
  palette: {
    primary: {
      dark: '#005fc4',
      main: '#1d8bf8',
      light: '#6ebaff'
    },
    secondary: {
      dark: '#FFFFFF',
      main: '#FFFFFF'
    },
    type: 'dark',
  },
  typography: {
    fontFamily: "Roboto, Helvetica, Arial, sans-serif",
    useNextVariants: true
  }
});

function App() {
  useEffect(() => {
    document.body.classList.add(`bi-${Math.floor(Math.random() * 12)}`);
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      <Provider store={store}>
        <SettingsProvider>
        <FtpProvider>
          <Main/>
        </FtpProvider>
        </SettingsProvider>
      </Provider>
    </MuiThemeProvider>
  );
}

export default App;