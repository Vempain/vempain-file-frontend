import type {TFunction} from "i18next";
import {Children, isValidElement, type ReactElement, type ReactNode} from "react";
import type {FileResponse} from "../../../models";
import {thumbnailColumn} from "../../../components";

jest.mock("../../../tools", () => ({
    formatByteSize: jest.fn(),
    formatDateWithTimeZone: jest.fn(),
}));

jest.mock("../../../components/files/FileDisplay", () => ({
    FileDisplay: ({id, maxSize}: { id: number; maxSize: number }) => (
            <div data-file-id={id} data-max-size={maxSize}/>
    ),
}));

jest.mock("../../../components/files/ThumbnailPopup", () => ({
    ThumbnailPopup: ({children, id, maxSize}: { children: React.ReactNode; id: number; maxSize: number }) => (
            <div data-file-id={id} data-max-size={maxSize}>{children}</div>
    ),
}));

describe("thumbnailColumn", () => {
    const t = ((key: string) => key) as TFunction;
    const column = thumbnailColumn(t);

    it("renders FileDisplay with a 150 pixel maximum for files with thumbnails", () => {
        const record = {thumbnail_id: 42} as FileResponse;

        const rendered = column.render?.(record.thumbnail_id, record, 0) as React.ReactElement;
        const popupProps = rendered.props as {
            children: ReactNode;
            id: number;
            maxSize: number;
        };
        const fileDisplay = Children.toArray(popupProps.children)
                .find(child => isValidElement(child)) as ReactElement<{ id: number; maxSize: number }>;

        expect(popupProps.id).toBe(42);
        expect(popupProps.maxSize).toBe(500);
        expect(fileDisplay.props).toEqual({id: 42, maxSize: 150});
        expect(column.title).toBe("CommonColumns.columns.thumb.title");
    });

    it("renders the translated no-thumbnail text when the ID is absent", () => {
        const record = {thumbnail_id: null} as FileResponse;

        const rendered = column.render?.(record.thumbnail_id, record, 0);

        expect(rendered).toBe("CommonColumns.columns.thumb.no_thumb");
    });
});
