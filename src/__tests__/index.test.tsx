import type {ReactElement, ReactNode} from "react";

const mockRender = jest.fn();
const mockCreateRoot = jest.fn<{ render: jest.Mock }, [Element]>(() => ({render: mockRender}));

jest.mock("react-dom/client", () => ({createRoot: (container: Element) => mockCreateRoot(container)}));
jest.mock("../App.tsx", () => ({
    __esModule: true, default: function App() {
        return <div>the app</div>;
    }
}));
jest.mock("../i18n", () => ({__esModule: true, default: {language: "en"}}));
jest.mock("react-i18next", () => ({
    I18nextProvider: function I18nextProvider({children}: { children: ReactNode }) {
        return <>{children}</>;
    }
}));
jest.mock("@vempain/vempain-auth-frontend", () => ({
    SessionProvider: function SessionProvider({children}: { children: ReactNode }) {
        return <>{children}</>;
    }
}), {virtual: true});

type TreeElement = ReactElement<{ children?: ReactNode } & Record<string, unknown>>;

function typeName(element: TreeElement): string {
    return typeof element.type === "string" ? element.type : (element.type as { name?: string }).name ?? String(element.type);
}

function child(element: TreeElement): TreeElement {
    return element.props.children as TreeElement;
}

/** The entry point mounts the app under the i18n, session and router providers with the configured API base URL. */
describe("index", () => {
    it("renders the provider tree into the #root element", () => {
        document.body.innerHTML = '<div id="root"></div>';
        const root = document.getElementById("root");

        jest.requireActual("../index");

        expect(mockCreateRoot).toHaveBeenCalledWith(root);
        expect(mockRender).toHaveBeenCalledTimes(1);

        // The element tree handed to React is inspected structurally (react-dom/client is mocked, so it cannot be rendered here)
        const strictMode = mockRender.mock.calls[0][0] as TreeElement;
        expect(strictMode.type).toBe(Symbol.for("react.strict_mode"));
        const i18nProvider = child(strictMode);
        expect(typeName(i18nProvider)).toBe("I18nextProvider");
        expect((i18nProvider.props.i18n as { language: string }).language).toBe("en");
        const session = child(i18nProvider);
        expect(typeName(session)).toBe("SessionProvider");
        expect(session.props.baseURL).toBe(process.env.VITE_APP_API_URL);
        expect(session.props.loginPath).toBe("/login");
        const router = child(session);
        expect(typeName(router)).toBe("BrowserRouter");
        expect(typeName(child(router))).toBe("App");
    });
});
