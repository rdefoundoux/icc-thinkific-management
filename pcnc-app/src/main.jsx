// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // ADD THIS
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/i18n';
import theme from "./theme";
import './index.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './i18n/i18n';

const queryClient = new QueryClient(); // CREATE CLIENT HERE

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
                <Notifications position="top-right" zIndex={2077} />
                <QueryClientProvider client={queryClient}> {/* MOVE HERE */}
                    <I18nextProvider i18n={i18n}>
                        <AuthProvider>
                            <App />
                        </AuthProvider>
                    </I18nextProvider>
                </QueryClientProvider>
            </MantineProvider>
        </BrowserRouter>
    </React.StrictMode>
);
