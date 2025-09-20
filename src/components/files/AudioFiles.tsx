import {Button, message, Modal, Popconfirm, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {audioFileAPI} from "../../services";
import type {AudioFileResponse} from "../../models/responses";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";

export function AudioFiles() {
    const [loading, setLoading] = useState(true);
    const [audioFiles, setAudioFiles] = useState<AudioFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<AudioFileResponse | null>(null);

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
        filenameColumn<AudioFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }),
        filePathColumn<AudioFileResponse>(),
        fileSizeColumn<AudioFileResponse>(),
        mimetypeColumn<AudioFileResponse>(),
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
        createdColumn<AudioFileResponse>(),
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
