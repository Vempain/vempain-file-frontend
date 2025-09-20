import {Button} from "antd";
import type {ColumnType} from "antd/es/table";
import type {FileResponse} from "../../models/responses";
import {formatDateWithTimeZone} from "../../tools";

export function formatSizeKB(size?: number): string {
    if (size == null) return "";
    return `${(size / 1024).toFixed(2)} KB`;
}

// Filename column with modal trigger
export function filenameColumn<T extends FileResponse>(
        onOpenDetails: (record: T) => void
): ColumnType<T> {
    return {
        title: "Filename",
        dataIndex: "filename",
        key: "filename",
        sorter: (a: T, b: T) => a.filename.localeCompare(b.filename),
        render: (text: string, record: T) => (
                <Button type="link" onClick={() => onOpenDetails(record)}>
                    {text}
                </Button>
        ),
    };
}

// File path
export function filePathColumn<T extends FileResponse>(): ColumnType<T> {
    return {
        title: "File path",
        dataIndex: "file_path",
        key: "file_path",
        sorter: (a: T, b: T) => a.file_path.localeCompare(b.file_path),
    };
}

// File size
export function fileSizeColumn<T extends FileResponse>(): ColumnType<T> {
    return {
        title: "File Size",
        dataIndex: "filesize",
        key: "filesize",
        sorter: (a: T, b: T) => a.filesize - b.filesize,
        render: (size: number) => formatSizeKB(size),
    };
}

// MIME type
export function mimetypeColumn<T extends FileResponse>(): ColumnType<T> {
    return {
        title: "MIME Type",
        dataIndex: "mimetype",
        key: "mimetype",
        sorter: (a: T, b: T) => a.mimetype.localeCompare(b.mimetype),
    };
}

// Created timestamp
export function createdColumn<T extends FileResponse>(): ColumnType<T> {
    return {
        title: "Created",
        dataIndex: "created",
        key: "created",
        sorter: (a: T, b: T) => new Date(a.created).getTime() - new Date(b.created).getTime(),
        render: (date: string) => formatDateWithTimeZone(date == null ? null : date as string),
    };
}

// Modified timestamp
export function modifiedColumn<T extends FileResponse>(): ColumnType<T> {
    return {
        title: "Modified",
        dataIndex: "modified",
        key: "modified",
        sorter: (a: T, b: T) => new Date(a.modified).getTime() - new Date(b.modified).getTime(),
        render: (date: string) => formatDateWithTimeZone(date == null ? null : date as string),
    };
}

