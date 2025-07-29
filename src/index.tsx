import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter} from "react-router-dom";
import './index.css'
import App from './App.tsx'
import {SessionProvider} from "../../vempain-frontend-auth/src/session";

createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <SessionProvider baseURL={`${import.meta.env.VITE_APP_API_URL}`}>
                <BrowserRouter>
                    <App/>
                </BrowserRouter>
            </SessionProvider>
        </StrictMode>
);
