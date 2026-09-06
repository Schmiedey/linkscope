import React from "react";
import ReactDOM from "react-dom/client";
import { PopupApp } from "./App.tsx";
import "@/src/styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>,
);
