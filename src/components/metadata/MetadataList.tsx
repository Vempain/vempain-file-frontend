import {Button, Input, Modal, Space, Spin, Tooltip, Typography} from "antd";
import {EditOutlined, SearchOutlined} from "@ant-design/icons";
import {useCallback, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {usePagedTable, type VempainColumnsType, VempainTable} from "@vempain/vempain-auth-frontend";
import type {FileResponse, MetadataSummaryResponse} from "../../models";
import {metadataAPI} from "../../services";
import {metadataRowKey} from "../../tools";
import {FileDetails} from "../files";
import {MetadataFiles} from "./MetadataFiles";
import {MetadataValueEditModal} from "./MetadataValueEditModal";

interface MetadataFilters {
    group: string;
    key: string;
    value: string;
}

const EMPTY_FILTERS: MetadataFilters = {group: "", key: "", value: ""};

/**
 * Metadata management: every distinct group, key and value of the `metadata` table with the number of files carrying it.
 * The list is filtered by group, key and/or value; a row expands into the files carrying it (ten at a time) and the edit
 * action rewrites the value in all of those files as a background task.
 */
export function MetadataList() {
    const {t} = useTranslation();
    const [filterInputs, setFilterInputs] = useState<MetadataFilters>(EMPTY_FILTERS);
    const [filters, setFilters] = useState<MetadataFilters>(EMPTY_FILTERS);
    const [editing, setEditing] = useState<MetadataSummaryResponse | null>(null);
    const [selectedFile, setSelectedFile] = useState<FileResponse | null>(null);
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false);

    const paged = usePagedTable<MetadataSummaryResponse>(
            request => metadataAPI.findSummaries({
                page: request.page,
                size: request.size,
                sort_by: request.sort_by,
                direction: request.direction,
                ...(filters.group ? {metadata_group: filters.group} : {}),
                ...(filters.key ? {metadata_key: filters.key} : {}),
                ...(filters.value ? {metadata_value: filters.value} : {})
            }),
            {defaultPageSize: 10, defaultSortBy: "metadata_key", deps: [filters.group, filters.key, filters.value]}
    );

    function applyFilters() {
        setFilters({group: filterInputs.group.trim(), key: filterInputs.key.trim(), value: filterInputs.value.trim()});
        // Back to the first page; the hook's own search is unused here, so clearing it is harmless
        paged.setFilter(undefined, "");
    }

    function resetFilters() {
        setFilterInputs(EMPTY_FILTERS);
        setFilters(EMPTY_FILTERS);
        paged.setFilter(undefined, "");
    }

    const openFile = useCallback((file: FileResponse) => {
        setSelectedFile(file);
        setDetailsOpen(true);
    }, []);

    const columns: VempainColumnsType<MetadataSummaryResponse> = useMemo(() => [
        {
            title: t("MetadataList.columns.group", {defaultValue: "Group"}),
            dataIndex: "metadata_group",
            key: "metadata_group",
            sorter: true,
            searchable: false,
            mobile: true
        },
        {
            title: t("MetadataList.columns.key", {defaultValue: "Key"}),
            dataIndex: "metadata_key",
            key: "metadata_key",
            sorter: true,
            searchable: false,
            mobile: true,
            render: (value: string) => <Typography.Text strong>{value}</Typography.Text>
        },
        {
            title: t("MetadataList.columns.value", {defaultValue: "Value"}),
            dataIndex: "metadata_value",
            key: "metadata_value",
            sorter: true,
            searchable: false,
            render: (value: string) => value === ""
                    ? <Typography.Text type="secondary">{t("MetadataList.emptyValue", {defaultValue: "(empty)"})}</Typography.Text>
                    : <Tooltip title={value}>
                        <span style={{
                            display: "inline-block",
                            maxWidth: 480,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            verticalAlign: "bottom"
                        }}>
                            {value}
                        </span>
                    </Tooltip>
        },
        {
            title: t("MetadataList.columns.fileCount", {defaultValue: "Files"}),
            dataIndex: "file_count",
            key: "file_count",
            sorter: true,
            searchable: false,
            align: "right"
        },
        {
            title: t("MetadataList.columns.actions", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: MetadataSummaryResponse) => (
                    <Tooltip title={record.writable
                            ? t("MetadataList.actions.edit", {defaultValue: "Edit value"})
                            : t("MetadataList.actions.readOnly", {defaultValue: "This group is read-only and can not be written into the files"})}>
                        <Button
                                size="small"
                                icon={<EditOutlined/>}
                                disabled={!record.writable}
                                onClick={() => setEditing(record)}
                                aria-label={t("MetadataList.actions.edit", {defaultValue: "Edit value"})}
                        >
                            {t("MetadataList.actions.edit", {defaultValue: "Edit value"})}
                        </Button>
                    </Tooltip>
            )
        }
    ], [t]);

    return (
            <Space vertical style={{width: "95%", margin: 30}} size="large">
                {paged.contextHolder}
                <h2>{t("MetadataList.title", {defaultValue: "Metadata"})}</h2>
                <Space wrap>
                    <Input
                            allowClear
                            placeholder={t("MetadataList.filters.group", {defaultValue: "Group"})}
                            aria-label={t("MetadataList.filters.group", {defaultValue: "Group"})}
                            value={filterInputs.group}
                            onChange={event => setFilterInputs(current => ({...current, group: event.target.value}))}
                            onPressEnter={applyFilters}
                            style={{width: 200}}
                    />
                    <Input
                            allowClear
                            placeholder={t("MetadataList.filters.key", {defaultValue: "Key"})}
                            aria-label={t("MetadataList.filters.key", {defaultValue: "Key"})}
                            value={filterInputs.key}
                            onChange={event => setFilterInputs(current => ({...current, key: event.target.value}))}
                            onPressEnter={applyFilters}
                            style={{width: 240}}
                    />
                    <Input
                            allowClear
                            placeholder={t("MetadataList.filters.value", {defaultValue: "Value"})}
                            aria-label={t("MetadataList.filters.value", {defaultValue: "Value"})}
                            value={filterInputs.value}
                            onChange={event => setFilterInputs(current => ({...current, value: event.target.value}))}
                            onPressEnter={applyFilters}
                            style={{width: 320}}
                    />
                    <Button type="primary" icon={<SearchOutlined/>} onClick={applyFilters}>
                        {t("MetadataList.filters.apply", {defaultValue: "Filter"})}
                    </Button>
                    <Button onClick={resetFilters}>
                        {t("MetadataList.filters.reset", {defaultValue: "Reset"})}
                    </Button>
                </Space>
                <Spin spinning={paged.loading}>
                    <VempainTable
                            dataMode="server"
                            paged={paged}
                            columns={columns}
                            rowKey={metadataRowKey}
                            scroll={{x: "max-content"}}
                            expandable={{
                                expandedRowRender: (record: MetadataSummaryResponse) => <MetadataFiles summary={record} onOpenFile={openFile}/>
                            }}
                    />
                    {!paged.loading && paged.dataSource.length === 0 && t("MetadataList.messages.noRows", {defaultValue: "No metadata matches the filters"})}
                </Spin>
                <MetadataValueEditModal summary={editing} onClose={() => setEditing(null)} onFinished={() => paged.reload()}/>
                <Modal
                        open={detailsOpen}
                        onCancel={() => setDetailsOpen(false)}
                        afterClose={() => setSelectedFile(null)}
                        footer={null}
                        destroyOnHidden
                        mask={{closable: true}}
                        title={selectedFile?.filename || t("Common.modal.fileDetailsTitle", {defaultValue: "File details"})}
                        width={720}
                >
                    {selectedFile != null && <FileDetails file={selectedFile}/>}
                </Modal>
            </Space>
    );
}
