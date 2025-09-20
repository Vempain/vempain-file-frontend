import {Button, message, Modal, Popconfirm, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {archiveFileAPI} from "../../services";
import type {ArchiveFileResponse} from "../../models/responses";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";

export function ArchiveFiles() {
    const [loading, setLoading] = useState(true);
    const [archiveFiles, setArchiveFiles] = useState<ArchiveFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ArchiveFileResponse | null>(null);

    function fetchArchiveFiles() {
        setLoading(true);
        archiveFileAPI.findAll()
                .then(response => {
                    setArchiveFiles(response);
                })
                .catch(err => {
                    console.error("Failed to fetch archive files:", err);
                    message.error("Failed to load archive files");
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    useEffect(() => {
        fetchArchiveFiles();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await archiveFileAPI.delete(id);
            message.success("Archive file deleted successfully");
            fetchArchiveFiles();
        } catch (err) {
            console.error("Failed to delete archive file:", err);
            message.error("Failed to delete archive file");
        }
    };

    const columns: ColumnsType<ArchiveFileResponse> = [
        filenameColumn<ArchiveFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }),
        filePathColumn<ArchiveFileResponse>(),
        fileSizeColumn<ArchiveFileResponse>(),
        mimetypeColumn<ArchiveFileResponse>(),
        {
            title: 'Compression Method',
            dataIndex: 'compression_method',
            key: 'compression_method',
        },
        {
            title: 'Uncompressed Size',
            dataIndex: 'uncompressed_size',
            key: 'uncompressed_size',
            render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
        },
        {
            title: 'Content Count',
            dataIndex: 'content_count',
            key: 'content_count',
        },
        {
            title: 'Encrypted',
            dataIndex: 'is_encrypted',
            key: 'is_encrypted',
            render: (val: boolean) => val ? "Yes" : "No",
        },
        createdColumn<ArchiveFileResponse>(),
        {
            title: 'Actions',
            key: 'actions',
            render: (_: undefined, record: ArchiveFileResponse) => (
                    <Popconfirm
                            title="Delete this archive file"
                            description="Are you sure you want to delete this archive file?"
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
                        dataSource={archiveFiles.map(file => ({...file, key: file.id}))}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                        }}
                        scroll={{x: 'max-content'}}
                        key="archive-files-table"
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
                    <FileDetails file={selectedFile || undefined}/>
                </Modal>
            </Space>
    );
}
