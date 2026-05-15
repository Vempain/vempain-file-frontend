import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useCallback, useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {thumbFileAPI} from "../../services";
import type {ThumbFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function ThumbFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [thumbFiles, setThumbFiles] = useState<ThumbFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ThumbFileResponse | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    const fetchThumbFiles = useCallback((page: number, size: number) => {
        setLoading(true);
        const pagedRequest: PagedRequest = {
            page: page - 1,
            size,
        };

        thumbFileAPI.findAllPageable(pagedRequest)
                .then(response => {
                    if (response?.content) {
                        setThumbFiles(response.content);
                    }

                    setTotalElements(response.total_elements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch thumbnail files:", err);
                    message.error(t("ThumbFiles.messages.fetchError", {defaultValue: "Failed to load thumbnail files"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    useEffect(() => {
        fetchThumbFiles(1, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        thumbFileAPI.delete(id)
                .then(() => {
                    message.success(t("ThumbFiles.messages.deleteSuccess", {defaultValue: "Thumbnail file deleted successfully"}));
                    fetchThumbFiles(currentPage, pageSize);
                })
                .catch(err => {
                    console.error("Failed to delete thumbnail file:", err);
                    message.error(t("ThumbFiles.messages.deleteError", {defaultValue: "Failed to delete thumbnail file"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    const columns: ColumnsType<ThumbFileResponse> = [
        filenameColumn<ThumbFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<ThumbFileResponse>(t),
        fileSizeColumn<ThumbFileResponse>(t),
        mimetypeColumn<ThumbFileResponse>(t),
        {
            title: t("ThumbFiles.columns.relation_type.title", {defaultValue: "Relation type"}),
            dataIndex: "relation_type",
            key: "relation_type",
        },
        {
            title: t("ThumbFiles.columns.target_file_id.title", {defaultValue: "Target file ID"}),
            dataIndex: "target_file_id",
            key: "target_file_id",
        },
        createdColumn<ThumbFileResponse>(t),
        {
            title: t("ThumbFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: ThumbFileResponse) => (
                    <Popconfirm
                            title={t("ThumbFiles.popconfirm.delete.title", {defaultValue: "Delete this thumbnail file"})}
                            description={t("ThumbFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this thumbnail file?"})}
                            onConfirm={() => handleDelete(record.id)}
                            okText={t("Common.popconfirm.yes", {defaultValue: "Yes"})}
                            cancelText={t("Common.popconfirm.no", {defaultValue: "No"})}
                    >
                        <Button danger icon={<DeleteOutlined/>}/>
                    </Popconfirm>
            ),
        },
    ];

    function handleTableChange(pagination: { current?: number; pageSize?: number }) {
        const nextPage = pagination.current ?? 1;
        const nextSize = pagination.pageSize ?? pageSize;
        setCurrentPage(nextPage);
        setPageSize(nextSize);
        fetchThumbFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {thumbFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={thumbFiles.map(file => ({...file, key: file.id}))}
                            loading={loading}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: totalElements,
                                showSizeChanger: true,
                                pageSizeOptions: ["10", "20", "50", "100"],
                            }}
                            onChange={handleTableChange}
                            scroll={{x: "max-content"}}
                            key="thumb-files-table"
                            rowKey="external_file_id"
                    />
                    }{thumbFiles.length === 0 && !loading && t("ThumbFiles.messages.noFiles", {defaultValue: "No thumbnail files found"})}
                </Spin>
                <Modal
                        open={detailsOpen}
                        onCancel={() => setDetailsOpen(false)}
                        afterClose={() => setSelectedFile(null)}
                        footer={null}
                        destroyOnHidden
                        maskClosable
                        title={selectedFile?.filename || t("Common.modal.fileDetailsTitle", {defaultValue: "File details"})}
                        width={720}
                >
                    {selectedFile != null && <FileDetails file={selectedFile}/>}
                </Modal>
            </Space>
    );
}

