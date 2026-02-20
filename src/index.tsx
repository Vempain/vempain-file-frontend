import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter} from "react-router-dom";
import './index.css'
import App from './App.tsx'
import {SessionProvider} from "@vempain/vempain-auth-frontend";
import i18n from "./i18n";
import {I18nextProvider} from "react-i18next";

createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <I18nextProvider i18n={i18n}>
                <SessionProvider baseURL={`${import.meta.env.VITE_APP_API_URL}`} loginPath="/login">
                    <BrowserRouter>
                        <App/>
                    </BrowserRouter>
                </SessionProvider>
            </I18nextProvider>
        </StrictMode>
);
