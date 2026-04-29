// main.tsx - Application entry point.
// ReactDOM.createRoot mounts the React tree into the #root div in index.html.
// BrowserRouter is placed here so every component can use React Router hooks.
// Bootstrap CSS is imported globally so all pages can use Bootstrap utility classes.

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import { GamificationProvider } from "./context/GamificationContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <GamificationProvider>
          <App />
<<<<<<< HEAD
        </GamificationProvider>,
      </AuthProvider>
    </BrowserRouter>,

  </React.StrictMode>
=======
        </GamificationProvider>
      </AuthProvider>
    </BrowserRouter>
    ,
  </React.StrictMode>,
>>>>>>> origin/dev
);
