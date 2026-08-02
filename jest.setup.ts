// Provide VITE_APP_API_URL for tests (mirrors .env.local)
process.env.VITE_APP_API_URL = "http://localhost:8080/api";
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
