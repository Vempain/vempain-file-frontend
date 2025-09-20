import {Button, message, Modal, Popconfirm, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {videoFileAPI} from "../../services";
import type {VideoFileResponse} from "../../models/responses";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";

export function VideoFiles() {
    const [loading, setLoading] = useState(true);
    const [videoFiles, setVideoFiles] = useState<VideoFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<VideoFileResponse | null>(null);

    const fetchVideoFiles = async () => {
        setLoading(true);
        try {
            const response = await videoFileAPI.findAll();
            setVideoFiles(response);
        } catch (err) {
            console.error("Failed to fetch video files:", err);
            message.error("Failed to load video files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideoFiles();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await videoFileAPI.delete(id);
            message.success("Video file deleted successfully");
            fetchVideoFiles();
        } catch (err) {
            console.error("Failed to delete video file:", err);
            message.error("Failed to delete video file");
        }
    };

    const columns: ColumnsType<VideoFileResponse> = [
        filenameColumn<VideoFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }),
        filePathColumn<VideoFileResponse>(),
        fileSizeColumn<VideoFileResponse>(),
        mimetypeColumn<VideoFileResponse>(),
        {
            title: 'Width',
            dataIndex: 'width',
            key: 'width',
            sorter: (a, b) => a.width - b.width,
        },
        {
            title: 'Height',
            dataIndex: 'height',
            key: 'height',
            sorter: (a, b) => a.height - b.height,
        },
        {
            title: 'Frame Rate',
            dataIndex: 'frame_rate',
            key: 'frame_rate',
        },
        {
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
            render: (duration: number) => `${duration}s`,
        },
        {
            title: 'Codec',
            dataIndex: 'codec',
            key: 'codec',
        },
        createdColumn<VideoFileResponse>(),
        {
            title: 'Actions',
            key: 'actions',
            render: (_: undefined, record: VideoFileResponse) => (
                    <Popconfirm
                            title="Delete this video file"
                            description="Are you sure you want to delete this video file?"
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
                        dataSource={videoFiles.map(file => ({...file, key: file.id}))}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                        }}
                        scroll={{x: 'max-content'}}
                        key="video-files-table"
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
