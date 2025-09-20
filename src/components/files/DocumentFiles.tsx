import {Button, message, Modal, Popconfirm, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {documentFileAPI} from "../../services";
import type {DocumentFileResponse} from "../../models/responses";
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

    const fetchDocumentFiles = async () => {
        setLoading(true);
        try {
            const response = await documentFileAPI.findAll();
            setDocumentFiles(response);
        } catch (err) {
            console.error("Failed to fetch document files:", err);
            message.error(t("DocumentFiles.messages.fetchError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocumentFiles();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await documentFileAPI.delete(id);
            message.success(t("DocumentFiles.messages.deleteSuccess"));
            fetchDocumentFiles();
        } catch (err) {
            console.error("Failed to delete document file:", err);
            message.error(t("DocumentFiles.messages.deleteError"));
        }
    };

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

    return (
            <Space direction="vertical" style={{width: "100%", margin: 30}} size="large">
                <Table
                        columns={columns}
                        dataSource={documentFiles.map(file => ({...file, key: file.id}))}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                        }}
                        scroll={{x: 'max-content'}}
                        key="document-files-table"
                        rowKey="external_file_id"
                />
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
