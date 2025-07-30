import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {BrowserRouter} from "react-router-dom";
import './index.css'
import App from './App.tsx'
import {SessionProvider} from "../../vempain-frontend-auth/src/session";
import '@ant-design/v5-patch-for-react-19';

createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <SessionProvider baseURL={`${import.meta.env.VITE_APP_API_URL}`}>
                <BrowserRouter>
                    <App/>
                </BrowserRouter>
            </SessionProvider>
        </StrictMode>
);
