import {TextDecoder, TextEncoder} from "util";

// Provide VITE_APP_API_URL for tests (mirrors .env.local)
process.env.VITE_APP_API_URL = "http://localhost:8080/api";

// react-router needs the encoder APIs that jsdom lacks
if (typeof globalThis.TextEncoder === "undefined") {
    Object.assign(globalThis, {TextEncoder, TextDecoder});
}
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

if (typeof ResizeObserver === "undefined") {
    class TestResizeObserver implements ResizeObserver {
        observe(): void {
        }

        unobserve(): void {
        }

        disconnect(): void {
        }
    }

    globalThis.ResizeObserver = TestResizeObserver;
}
