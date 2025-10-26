import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {documentFileAPI} from "../../services";
import type {DocumentFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function DocumentFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [documentFiles, setDocumentFiles] = useState<DocumentFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<DocumentFileResponse | null>(null);
    // Add paging state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    function fetchDocumentFiles(page: number = currentPage, size: number = pageSize) {
        setLoading(true);
        documentFileAPI.findAllPageable(page - 1, size)
                .then(response => {
                    if (response && response.content) {
                        setDocumentFiles(response.content);
                    }

                    setTotalElements(response.totalElements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch archive files:", err);
                    message.error(t("DocumentFiles.messages.fetchError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    useEffect(() => {
        fetchDocumentFiles();
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        documentFileAPI.delete(id)
                .then(_ => {
                    message.success(t("DocumentFiles.messages.deleteSuccess"));
                    fetchDocumentFiles();
                })
                .catch(err => {
                    console.error("Failed to delete document file:", err);
                    message.error(t("DocumentFiles.messages.deleteError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    const columns: ColumnsType<DocumentFileResponse> = [
        filenameColumn<DocumentFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<DocumentFileResponse>(t),
        fileSizeColumn<DocumentFileResponse>(t),
        mimetypeColumn<DocumentFileResponse>(t),
        {
            title: t("DocumentFiles.columns.page_count.title"),
            dataIndex: 'page_count',
            key: 'page_count',
        },
        {
            title: t("DocumentFiles.columns.format.title"),
            dataIndex: 'format',
            key: 'format',
        },
        createdColumn<DocumentFileResponse>(t),
        {
            title: t("DocumentFiles.columns.actions.title"),
            key: 'actions',
            render: (_: undefined, record: DocumentFileResponse) => (
                    <Popconfirm
                            title={t("DocumentFiles.popconfirm.delete.title")}
                            description={t("DocumentFiles.popconfirm.delete.description")}
                            onConfirm={() => handleDelete(record.id)}
                            okText={t("Common.popconfirm.yes")}
                            cancelText={t("Common.popconfirm.no")}
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
        fetchDocumentFiles(nextPage, nextSize);
    }

    return (
            <Space direction="vertical" style={{width: "100%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {documentFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={documentFiles.map(file => ({...file, key: file.id}))}
                            loading={loading}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: totalElements,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50', '100'],
                            }}
                            onChange={handleTableChange}
                            scroll={{x: 'max-content'}}
                            key="document-files-table"
                            rowKey="external_file_id"
                    />
                    }{documentFiles.length === 0 && !loading && t("DocumentFiles.messages.noFiles")}
                </Spin>
                <Modal
                        open={detailsOpen}
                        onCancel={() => setDetailsOpen(false)}
                        afterClose={() => setSelectedFile(null)}
                        footer={null}
                        destroyOnHidden
                        maskClosable
                        title={selectedFile?.filename || t("Common.modal.fileDetailsTitle")}
                        width={720}
                >
                    {selectedFile != null && <FileDetails file={selectedFile}/>}
                </Modal>
            </Space>
    );
}
