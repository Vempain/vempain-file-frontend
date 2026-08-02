import type {CSSProperties, ReactNode} from "react";
import {act} from "react";
import {createRoot, type Root} from "react-dom/client";
import {fileContentAPI} from "../../../services";
import {FileDisplay} from "../../../components/files/FileDisplay";

const getFileContent = jest.mocked(fileContentAPI.getFileContent);

jest.mock("antd", () => ({
    Image: ({alt, preview, src, style}: { alt: string; preview: boolean; src: string; style: CSSProperties }) => (
            <img alt={alt} data-preview={String(preview)} src={src} style={style}/>
    ),
    Spin: ({children, spinning}: { children: ReactNode; spinning: boolean }) => (
            <div data-spinning={String(spinning)}>{children}</div>
    ),
}));

jest.mock("../../../services", () => ({
    fileContentAPI: {
        getFileContent: jest.fn(),
    },
}));

describe("FileDisplay", () => {
    let container: HTMLDivElement;
    let root: Root;
    const createObjectURL = jest.fn(() => "blob:preview");
    const revokeObjectURL = jest.fn();

    Object.defineProperty(URL, "createObjectURL", {configurable: true, value: createObjectURL});
    Object.defineProperty(URL, "revokeObjectURL", {configurable: true, value: revokeObjectURL});

    beforeEach(() => {
        container = document.createElement("div");
        document.body.appendChild(container);
        root = createRoot(container);
        getFileContent.mockReset();
        createObjectURL.mockClear();
        revokeObjectURL.mockClear();
    });

    afterEach(async () => {
        await act(async () => root.unmount());
        container.remove();
    });

    it("loads JPEG content and constrains both image dimensions", async () => {
        const file = new Blob(["jpeg"], {type: "image/jpeg"});
        getFileContent.mockResolvedValueOnce(file);

        await act(async () => {
            root.render(<FileDisplay id={7} maxSize={240}/>);
            await Promise.resolve();
        });

        const image = container.querySelector("img");
        expect(getFileContent).toHaveBeenCalledWith(7);
        expect(createObjectURL).toHaveBeenCalledWith(file);
        expect(image).not.toBeNull();
        expect(image?.src).toContain("blob:preview");
        expect(image?.style.maxWidth).toBe("240px");
        expect(image?.style.maxHeight).toBe("240px");
        expect(container.querySelector("[data-spinning='false']")).not.toBeNull();
    });

    it("does not render an image when content loading fails", async () => {
        const error = new Error("request failed");
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
        getFileContent.mockRejectedValueOnce(error);

        await act(async () => {
            root.render(<FileDisplay id={8} maxSize={120}/>);
            await Promise.resolve();
        });

        expect(container.querySelector("img")).toBeNull();
        expect(consoleError).toHaveBeenCalledWith("Failed to fetch file content for file 8:", error);
        expect(container.querySelector("[data-spinning='false']")).not.toBeNull();
        consoleError.mockRestore();
    });

    it("revokes the Blob URL when unmounted", async () => {
        getFileContent.mockResolvedValueOnce(new Blob(["jpeg"], {type: "image/jpeg"}));

        await act(async () => {
            root.render(<FileDisplay id={9} maxSize={100}/>);
            await Promise.resolve();
        });
        await act(async () => root.unmount());

        expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview");
    });

    it("ignores content that resolves after unmounting", async () => {
        let resolveContent: (file: Blob) => void = () => undefined;
        const pendingContent = new Promise<Blob>(resolve => {
            resolveContent = resolve;
        });
        getFileContent.mockReturnValueOnce(pendingContent);

        await act(async () => root.render(<FileDisplay id={10} maxSize={100}/>));
        await act(async () => root.unmount());
        await act(async () => resolveContent(new Blob(["jpeg"], {type: "image/jpeg"})));

        expect(createObjectURL).not.toHaveBeenCalled();
    });

    it("ignores errors that arrive after unmounting", async () => {
        let rejectContent: (error: Error) => void = () => undefined;
        const pendingContent = new Promise<Blob>((_resolve, reject) => {
            rejectContent = reject;
        });
        getFileContent.mockReturnValueOnce(pendingContent);

        await act(async () => root.render(<FileDisplay id={11} maxSize={100}/>));
        await act(async () => root.unmount());
        await act(async () => rejectContent(new Error("late request failed")));

        expect(createObjectURL).not.toHaveBeenCalled();
    });
});
