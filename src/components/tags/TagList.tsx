import {Button, Input, message, Space, Spin, Table} from "antd";
import {useEffect, useState} from "react";
import {tagsAPI} from "../../services";
import type {TagResponse} from "../../models/responses";
import {getPaginationConfig} from "../../tools/tablePaginationConfig.ts";
import type {TagRequest} from "../../models/requests";
import {useTranslation} from "react-i18next";

export function TagList() {
    const {t} = useTranslation();
    const [tags, setTags] = useState<TagResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [editingRowId, setEditingRowId] = useState<number | null>(null);
    const [editedRow, setEditedRow] = useState<Partial<TagResponse>>({});

    useEffect(() => {
        setLoading(true);
        tagsAPI.findAll()
                .then((response: TagResponse[]) => {
                    setTags(response);
                    setPagination(getPaginationConfig(response.length));
                })
                .catch((error: unknown) => {
                    const errMsg = error instanceof Error ? error.message : "Unknown error";
                    message.error(t("TagList.messages.fetchError", {error: errMsg}));
                })
                .finally(() => setLoading(false));
    }, [t]);

    const startEdit = (record: TagResponse) => {
        setEditingRowId(record.id);
        setEditedRow({...record});
    };

    const cancelEdit = () => {
        setEditingRowId(null);
        setEditedRow({});
    };

    const saveEdit = async (id: number) => {
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
        }
        try {
            tagsAPI.update(requestPayload)
                    .then(() => {
                        message.success(t("TagList.messages.updateSuccess"));
                        setTags(tags =>
                                tags.map(tag => tag.id === id ? {...tag, ...editedRow} : tag)
                        );
                    })
                    .catch((error: unknown) => {
                        message.error(t("TagList.messages.updateFailedWithReason", {error: String(error)}));
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            message.success(t("TagList.messages.updated"));
        } catch {
            message.error(t("TagList.messages.updateFailed"));
        } finally {
            setEditingRowId(null);
            setEditedRow({});
            setLoading(false);
        }
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

    const tagColumns = [
        {
            title: t("TagList.tableColumns.id.title"),
            dataIndex: "id",
            key: "id",
            sorter: (a: TagResponse, b: TagResponse) => a.id - b.id,
        },
        {
            title: t("TagList.tableColumns.tag_name.title"),
            dataIndex: "tag_name",
            key: "tag_name",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name.localeCompare(b.tag_name),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name", record),
        },
        {
            title: t("TagList.tableColumns.tag_name_de.title"),
            dataIndex: "tag_name_de",
            key: "tag_name_de",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_de.localeCompare(b.tag_name_de),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_de", record),
        },
        {
            title: t("TagList.tableColumns.tag_name_en.title"),
            dataIndex: "tag_name_en",
            key: "tag_name_en",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_en.localeCompare(b.tag_name_en),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_en", record),
        },
        {
            title: t("TagList.tableColumns.tag_name_es.title"),
            dataIndex: "tag_name_es",
            key: "tag_name_es",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_es.localeCompare(b.tag_name_es),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_es", record),
        },
        {
            title: t("TagList.tableColumns.tag_name_fi.title"),
            dataIndex: "tag_name_fi",
            key: "tag_name_fi",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_fi.localeCompare(b.tag_name_fi),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_fi", record),
        },
        {
            title: t("TagList.tableColumns.tag_name_sv.title"),
            dataIndex: "tag_name_sv",
            key: "tag_name_sv",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_sv.localeCompare(b.tag_name_sv),
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
                            <a href={`/tags/${record.id}`}>{t("TagList.actions.viewTaggedFiles")}</a>
                            <Button onClick={() => startEdit(record)} size="small">
                                {t("TagList.actions.edit")}
                            </Button>
                        </Space>
                );
            }
        }
    ];

    return (
            <div className={"DarkDiv"} key={"tagListDiv"}>
                <Spin tip={t("TagList.messages.loadingTip")} spinning={loading} key={"componentListSpinner"}>
                    {!loading &&
                            <Table
                                    dataSource={tags}
                                    loading={loading}
                                    rowKey="id"
                                    pagination={pagination}
                                    columns={tagColumns}
                            />
                    }
                </Spin>
            </div>
    );
}
