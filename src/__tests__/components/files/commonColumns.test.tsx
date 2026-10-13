import type {TFunction} from "i18next";
import {Children, isValidElement, type ReactElement, type ReactNode} from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import dayjs from "dayjs";
import type {FileResponse} from "../../../models";
import {
    createdColumn,
    filenameColumn,
    filePathColumn,
    fileSizeColumn,
    mimetypeColumn,
    modifiedColumn,
    thumbnailColumn
} from "../../../components/files/commonColumns";
import {formatByteSize, formatDateWithTimeZone} from "../../../tools";

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
    ThumbnailPopup: ({children, id, maxSize}: { children: ReactNode; id: number; maxSize: number }) => (
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

describe("the shared file columns", () => {
    const t = ((key: string) => key) as TFunction;
    const alpha = {
        filename: "alpha.jpg",
        file_path: "/b",
        filesize: 10,
        mimetype: "image/png",
        created: "2024-01-02",
        modified: null
    } as unknown as FileResponse;
    const beta = {
        filename: "beta.jpg",
        file_path: "/a",
        filesize: 5,
        mimetype: "image/jpeg",
        created: "2024-01-01",
        modified: "2024-02-01"
    } as unknown as FileResponse;
    const bare = {filename: "", file_path: "", filesize: 0, mimetype: "", created: null, modified: null} as unknown as FileResponse;

    beforeEach(() => {
        jest.mocked(formatByteSize).mockReset().mockReturnValue("10 B");
        jest.mocked(formatDateWithTimeZone).mockReset().mockReturnValue("formatted");
    });

    it("filenameColumn renders a link button that opens the details and sorts by name", () => {
        const onOpenDetails = jest.fn();
        const column = filenameColumn(onOpenDetails, t);

        render(column.render?.("alpha.jpg", alpha, 0) as React.ReactElement);
        fireEvent.click(screen.getByRole("button", {name: "alpha.jpg"}));

        expect(onOpenDetails).toHaveBeenCalledWith(alpha);
        expect(column.title).toBe("CommonColumns.columns.filename.title");
        expect((column.sorter as (a: FileResponse, b: FileResponse) => number)(alpha, beta)).toBeLessThan(0);
    });

    it("filePathColumn, fileSizeColumn and mimetypeColumn sort by their field", () => {
        expect((filePathColumn(t).sorter as (a: FileResponse, b: FileResponse) => number)(alpha, beta)).toBeGreaterThan(0);
        expect((fileSizeColumn(t).sorter as (a: FileResponse, b: FileResponse) => number)(alpha, beta)).toBe(5);
        expect((mimetypeColumn(t).sorter as (a: FileResponse, b: FileResponse) => number)(alpha, beta)).toBeGreaterThan(0);
        expect(filePathColumn(t).title).toBe("CommonColumns.columns.file_path.title");
        expect(mimetypeColumn(t).title).toBe("CommonColumns.columns.mimetype.title");
    });

    it("fileSizeColumn renders the size through formatByteSize", () => {
        expect(fileSizeColumn(t).render?.(10, alpha, 0)).toBe("10 B");
        expect(formatByteSize).toHaveBeenCalledWith(10);
    });

    it.each([
        ["createdColumn", createdColumn, "created"],
        ["modifiedColumn", modifiedColumn, "modified"]
    ] as const)("%s orders missing timestamps first and formats the value with the time zone", (_name, factory, field) => {
        const column = factory(t);
        const sorter = column.sorter as (a: FileResponse, b: FileResponse) => number;
        const withValue = {...alpha, [field]: dayjs("2024-03-01")} as FileResponse;
        const withLater = {...beta, [field]: dayjs("2024-04-01")} as FileResponse;

        expect(sorter(bare, bare)).toBe(0);
        expect(sorter(bare, withValue)).toBe(-1);
        expect(sorter(withValue, bare)).toBe(1);
        expect(sorter(withValue, withLater)).toBeLessThan(0);

        expect(column.render?.("2024-03-01", withValue, 0)).toBe("formatted");
        expect(formatDateWithTimeZone).toHaveBeenLastCalledWith("2024-03-01");
        expect(column.render?.(null as unknown as string, bare, 0)).toBe("formatted");
        expect(formatDateWithTimeZone).toHaveBeenLastCalledWith(null);
        expect(column.title).toBe(`CommonColumns.columns.${field}.title`);
    });
});
