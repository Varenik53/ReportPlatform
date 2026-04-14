import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import { DashboardPage } from "../pages/DashboardPage";

const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f172a",
    },
    background: {
      default: "#f8fafc",
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});

export function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <DashboardPage />
    </ThemeProvider>
  );
}
