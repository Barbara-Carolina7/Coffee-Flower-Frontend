
import React from "react";
import ReactDOM from "react-dom/client";
import {
  AuthProvider,
  type AuthProviderProps,
} from "react-oidc-context";
import App from "./App";
import "./styles.css";

const authority =
  (import.meta.env.VITE_COGNITO_AUTHORITY as string | undefined) ||
  "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_qhHxgE8jy";

const clientId =
  (import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined) ||
  "3g344v2pmve6jr3vvua4k71cla";

const redirectUri = "https://coffee-flower-frontend.vercel.app/";

const authConfig: AuthProviderProps = {
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  scope: "openid email",

  onSigninCallback: () => {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider {...authConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
