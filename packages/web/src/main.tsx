import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource-variable/inter";

import { App } from "./app/App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Корневой элемент не найден");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
