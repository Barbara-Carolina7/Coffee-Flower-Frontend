
import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider, type AuthProviderProps } from "react-oidc-context";
import App from "./App";
import "./styles.css";

const authority = import.meta.env.VITE_COGNITO_AUTHORITY as string | undefined;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;

const authConfig: AuthProviderProps = {
  authority:
    authority ||
    "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_qhHxgE8jy",
  client_id: clientId || "3g344v2pmve6jr3vvua4k71cla",
  redirect_uri: "https://coffee-flower-frontend.vercel.app/",
  response_type: "code",
  scope: "openid email profile",
  onSigninCallback: () =>
    window.history.replaceState({}, document.title, window.location.pathname),
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider {...authConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
