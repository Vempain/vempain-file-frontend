import {Button, Input, type InputRef, message, Modal, Select, Space, Spin, Table} from "antd";
import {SearchOutlined} from "@ant-design/icons";
import {useCallback, useEffect, useRef, useState} from "react";
import type {ColumnsType} from "antd/es/table";
import type {ColumnType, FilterDropdownProps, FilterValue, SorterResult} from "antd/es/table/interface";
import {tagAPI} from "../../services";
import type {TagRequest, TagResponse} from "../../models";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";

interface ReplacementTagSelectProps {
    excludedTagId: number;
    onChange: (value: string) => void;
}

function ReplacementTagSelect({excludedTagId, onChange}: ReplacementTagSelectProps) {
    const {t} = useTranslation();
    const [options, setOptions] = useState<TagResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const searchRef = useRef("");
    const requestIdRef = useRef(0);

    const fetchOptions = useCallback((nextPage: number, search: string, append: boolean) => {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        tagAPI.findPageable({
            page: nextPage,
            size: 200,
            sort_by: "tag_name",
            direction: "ASC",
            case_sensitive: false,
            ...(search ? {search} : {})
        })
                .then(response => {
                    if (requestId !== requestIdRef.current) return;
                    const fetchedOptions = (response.content ?? []).filter(tag => tag.id !== excludedTagId);
                    setOptions(current => append ? [...current, ...fetchedOptions] : fetchedOptions);
                    setPage(nextPage);
                    setHasMore(!response.last);
                })
                .catch((error: unknown) => {
                    if (requestId !== requestIdRef.current) return;
                    message.error(t("TagList.messages.fetchError", {error: String(error)}));
                })
                .finally(() => {
                    if (requestId === requestIdRef.current) setLoading(false);
                });
    }, [excludedTagId, t]);

    useEffect(() => {
        fetchOptions(0, "", false);
    }, [fetchOptions]);

    return (
            <Select
                    autoFocus
                    showSearch
                    style={{width: "100%"}}
                    placeholder={t("TagList.messages.replacementSelect")}
                    filterOption={false}
                    loading={loading}
                    options={options
                            .map(tag => ({label: tag.tag_name, value: tag.tag_name}))}
                    onSearch={search => {
                        searchRef.current = search;
                        fetchOptions(0, search, false);
                    }}
                    onPopupScroll={event => {
                        const target = event.currentTarget;
                        if (target.scrollTop + target.offsetHeight >= target.scrollHeight - 1 &&
                                !loading && hasMore) {
                            fetchOptions(page + 1, searchRef.current, true);
                        }
                    }}
                    onChange={onChange}
            />
    );
}

export function TagList() {
    const {t} = useTranslation();
    const [modal, contextHolder] = Modal.useModal();
    const [tags, setTags] = useState<TagResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagedRequest, setPagedRequest] = useState<PagedRequest>({
        page: 0, size: 10, sort_by: "tag_name", direction: "ASC", case_sensitive: false
    });
    const [totalElements, setTotalElements] = useState(0);
    const searchInput = useRef<InputRef>(null);
    const [editingRowId, setEditingRowId] = useState<number | null>(null);
    const [editedRow, setEditedRow] = useState<Partial<TagResponse>>({});

    const fetchTags = useCallback((request: PagedRequest = pagedRequest) => {
        setLoading(true);
        tagAPI.findPageable(request)
                .then(response => {
                    setTags(response.content ?? []);
                    setTotalElements(response.total_elements ?? 0);
                })
                .catch((error: unknown) => {
                    const errMsg = error instanceof Error ? error.message : "Unknown error";
                    message.error(t("TagList.messages.fetchError", {error: errMsg}));
                })
                .finally(() => setLoading(false));
    }, [pagedRequest, t]);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    const startEdit = (record: TagResponse) => {
        setEditingRowId(record.id);
        setEditedRow({...record});
    };

    const cancelEdit = () => {
        setEditingRowId(null);
        setEditedRow({});
    };

    const saveEdit = (id: number) => {
        setLoading(true);
        if (!editedRow) {
            message.error(t("TagList.messages.noChanges"));
            setLoading(false);
            return;
        }

        if (!editedRow.tag_name) {
            message.error(t("TagList.messages.tagNameRequired"));
            setLoading(false);
            return;
        }

        const requestPayload: TagRequest = {
            id: id,
            tag_name: editedRow.tag_name,
            tag_name_de: editedRow.tag_name_de || "",
            tag_name_en: editedRow.tag_name_en || "",
            tag_name_es: editedRow.tag_name_es || "",
            tag_name_fi: editedRow.tag_name_fi || "",
            tag_name_sv: editedRow.tag_name_sv || ""
        };

        tagAPI.update(requestPayload)
                .then(() => {
                    message.success(t("TagList.messages.updateSuccess"));
                    setTags(currentTags =>
                            currentTags.map(tag => tag.id === id ? {...tag, ...editedRow} : tag)
                    );
                })
                .catch((error: unknown) => {
                    message.error(t("TagList.messages.updateFailedWithReason", {error: String(error)}));
                })
                .finally(() => {
                    setEditingRowId(null);
                    setEditedRow({});
                    setLoading(false);
                });
    };

    const isRowChanged = (record: TagResponse) => {
        if (!editingRowId || editedRow === null) return false;
        return (
                record.tag_name !== editedRow.tag_name ||
                record.tag_name_de !== editedRow.tag_name_de ||
                record.tag_name_en !== editedRow.tag_name_en ||
                record.tag_name_es !== editedRow.tag_name_es ||
                record.tag_name_fi !== editedRow.tag_name_fi ||
                record.tag_name_sv !== editedRow.tag_name_sv
        );
    };

    const executeAllAction = async (record: TagResponse, operation: "remove" | "replace" | "rename", replacement?: string) => {
        const request = {tag_name: record.tag_name, replacement_tag_name: replacement, file_ids: []};
        const call = operation === "remove" ? tagAPI.removeTagFromAll(request)
                : operation === "replace" ? tagAPI.replaceTagAcrossAll(request) : tagAPI.renameTagAcrossAll(request);
        try {
            await call;
            message.success(t("TagList.messages.actionSuccess"));
            setTags(current => current.filter(tag => operation === "remove" || tag.id !== record.id));
        } catch (error) {
            message.error(t("TagList.messages.actionFailed", {error: String(error)}));
        }
    };

    const runAllAction = (record: TagResponse, operation: "remove" | "replace" | "rename") => {
        if (operation === "replace") {
            let replacement: string | undefined;
            modal.confirm({
                title: t("TagList.messages.confirmAll"),
                content: (
                        <ReplacementTagSelect
                                excludedTagId={record.id}
                                onChange={value => {
                                    replacement = value;
                                }}
                        />
                ),
                onOk: () => {
                    if (!replacement) {
                        message.error(t("TagList.messages.replacementRequired"));
                        return Promise.reject(new Error(t("TagList.messages.replacementRequired")));
                    }
                    return executeAllAction(record, operation, replacement);
                }
            });
            return;
        }

        const replacement = operation === "remove" ? undefined : window.prompt(t("TagList.messages.replacementPrompt"));
        if (operation !== "remove" && !replacement) return;
        modal.confirm({
            title: t("TagList.messages.confirmAll"),
            onOk: () => executeAllAction(record, operation, replacement ?? undefined)
        });
    };

    const editableCell = (dataIndex: keyof TagResponse, record: TagResponse) => {
        if (editingRowId === record.id) {
            return (
                    <Input
                            value={editedRow[dataIndex] ?? ""}
                            onChange={e =>
                                    setEditedRow(row => ({...row, [dataIndex]: e.target.value}))
                            }
                            style={{minWidth: 120}}
                    />
            );
        }
        return <span style={dataIndex === "tag_name" ? {fontWeight: "bold"} : {}}>
                    {record[dataIndex] || <span style={{color: "gray"}}>-</span>}
                </span>;
    };

    const getColumnSearchProps = useCallback((dataIndex: keyof TagResponse): ColumnType<TagResponse> => ({
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
            onOpenChange: (visible: boolean) => visible && setTimeout(() => searchInput.current?.select(), 100)
        },
        dataIndex
    }), [t]);

    const tagColumns: ColumnsType<TagResponse> = [
        {
            title: t("TagList.tableColumns.id.title"),
            dataIndex: "id",
            key: "id",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "id" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
        },
        {
            title: t("TagList.tableColumns.tag_name.title"),
            dataIndex: "tag_name",
            key: "tag_name",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "tag_name" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            ...getColumnSearchProps("tag_name"),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name", record),
        },
        {
            title: t("TagList.tableColumns.tag_name_de.title"),
            dataIndex: "tag_name_de",
            key: "tag_name_de",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "tag_name_de" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            ...getColumnSearchProps("tag_name_de"),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_de", record),
        },
        {
            title: t("TagList.tableColumns.tag_name_en.title"),
            dataIndex: "tag_name_en",
            key: "tag_name_en",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "tag_name_en" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            ...getColumnSearchProps("tag_name_en"),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_en", record),
        },
        {
            title: t("TagList.tableColumns.tag_name_es.title"),
            dataIndex: "tag_name_es",
            key: "tag_name_es",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "tag_name_es" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            ...getColumnSearchProps("tag_name_es"),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_es", record),
        },
        {
            title: t("TagList.tableColumns.tag_name_fi.title"),
            dataIndex: "tag_name_fi",
            key: "tag_name_fi",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "tag_name_fi" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            ...getColumnSearchProps("tag_name_fi"),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_fi", record),
        },
        {
            title: t("TagList.tableColumns.tag_name_sv.title"),
            dataIndex: "tag_name_sv",
            key: "tag_name_sv",
            sorter: true,
            sortOrder: pagedRequest.sort_by === "tag_name_sv" ? (pagedRequest.direction === "DESC" ? "descend" : "ascend") : undefined,
            ...getColumnSearchProps("tag_name_sv"),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_sv", record),
        },
        {
            title: t("TagList.tableColumns.actions.title"),
            key: "actions",
            render: (_: undefined, record: TagResponse) => {
                if (editingRowId === record.id) {
                    return (
                            <Space>
                                <Button
                                        type="primary"
                                        onClick={() => saveEdit(record.id)}
                                        disabled={!isRowChanged(record)}
                                >
                                    {t("TagList.actions.save")}
                                </Button>
                                <Button onClick={cancelEdit}>{t("TagList.actions.cancel")}</Button>
                            </Space>
                    );
                }
                return (
                        <Space>
                            <Link to={`/tags/${record.id}`}>{t("TagList.actions.viewTaggedFiles")}</Link>
                            <Button onClick={() => startEdit(record)} size="small">
                                {t("TagList.actions.edit")}
                            </Button>
                            <Button danger size="small" onClick={() => runAllAction(record, "remove")}>
                                {t("TagList.actions.removeAll", {defaultValue: "Remove all"})}
                            </Button>
                            <Button size="small" onClick={() => runAllAction(record, "replace")}>
                                {t("TagList.actions.replaceAll", {defaultValue: "Replace all"})}
                            </Button>
                            <Button size="small" onClick={() => runAllAction(record, "rename")}>
                                {t("TagList.actions.renameAll", {defaultValue: "Rename all"})}
                            </Button>
                        </Space>
                );
            }
        }
    ];

    const handleTableChange = (
            pagination: { current?: number; pageSize?: number },
            filters: Record<string, FilterValue | null>,
            sorter: SorterResult<TagResponse> | SorterResult<TagResponse>[]
    ) => {
        const search = Object.values(filters).flatMap(value => value ?? [])
                .find(value => typeof value === "string" && value.length > 0);
        const nextSorter = !Array.isArray(sorter) && sorter.field ? sorter : undefined;
        setPagedRequest(previous => ({
            ...previous,
            page: (pagination.current ?? 1) - 1,
            size: pagination.pageSize ?? previous.size,
            sort_by: typeof nextSorter?.field === "string" ? nextSorter.field : "tag_name",
            direction: nextSorter?.order === "descend" ? "DESC" : "ASC",
            search: typeof search === "string" ? search : undefined
        }));
    };

    return (
            <div className={"DarkDiv"} key={"tagListDiv"}>
                {contextHolder}
                <Spin description={t("TagList.messages.loadingTip")} spinning={loading} key={"componentListSpinner"}>
                    {!loading &&
                            <Table
                                    dataSource={tags}
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
                                    columns={tagColumns}
                            />
                    }
                </Spin>
            </div>
    );
}
