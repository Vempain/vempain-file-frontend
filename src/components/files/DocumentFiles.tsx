import {Button, message, Modal, Popconfirm, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {documentFileAPI} from "../../services";
import type {DocumentFileResponse} from "../../models/responses";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";

export function DocumentFiles() {
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
            message.error("Failed to load document files");
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
            message.success("Document file deleted successfully");
            fetchDocumentFiles();
        } catch (err) {
            console.error("Failed to delete document file:", err);
            message.error("Failed to delete document file");
        }
    };

    const columns: ColumnsType<DocumentFileResponse> = [
        filenameColumn<DocumentFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }),
        filePathColumn<DocumentFileResponse>(),
        fileSizeColumn<DocumentFileResponse>(),
        mimetypeColumn<DocumentFileResponse>(),
        {
            title: 'Page Count',
            dataIndex: 'page_count',
            key: 'page_count',
        },
        {
            title: 'Format',
            dataIndex: 'format',
            key: 'format',
        },
        createdColumn<DocumentFileResponse>(),
        {
            title: 'Actions',
            key: 'actions',
            render: (_: undefined, record: DocumentFileResponse) => (
                    <Popconfirm
                            title="Delete this document file"
                            description="Are you sure you want to delete this document file?"
                            onConfirm={() => handleDelete(record.id)}
                            okText="Yes"
                            cancelText="No"
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
                        title={selectedFile?.filename || "File details"}
                        width={720}
                >
                    {selectedFile != null && <FileDetails file={selectedFile}/>}
                </Modal>
            </Space>
    );
}
