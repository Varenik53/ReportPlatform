import { DashboardPage } from "@/pages/dashboard";
import { GlobalLoader } from "@/shared/ui";
import { QueryProvider, ThemeProvider } from "./providers";

export function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <GlobalLoader />
        <DashboardPage />
      </ThemeProvider>
    </QueryProvider>
  );
}
