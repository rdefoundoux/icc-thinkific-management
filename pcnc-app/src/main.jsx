// frontend/src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import theme from './theme'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <MantineProvider theme={theme}>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </MantineProvider>
        </BrowserRouter>
    </React.StrictMode>
)
