import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./app/App.jsx";
import "./styles/global.css";
import "./styles/style.css";
import "./styles/app.css";
// MOBILE FIX: Import all mobile-first responsive overrides last so they take precedence
import "./styles/mobile-fixes.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </HashRouter>
  </React.StrictMode>
);
