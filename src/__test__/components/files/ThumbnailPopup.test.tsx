import type {ReactNode} from "react";
import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {ThumbnailPopup} from "../../../components";

jest.mock("antd", () => ({
    Popover: ({children, content, trigger}: { children: ReactNode; content: ReactNode; trigger: string }) => (
            <div data-trigger={trigger}>
                <div data-content>{content}</div>
                {children}
            </div>
    ),
}));

jest.mock("../../../components/files/FileDisplay", () => ({
    FileDisplay: ({id, maxSize}: { id: number; maxSize: number }) => (
            <div data-file-id={id} data-max-size={maxSize}>preview</div>
    ),
}));

describe("ThumbnailPopup", () => {
    let container: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it("configures a hover popup with the supplied file attributes", async () => {
        await act(async () => {
            root.render(
                    <ThumbnailPopup id={12} maxSize={300}>
                        <button type="button">thumbnail</button>
                    </ThumbnailPopup>,
            );
        });

        expect(container.querySelector("[data-trigger='hover']")).not.toBeNull();
        expect(container.querySelector("[data-file-id='12']")?.getAttribute("data-max-size")).toBe("300");
        expect(container.querySelector("button")?.textContent).toBe("thumbnail");
    });
});
