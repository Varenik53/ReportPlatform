import type { ReactNode } from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider as MuiThemeProvider, createTheme, alpha } from "@mui/material/styles";

import { palette, typography, radii } from "@/shared/config";

const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: palette.brand.main,
      light: palette.brand.light,
      dark: palette.brand.dark,
      contrastText: palette.brand.contrast,
    },
    secondary: {
      main: palette.secondary.main,
      light: palette.secondary.light,
      dark: palette.secondary.dark,
    },
    success: {
      main: palette.success.main,
      light: palette.success.light,
      dark: palette.success.dark,
    },
    warning: {
      main: palette.warning.main,
      light: palette.warning.light,
      dark: palette.warning.dark,
    },
    error: {
      main: palette.error.main,
      light: palette.error.light,
      dark: palette.error.dark,
    },
    info: {
      main: palette.info.main,
      light: palette.info.light,
      dark: palette.info.dark,
    },
    background: {
      default: palette.neutral[50],
      paper: palette.neutral[0],
    },
    text: {
      primary: palette.neutral[900],
      secondary: palette.neutral[600],
    },
    divider: palette.neutral[200],
  },
  shape: {
    borderRadius: radii.lg,
  },
  typography: {
    fontFamily: typography.fontFamily.base,
    h4: {
      fontWeight: typography.fontWeight.bold,
      letterSpacing: typography.letterSpacing.tight,
    },
    h5: {
      fontWeight: typography.fontWeight.bold,
      letterSpacing: typography.letterSpacing.snug,
    },
    subtitle1: {
      fontWeight: typography.fontWeight.semibold,
      fontSize: typography.fontSize.base,
    },
    subtitle2: {
      fontWeight: typography.fontWeight.semibold,
      fontSize: typography.fontSize.md,
    },
    body2: {
      color: palette.neutral[600],
    },
    caption: {
      fontSize: typography.fontSize.sm,
      color: palette.neutral[500],
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*, *::before, *::after": {
          boxSizing: "border-box",
        },
        body: {
          margin: 0,
          minWidth: 320,
          minHeight: "100vh",
          background: `linear-gradient(180deg, ${palette.brand[50]} 0%, ${palette.neutral[50]} 30%, ${palette.neutral[50]} 100%)`,
        },
        ":focus-visible": {
          outline: `2px solid ${palette.brand.light}`,
          outlineOffset: 2,
        },
        ".skip-link": {
          position: "absolute",
          left: "0.5rem",
          top: "-3rem",
          zIndex: 1000,
          padding: "0.5rem 0.75rem",
          borderRadius: radii.sm,
          background: palette.brand.main,
          color: palette.brand.contrast,
          textDecoration: "none",
          fontWeight: typography.fontWeight.semibold,
          fontSize: typography.fontSize.md,
          transition: "top 0.2s ease-in-out",
          "&:focus": {
            top: "0.5rem",
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        outlined: {
          borderColor: palette.neutral[200],
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            borderColor: palette.neutral[300],
            boxShadow: `0 1px 3px ${alpha(palette.neutral[900], 0.06)}`,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: typography.fontWeight.semibold,
          borderRadius: radii.md,
          padding: "8px 20px",
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${palette.brand.main} 0%, ${palette.brand.light} 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${palette.brand.dark} 0%, ${palette.brand.accent} 100%)`,
          },
        },
        containedSuccess: {
          background: `linear-gradient(135deg, ${palette.success.main} 0%, ${palette.success.light} 100%)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${palette.success.dark} 0%, ${palette.success.mid} 100%)`,
          },
        },
        outlined: {
          borderWidth: "1.5px",
          "&:hover": {
            borderWidth: "1.5px",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: typography.fontWeight.semibold,
          borderRadius: radii.sm,
        },
        sizeSmall: {
          height: 24,
          fontSize: typography.fontSize.sm,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        variant: "outlined",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: radii.md,
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.neutral[400],
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: "1.5px",
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radii.md,
          fontWeight: typography.fontWeight.medium,
        },
      },
    },
  },
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={appTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
