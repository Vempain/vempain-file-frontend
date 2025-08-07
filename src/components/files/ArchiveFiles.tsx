import {Button, message, Popconfirm, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {archiveFileAPI} from "../../services";
import type {ArchiveFileResponse} from "../../models/responses";
import type {ColumnsType} from "antd/es/table";

export function ArchiveFiles() {
    const [loading, setLoading] = useState(true);
    const [archiveFiles, setArchiveFiles] = useState<ArchiveFileResponse[]>([]);

    const fetchArchiveFiles = async () => {
        setLoading(true);
        try {
            const response = await archiveFileAPI.findAll();
            setArchiveFiles(response);
        } catch (err) {
            console.error("Failed to fetch archive files:", err);
            message.error("Failed to load archive files");
        } finally {
            setLoading(false);
        }
    };

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
        {
            title: 'Filename',
            dataIndex: 'filename',
            key: 'filename',
            sorter: (a, b) => a.filename.localeCompare(b.filename),
        },
        {
            title: 'File path',
            dataIndex: 'file_path',
            key: 'file_path',
            sorter: (a, b) => a.file_path.localeCompare(b.file_path),
        },
        {
            title: 'File Size',
            dataIndex: 'filesize',
            key: 'filesize',
            sorter: (a, b) => a.filesize - b.filesize,
            render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
        },
        {
            title: 'MIME Type',
            dataIndex: 'mimetype',
            key: 'mimetype',
        },
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
        {
            title: 'Created',
            dataIndex: 'created',
            key: 'created',
            render: (date: string) => new Date(date).toLocaleString(),
            sorter: (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
        },
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
            </Space>
    );
}
