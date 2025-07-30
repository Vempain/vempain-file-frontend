import {Spin, Table, type TablePaginationConfig} from "antd";
import {useEffect, useState} from "react";
import {tagsAPI} from "../../services";
import type {TagResponse} from "../../models/responses";
import {getPaginationConfig} from "../../tools/tablePaginationConfig.ts";

export function TagList() {
    const [tags, setTags] = useState<TagResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<TablePaginationConfig>({});

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
            render: (text: string) => <span style={{fontWeight: "bold"}}>{text}</span>
        },
        {
            title: "Tag Name (De)",
            dataIndex: "tag_name_de",
            key: "tag_name_de",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_de.localeCompare(b.tag_name_de),
            render: (text: string) => text || <span style={{color: "gray"}}>-</span>
        },
        {
            title: "Tag Name (En)",
            dataIndex: "tag_name_en",
            key: "tag_name_en",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_en.localeCompare(b.tag_name_en),
            render: (text: string) => text || <span style={{color: "gray"}}>-</span>
        },
        {
            title: "Tag Name (Es)",
            dataIndex: "tag_name_es",
            key: "tag_name_es",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_es.localeCompare(b.tag_name_es),
            render: (text: string) => text || <span style={{color: "gray"}}>-</span>
        },
        {
            title: "Tag Name (Fi)",
            dataIndex: "tag_name_fi",
            key: "tag_name_fi",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_fi.localeCompare(b.tag_name_fi),
            render: (text: string) => text || <span style={{color: "gray"}}>-</span>
        },
        {
            title: "Tag Name (Sv)",
            dataIndex: "tag_name_sv",
            key: "tag_name_sv",
            sorter: (a: TagResponse, b: TagResponse) => a.tag_name_sv.localeCompare(b.tag_name_sv),
            render: (text: string) => text || <span style={{color: "gray"}}>-</span>
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: string, record: TagResponse) => (
                    <span>
                    {/* Add action buttons here if needed */}
                        <a href={`/tags/${record.id}`}>View tagged files</a>
                </span>
            )
        }
    ];

    useEffect(() => {
        setLoading(true);

        tagsAPI.findAll()
                .then((response: TagResponse[]) => {
                    setTags(response);
                    setPagination(getPaginationConfig(response.length));
                    console.log("Fetched tags:", response);
                })
                .catch((error: unknown) => {
                    console.error("Error fetching tags:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
    }, []);

    return (
            <div className={"darkBody"} key={"tagListDiv"}>
                <Spin tip={"Loading"} spinning={loading} key={"componentListSpinner"}>
                    {!loading &&
                            <Table dataSource={tags}
                                   loading={loading}
                                   rowKey="id"
                                   pagination={pagination}
                                   columns={tagColumns}
                            />}
                </Spin>
            </div>
    );
}