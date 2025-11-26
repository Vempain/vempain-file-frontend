import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {archiveFileAPI} from "../../services";
import type {ArchiveFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function ArchiveFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [archiveFiles, setArchiveFiles] = useState<ArchiveFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ArchiveFileResponse | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    function fetchArchiveFiles(page: number = currentPage, size: number = pageSize) {
        setLoading(true);
        archiveFileAPI.findAllPageable(page - 1, size)
                .then(response => {
                    if (response && response.content) {
                        setArchiveFiles(response.content);
                    }

                    setTotalElements(response.totalElements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch archive files:", err);
                    message.error(t("ArchiveFiles.messages.fetchError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    useEffect(() => {
        fetchArchiveFiles(1, pageSize);
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        archiveFileAPI.delete(id)
                .then(_ => {
                    message.success(t("ArchiveFiles.messages.deleteSuccess"));
                    fetchArchiveFiles();
                })
                .catch(err => {
                    console.error("Failed to delete archive file:", err);
                    message.error(t("ArchiveFiles.messages.deleteError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    const columns: ColumnsType<ArchiveFileResponse> = [
        filenameColumn<ArchiveFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<ArchiveFileResponse>(t),
        fileSizeColumn<ArchiveFileResponse>(t),
        mimetypeColumn<ArchiveFileResponse>(t),
        {
            title: t("ArchiveFiles.columns.compression_method.title"),
            dataIndex: 'compression_method',
            key: 'compression_method',
        },
        {
            title: t("ArchiveFiles.columns.uncompressed_size.title"),
            dataIndex: 'uncompressed_size',
            key: 'uncompressed_size',
            render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
        },
        {
            title: t("ArchiveFiles.columns.content_count.title"),
            dataIndex: 'content_count',
            key: 'content_count',
        },
        {
            title: t("ArchiveFiles.columns.is_encrypted.title"),
            dataIndex: 'is_encrypted',
            key: 'is_encrypted',
            render: (val: boolean) => val ? t("Common.general.yes") : t("Common.general.no"),
        },
        createdColumn<ArchiveFileResponse>(t),
        {
            title: t("ArchiveFiles.columns.actions.title"),
            key: 'actions',
            render: (_: undefined, record: ArchiveFileResponse) => (
                    <Popconfirm
                            title={t("ArchiveFiles.popconfirm.delete.title")}
                            description={t("ArchiveFiles.popconfirm.delete.description")}
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
        fetchArchiveFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "100%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {archiveFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={archiveFiles.map(file => ({...file, key: file.id}))}
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
                            key="archive-files-table"
                            rowKey="external_file_id"
                    />
                    }{archiveFiles.length === 0 && !loading && t("ArchiveFiles.messages.noFiles")}
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
