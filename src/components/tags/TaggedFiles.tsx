import {ArrowLeftOutlined, SearchOutlined} from "@ant-design/icons";
import {Button, Input, type InputRef, message, Space, Spin} from "antd";
import type {ColumnType, FilterDropdownProps} from "antd/es/table/interface";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {usePagedTable, type VempainColumnsType, VempainTable} from "@vempain/vempain-auth-frontend";
import type {FileResponse} from "../../models";
import {tagAPI} from "../../services";
import {formatByteSize, formatDateWithTimeZone} from "../../tools";

type SearchableColumn = "filename" | "file_path" | "description" | "mimetype";

export function TaggedFiles() {
    const {tagId} = useParams<{ tagId: string }>();
    const navigate = useNavigate();
    const {t} = useTranslation();
    const searchInput = useRef<InputRef>(null);
    const [tagName, setTagName] = useState<string>();

    const numericTagId = Number(tagId);
    const validTagId = Number.isInteger(numericTagId) && numericTagId > 0;
    const paged = usePagedTable<FileResponse>(
            request => tagAPI.findFilesPageable(numericTagId, request),
            {defaultPageSize: 10, defaultSortBy: "filename", deps: [numericTagId], enabled: validTagId}
    );

    useEffect(() => {
        if (!validTagId) {
            message.error(t("TaggedFiles.messages.invalidTag"));
        }
    }, [t, validTagId]);

    useEffect(() => {
        if (!Number.isInteger(numericTagId) || numericTagId < 1) return;
        tagAPI.findById(numericTagId, null)
                .then(tag => setTagName(tag.tag_name))
                .catch(() => setTagName(undefined));
    }, [numericTagId]);

    const getColumnSearchProps = useCallback((dataIndex: SearchableColumn): ColumnType<FileResponse> => ({
        filterDropdown: ({setSelectedKeys, selectedKeys, confirm, clearFilters, close}: FilterDropdownProps) => (
                <div style={{padding: 8}} onKeyDown={event => event.stopPropagation()}>
                    <Input
                            ref={searchInput}
                            value={selectedKeys[0]}
                            onChange={event => setSelectedKeys(event.target.value ? [event.target.value] : [])}
                            onPressEnter={() => confirm()}
                            style={{marginBottom: 8, display: "block"}}
                    />
                    <Space>
                        <Button type="primary" size="small" icon={<SearchOutlined/>} onClick={() => confirm()}>
                            {t("Common.search", {defaultValue: "Search"})}
                        </Button>
                        <Button size="small" onClick={() => {
                            clearFilters?.();
                            confirm();
                            close();
                        }}>
                            {t("Common.reset", {defaultValue: "Reset"})}
                        </Button>
                    </Space>
                </div>
        ),
        filterIcon: (filtered: boolean) => <SearchOutlined style={{color: filtered ? "#1677ff" : undefined}}/>,
        filterDropdownProps: {
            onOpenChange: (visible: boolean) => {
                if (visible) setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        dataIndex
    }), [t]);

    const columns: VempainColumnsType<FileResponse> = useMemo(() => [
        {
            title: t("TaggedFiles.columns.id"),
            dataIndex: "id",
            key: "id",
            sorter: true,
        },
        {
            title: t("TaggedFiles.columns.filename"),
            dataIndex: "filename",
            key: "filename",
            sorter: true,
            searchable: true,
            ...getColumnSearchProps("filename")
        },
        {
            title: t("TaggedFiles.columns.filePath"),
            dataIndex: "file_path",
            key: "file_path",
            sorter: true,
            searchable: true,
            ...getColumnSearchProps("file_path")
        },
        {
            title: t("TaggedFiles.columns.mimetype"),
            dataIndex: "mimetype",
            key: "mimetype",
            sorter: true,
            searchable: true,
            ...getColumnSearchProps("mimetype")
        },
        {
            title: t("TaggedFiles.columns.filesize"),
            dataIndex: "filesize",
            key: "filesize",
            sorter: true,
            render: (value: number) => formatByteSize(value)
        },
        {
            title: t("TaggedFiles.columns.fileType"),
            dataIndex: "file_type",
            key: "file_type",
            sorter: true,
        },
        {
            title: t("TaggedFiles.columns.created"),
            dataIndex: "created",
            key: "created",
            sorter: true,
            render: (value: FileResponse["created"]) => formatDateWithTimeZone(value)
        }
    ], [getColumnSearchProps, t]);

    return (
            <Space vertical style={{width: "95%", margin: 30}} size="large">
                {paged.contextHolder}
                <Space>
                    <Button icon={<ArrowLeftOutlined/>} onClick={() => navigate("/tags/list")}>
                        {t("TaggedFiles.actions.back")}
                    </Button>
                    <h2>{t("TaggedFiles.title", {tag: tagName ?? tagId})}</h2>
                </Space>
                <Spin spinning={paged.loading}>
                    {!paged.loading && paged.dataSource.length === 0
                            ? t("TaggedFiles.messages.noFiles")
                            : <VempainTable
                                    dataMode="server"
                                    paged={paged}
                                    columns={columns}
                                    rowKey="id"
                                    scroll={{x: "max-content"}}
                            />}
                </Spin>
            </Space>
    );
}
