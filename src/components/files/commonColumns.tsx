import {Button} from "antd";
import type {ColumnType} from "antd/es/table";
import type {FileResponse} from "../../models";
import {formatDateWithTimeZone} from "../../tools";
import type {TFunction} from "i18next";

export function formatSizeKB(size?: number): string {
    if (size == null) return "";
    return `${(size / 1024).toFixed(2)} KB`;
}

// Filename column with modal trigger
export function filenameColumn<T extends FileResponse>(
        onOpenDetails: (record: T) => void,
        t: TFunction
): ColumnType<T> {
    return {
        title: t("CommonColumns.columns.filename.title"),
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
export function filePathColumn<T extends FileResponse>(t: TFunction): ColumnType<T> {
    return {
        title: t("CommonColumns.columns.file_path.title"),
        dataIndex: "file_path",
        key: "file_path",
        sorter: (a: T, b: T) => a.file_path.localeCompare(b.file_path),
    };
}

// File size
export function fileSizeColumn<T extends FileResponse>(t: TFunction): ColumnType<T> {
    return {
        title: t("CommonColumns.columns.filesize.title"),
        dataIndex: "filesize",
        key: "filesize",
        sorter: (a: T, b: T) => a.filesize - b.filesize,
        render: (size: number) => formatSizeKB(size),
    };
}

// MIME type
export function mimetypeColumn<T extends FileResponse>(t: TFunction): ColumnType<T> {
    return {
        title: t("CommonColumns.columns.mimetype.title"),
        dataIndex: "mimetype",
        key: "mimetype",
        sorter: (a: T, b: T) => a.mimetype.localeCompare(b.mimetype),
    };
}

// Created timestamp
export function createdColumn<T extends FileResponse>(t: TFunction): ColumnType<T> {
    return {
        title: t("CommonColumns.columns.created.title"),
        dataIndex: "created",
        key: "created",
        sorter: (a: T, b: T) => {
            if (a.created == null && b.created == null) return 0;
            if (a.created == null) return -1;
            if (b.created == null) return 1;
            return a.created.valueOf() - b.created.valueOf();
        },
        render: (date: string) => formatDateWithTimeZone(date == null ? null : (date as string)),
    };
}

// Modified timestamp
export function modifiedColumn<T extends FileResponse>(t: TFunction): ColumnType<T> {
    return {
        title: t("CommonColumns.columns.modified.title"),
        dataIndex: "modified",
        key: "modified",
        sorter: (a: T, b: T) => {
            if (a.modified == null && b.modified == null) return 0;
            if (a.modified == null) return -1;
            if (b.modified == null) return 1;
            return a.modified.valueOf() - b.modified.valueOf();
        },
        render: (date: string) => formatDateWithTimeZone(date == null ? null : (date as string)),
    };
}
