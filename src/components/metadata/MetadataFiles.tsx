import {Button, Input, Select, Space, Spin, Tag} from "antd";
import {SearchOutlined} from "@ant-design/icons";
import {useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {usePagedTable, type VempainColumnsType, VempainTable} from "@vempain/vempain-auth-frontend";
import type {FileResponse, MetadataSummaryResponse} from "../../models";
import {FileTypeEnum} from "../../models";
import {metadataAPI} from "../../services";
import {fileTypeEnum2Tag, formatByteSize, stickyTableHeader} from "../../tools";

/** Files shown per page in the expanded row; fixed so that an expanded metadata row never floods the list. */
export const METADATA_FILES_PAGE_SIZE = 10;

interface MetadataFilesProps {
    summary: MetadataSummaryResponse;
    onOpenFile: (file: FileResponse) => void;
}

/**
 * Expanded row of the metadata list: the files (that the user may read) carrying the row's group, key and value, ten at a
 * time, filtered by file name and/or type and sortable by file name, type and size. The file name opens the file details.
 */
export function MetadataFiles({summary, onOpenFile}: MetadataFilesProps) {
    const {t} = useTranslation();
    const [filenameInput, setFilenameInput] = useState<string>("");
    const [filename, setFilename] = useState<string>("");
    const [fileType, setFileType] = useState<FileTypeEnum | undefined>(undefined);

    const paged = usePagedTable<FileResponse>(
            request => metadataAPI.findFiles({
                metadata_group: summary.metadata_group,
                metadata_key: summary.metadata_key,
                metadata_value: summary.metadata_value,
                page: request.page,
                size: METADATA_FILES_PAGE_SIZE,
                sort_by: request.sort_by,
                direction: request.direction,
                ...(filename ? {filename} : {}),
                ...(fileType ? {file_type: fileType} : {})
            }),
            {
                defaultPageSize: METADATA_FILES_PAGE_SIZE,
                defaultSortBy: "filename",
                deps: [summary.metadata_group, summary.metadata_key, summary.metadata_value, filename, fileType]
            }
    );

    // The page size is fixed: the size changer of the shared hook is hidden so that the table and the request always agree
    const fixedPaged = useMemo(() => ({
        ...paged,
        pagination: {...paged.pagination, pageSize: METADATA_FILES_PAGE_SIZE, showSizeChanger: false}
    }), [paged]);

    function applyFilters(nextFilename: string, nextFileType: FileTypeEnum | undefined) {
        setFilename(nextFilename.trim());
        setFileType(nextFileType);
        // Back to the first page; the hook has no search of its own here, so clearing it is harmless
        paged.setFilter(undefined, "");
    }

    const fileTypeOptions = useMemo(() => Object.values(FileTypeEnum)
            .filter(value => value !== FileTypeEnum.UNKNOWN)
            .map(value => ({value, label: t(`FileTypeEnum.${value.toLowerCase()}`, {defaultValue: value})})), [t]);

    const columns: VempainColumnsType<FileResponse> = useMemo(() => [
        {
            title: t("MetadataFiles.columns.filename", {defaultValue: "Filename"}),
            dataIndex: "filename",
            key: "filename",
            sorter: true,
            searchable: false,
            mobile: true,
            render: (text: string, record: FileResponse) => (
                    <Button type="link" style={{padding: 0}} onClick={() => onOpenFile(record)}>{text}</Button>
            )
        },
        {
            title: t("MetadataFiles.columns.filePath", {defaultValue: "Path"}),
            dataIndex: "file_path",
            key: "file_path",
            searchable: false
        },
        {
            title: t("MetadataFiles.columns.fileType", {defaultValue: "File type"}),
            dataIndex: "file_type",
            key: "file_type",
            sorter: true,
            searchable: false,
            render: (value: FileTypeEnum, record: FileResponse) => fileTypeEnum2Tag(value ?? FileTypeEnum.UNKNOWN, t, record.id)
        },
        {
            title: t("MetadataFiles.columns.filesize", {defaultValue: "Size"}),
            dataIndex: "filesize",
            key: "filesize",
            sorter: true,
            searchable: false,
            render: (value: number) => formatByteSize(value)
        }
    ], [onOpenFile, t]);

    return (
            <Space vertical style={{width: "100%"}} size="small">
                {paged.contextHolder}
                <Space wrap>
                    <Input
                            allowClear
                            placeholder={t("MetadataFiles.filters.filename", {defaultValue: "Filter by file name"})}
                            value={filenameInput}
                            onChange={event => setFilenameInput(event.target.value)}
                            onPressEnter={() => applyFilters(filenameInput, fileType)}
                            style={{width: 240}}
                            aria-label={t("MetadataFiles.filters.filename", {defaultValue: "Filter by file name"})}
                    />
                    <Select
                            allowClear
                            placeholder={t("MetadataFiles.filters.fileType", {defaultValue: "File type"})}
                            value={fileType}
                            options={fileTypeOptions}
                            onChange={value => applyFilters(filenameInput, value)}
                            style={{width: 180}}
                            aria-label={t("MetadataFiles.filters.fileType", {defaultValue: "File type"})}
                    />
                    <Button icon={<SearchOutlined/>} onClick={() => applyFilters(filenameInput, fileType)}>
                        {t("MetadataFiles.filters.apply", {defaultValue: "Filter"})}
                    </Button>
                </Space>
                <Spin spinning={paged.loading}>
                    {!paged.loading && paged.dataSource.length === 0
                            ? <Tag>{t("MetadataFiles.messages.noFiles", {defaultValue: "No readable files carry this value"})}</Tag>
                            : <VempainTable
                                    sticky={stickyTableHeader}
                                    dataMode="server"
                                    paged={fixedPaged}
                                    columns={columns}
                                    rowKey="id"
                                    size="small"
                                    scroll={{x: "max-content"}}
                            />}
                </Spin>
            </Space>
    );
}
