import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { Header } from './Header';
import { UserOperationList } from './UserOperationList';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <UserOperationList />
    </ThemeProvider>
  );
}

export default App;