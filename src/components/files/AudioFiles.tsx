import {Button, message, Popconfirm, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {audioFileAPI} from "../../services";
import type {AudioFileResponse} from "../../models/responses";
import type {ColumnsType} from "antd/es/table";

export function AudioFiles() {
    const [loading, setLoading] = useState(true);
    const [audioFiles, setAudioFiles] = useState<AudioFileResponse[]>([]);

    const fetchAudioFiles = async () => {
        setLoading(true);
        try {
            const response = await audioFileAPI.findAll();
            setAudioFiles(response);
        } catch (err) {
            console.error("Failed to fetch audio files:", err);
            message.error("Failed to load audio files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAudioFiles();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await audioFileAPI.delete(id);
            message.success("Audio file deleted successfully");
            fetchAudioFiles();
        } catch (err) {
            console.error("Failed to delete audio file:", err);
            message.error("Failed to delete audio file");
        }
    };

    const columns: ColumnsType<AudioFileResponse> = [
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
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
            render: (duration: number) => `${duration}s`,
        },
        {
            title: 'Bit Rate',
            dataIndex: 'bit_rate',
            key: 'bit_rate',
        },
        {
            title: 'Sample Rate',
            dataIndex: 'sample_rate',
            key: 'sample_rate',
        },
        {
            title: 'Codec',
            dataIndex: 'codec',
            key: 'codec',
        },
        {
            title: 'Channels',
            dataIndex: 'channels',
            key: 'channels',
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
            render: (_: undefined, record: AudioFileResponse) => (
                    <Popconfirm
                            title="Delete this audio file"
                            description="Are you sure you want to delete this audio file?"
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
                        dataSource={audioFiles.map(file => ({...file, key: file.id}))}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                        }}
                        scroll={{x: 'max-content'}}
                        key="audio-files-table"
                        rowKey="external_file_id"
                />
            </Space>
    );
}
