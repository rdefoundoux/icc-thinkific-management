import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n';
import theme from "./theme";
import './index.css';
import './i18n/i18n';

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
                <I18nextProvider i18n={i18n}>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </I18nextProvider>
            </MantineProvider>
        </BrowserRouter>
    </React.StrictMode>
);
