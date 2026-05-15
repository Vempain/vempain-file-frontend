import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useCallback, useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {interactiveFileAPI} from "../../services";
import type {InteractiveFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function InteractiveFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [interactiveFiles, setInteractiveFiles] = useState<InteractiveFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<InteractiveFileResponse | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    const fetchInteractiveFiles = useCallback((page: number, size: number) => {
        setLoading(true);
        const pagedRequest: PagedRequest = {
            page: page - 1,
            size,
        };

        interactiveFileAPI.findAllPageable(pagedRequest)
                .then(response => {
                    if (response?.content) {
                        setInteractiveFiles(response.content);
                    }

                    setTotalElements(response.total_elements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch interactive files:", err);
                    message.error(t("InteractiveFiles.messages.fetchError", {defaultValue: "Failed to load interactive files"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    useEffect(() => {
        fetchInteractiveFiles(1, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        interactiveFileAPI.delete(id)
                .then(() => {
                    message.success(t("InteractiveFiles.messages.deleteSuccess", {defaultValue: "Interactive file deleted successfully"}));
                    fetchInteractiveFiles(currentPage, pageSize);
                })
                .catch(err => {
                    console.error("Failed to delete interactive file:", err);
                    message.error(t("InteractiveFiles.messages.deleteError", {defaultValue: "Failed to delete interactive file"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    const columns: ColumnsType<InteractiveFileResponse> = [
        filenameColumn<InteractiveFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<InteractiveFileResponse>(t),
        fileSizeColumn<InteractiveFileResponse>(t),
        mimetypeColumn<InteractiveFileResponse>(t),
        {
            title: t("InteractiveFiles.columns.technology.title", {defaultValue: "Technology"}),
            dataIndex: "technology",
            key: "technology",
        },
        createdColumn<InteractiveFileResponse>(t),
        {
            title: t("InteractiveFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: InteractiveFileResponse) => (
                    <Popconfirm
                            title={t("InteractiveFiles.popconfirm.delete.title", {defaultValue: "Delete this interactive file"})}
                            description={t("InteractiveFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this interactive file?"})}
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
        fetchInteractiveFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {interactiveFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={interactiveFiles.map(file => ({...file, key: file.id}))}
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
                            key="interactive-files-table"
                            rowKey="external_file_id"
                    />
                    }{interactiveFiles.length === 0 && !loading && t("InteractiveFiles.messages.noFiles", {defaultValue: "No interactive files found"})}
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

