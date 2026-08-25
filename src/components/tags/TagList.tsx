import {Button, Input, message, Modal, Select, Space, Spin, Table} from "antd";
import {useEffect, useState} from "react";
import {tagAPI} from "../../services";
import type {TagRequest, TagResponse} from "../../models";
import {getPaginationConfig} from "../../tools";
import {useTranslation} from "react-i18next";
import {Link} from "react-router-dom";

export function TagList() {
    const {t} = useTranslation();
    const [tags, setTags] = useState<TagResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [editingRowId, setEditingRowId] = useState<number | null>(null);
    const [editedRow, setEditedRow] = useState<Partial<TagResponse>>({});

    useEffect(() => {
        setLoading(true);
        tagAPI.findAll()
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
            tagAPI.findAll()
                    .then(existingTags => {
                        let replacement: string | undefined;
                        Modal.confirm({
                            title: t("TagList.messages.confirmAll"),
                            content: (
                                    <Select
                                            autoFocus
                                            showSearch
                                            style={{width: "100%"}}
                                            placeholder={t("TagList.messages.replacementSelect")}
                                            options={existingTags
                                                    .filter(tag => tag.id !== record.id)
                                                    .sort((first, second) => first.tag_name.localeCompare(second.tag_name))
                                                    .map(tag => ({label: tag.tag_name, value: tag.tag_name}))}
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
                    })
                    .catch((error: unknown) => {
                        message.error(t("TagList.messages.fetchError", {error: String(error)}));
                    });
            return;
        }

        const replacement = operation === "remove" ? undefined : window.prompt(t("TagList.messages.replacementPrompt"));
        if (operation !== "remove" && !replacement) return;
        Modal.confirm({
            title: t("TagList.messages.confirmAll"),
            onOk: () => executeAllAction(record, operation, replacement)
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

    return (
            <div className={"DarkDiv"} key={"tagListDiv"}>
                <Spin description={t("TagList.messages.loadingTip")} spinning={loading} key={"componentListSpinner"}>
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
