import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import theme from "./theme";
import './index.css';

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </MantineProvider>
        </BrowserRouter>
    </React.StrictMode>
);
