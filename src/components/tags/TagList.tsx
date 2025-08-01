import {Button, Input, message, Space, Spin, Table} from "antd";
import {useEffect, useState} from "react";
import {tagsAPI} from "../../services";
import type {TagResponse} from "../../models/responses";
import {getPaginationConfig} from "../../tools/tablePaginationConfig.ts";
import type {TagRequest} from "../../models/requests";

export function TagList() {
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
                    message.error("Error fetching tags " + (error instanceof Error ? error.message : "Unknown error"));
                })
                .finally(() => setLoading(false));
    }, []);

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
            message.error("No changes to save");
            setLoading(false);
            return;
        }

        if (!editedRow.tag_name) {
            message.error("Tag name is required");
            setLoading(false);
            return;
        }

        // Create a request object with the necessary fields
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
                        message.success("Tag updated successfully");
                        setTags(tags =>
                                tags.map(tag => tag.id === id ? {...tag, ...editedRow} : tag)
                        );
                    })
                    .catch((error: unknown) => {
                        message.error("Failed to update tag: " + error);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            message.success("Tag updated");
        } catch {
            message.error("Failed to update tag");
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
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: (a: TagResponse, b: TagResponse) => a.id - b.id,
        },
        {
            title: "Tag Name",
            dataIndex: "tag_name",
            key: "tag_name",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name.localeCompare(b.tag_name),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name", record),
        },
        {
            title: "Tag Name (De)",
            dataIndex: "tag_name_de",
            key: "tag_name_de",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_de.localeCompare(b.tag_name_de),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_de", record),
        },
        {
            title: "Tag Name (En)",
            dataIndex: "tag_name_en",
            key: "tag_name_en",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_en.localeCompare(b.tag_name_en),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_en", record),
        },
        {
            title: "Tag Name (Es)",
            dataIndex: "tag_name_es",
            key: "tag_name_es",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_es.localeCompare(b.tag_name_es),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_es", record),
        },
        {
            title: "Tag Name (Fi)",
            dataIndex: "tag_name_fi",
            key: "tag_name_fi",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_fi.localeCompare(b.tag_name_fi),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_fi", record),
        },
        {
            title: "Tag Name (Sv)",
            dataIndex: "tag_name_sv",
            key: "tag_name_sv",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_sv.localeCompare(b.tag_name_sv),
            render: (_: undefined, record: TagResponse) => editableCell("tag_name_sv", record),
        },
        {
            title: "Actions",
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
                                    Save
                                </Button>
                                <Button onClick={cancelEdit}>Cancel</Button>
                            </Space>
                    );
                }
                return (
                        <Space>
                            <a href={`/tags/${record.id}`}>View tagged files</a>
                            <Button onClick={() => startEdit(record)} size="small">
                                Edit
                            </Button>
                        </Space>
                );
            }
        }
    ];

    return (
            <div className={"DarkDiv"} key={"tagListDiv"}>
                <Spin tip={"Loading"} spinning={loading} key={"componentListSpinner"}>
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
