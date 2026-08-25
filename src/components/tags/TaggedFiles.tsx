import {ArrowLeftOutlined, SearchOutlined} from "@ant-design/icons";
import {Button, Input, type InputRef, message, Space, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import type {ColumnType, FilterDropdownProps, FilterValue, SorterResult} from "antd/es/table/interface";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import type {PagedRequest, PagedResponse} from "@vempain/vempain-auth-frontend";
import type {FileResponse} from "../../models";
import {tagAPI} from "../../services";
import {formatByteSize, formatDateWithTimeZone} from "../../tools";

type SearchableColumn = "filename" | "file_path" | "description" | "mimetype";

export function TaggedFiles() {
    const {tagId} = useParams<{ tagId: string }>();
    const navigate = useNavigate();
    const {t} = useTranslation();
    const searchInput = useRef<InputRef>(null);
    const [files, setFiles] = useState<FileResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [tagName, setTagName] = useState<string>();
    const [pagedRequest, setPagedRequest] = useState<PagedRequest>({
        page: 0,
        size: 10,
        sort_by: "filename",
        direction: "ASC",
        case_sensitive: false
    });
    const [totalElements, setTotalElements] = useState(0);

    const numericTagId = Number(tagId);

    const fetchFiles = useCallback(() => {
        if (!Number.isInteger(numericTagId) || numericTagId < 1) {
            setLoading(false);
            message.error(t("TaggedFiles.messages.invalidTag"));
            return;
        }
        setLoading(true);
        tagAPI.findFilesPageable(numericTagId, pagedRequest)
                .then((response: PagedResponse<FileResponse>) => {
                    setFiles(response.content);
                    setTotalElements(response.total_elements);
                })
                .catch((error: unknown) => {
                    message.error(t("TaggedFiles.messages.fetchError", {error: String(error)}));
                })
                .finally(() => setLoading(false));
    }, [numericTagId, pagedRequest, t]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

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

    const columns: ColumnsType<FileResponse> = useMemo(() => [
        {
            title: t("TaggedFiles.columns.id"),
            dataIndex: "id",
            key: "id",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "id" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined
        },
        {
            title: t("TaggedFiles.columns.filename"),
            dataIndex: "filename",
            key: "filename",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "filename" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            ...getColumnSearchProps("filename")
        },
        {
            title: t("TaggedFiles.columns.filePath"),
            dataIndex: "file_path",
            key: "file_path",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "file_path" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            ...getColumnSearchProps("file_path")
        },
        {
            title: t("TaggedFiles.columns.mimetype"),
            dataIndex: "mimetype",
            key: "mimetype",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "mimetype" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            ...getColumnSearchProps("mimetype")
        },
        {
            title: t("TaggedFiles.columns.filesize"),
            dataIndex: "filesize",
            key: "filesize",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "filesize" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            render: (value: number) => formatByteSize(value)
        },
        {
            title: t("TaggedFiles.columns.fileType"),
            dataIndex: "file_type",
            key: "file_type",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "file_type" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined
        },
        {
            title: t("TaggedFiles.columns.created"),
            dataIndex: "created",
            key: "created",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "created" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            render: (value: FileResponse["created"]) => formatDateWithTimeZone(value)
        }
    ], [getColumnSearchProps, pagedRequest, t]);

    const handleTableChange = (
            pagination: { current?: number; pageSize?: number },
            filters: Record<string, FilterValue | null>,
            sorter: SorterResult<FileResponse> | SorterResult<FileResponse>[]
    ) => {
        const search = Object.values(filters)
                .flatMap(value => value ?? [])
                .find(value => typeof value === "string" && value.length > 0);
        const sortField = !Array.isArray(sorter) && typeof sorter.field === "string" ? sorter.field : undefined;
        setPagedRequest(previous => ({
            ...previous,
            page: (pagination.current ?? 1) - 1,
            size: pagination.pageSize ?? previous.size,
            sort_by: sortField ?? previous.sort_by,
            direction: !Array.isArray(sorter) && sorter.order === "descend" ? "DESC" : "ASC",
            search: typeof search === "string" ? search : undefined
        }));
    };

    return (
            <Space vertical style={{width: "95%", margin: 30}} size="large">
                <Space>
                    <Button icon={<ArrowLeftOutlined/>} onClick={() => navigate("/tags/list")}>
                        {t("TaggedFiles.actions.back")}
                    </Button>
                    <h2>{t("TaggedFiles.title", {tag: tagName ?? tagId})}</h2>
                </Space>
                <Spin spinning={loading}>
                    {!loading && files.length === 0
                            ? t("TaggedFiles.messages.noFiles")
                            : <Table
                                    columns={columns}
                                    dataSource={files}
                                    loading={loading}
                                    rowKey="id"
                                    pagination={{
                                        current: pagedRequest.page + 1,
                                        pageSize: pagedRequest.size,
                                        total: totalElements,
                                        showSizeChanger: true,
                                        pageSizeOptions: ["10", "20", "50", "100"]
                                    }}
                                    onChange={handleTableChange}
                                    scroll={{x: "max-content"}}
                            />}
                </Spin>
            </Space>
    );
}
