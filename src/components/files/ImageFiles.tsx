import {Button, message, Modal, Popconfirm, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {imageFileAPI} from "../../services";
import type {ImageFileResponse} from "../../models/responses";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";

export function ImageFiles() {
    const [loading, setLoading] = useState(true);
    const [imageFiles, setImageFiles] = useState<ImageFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ImageFileResponse | null>(null);

    const fetchImageFiles = async () => {
        setLoading(true);
        try {
            const response = await imageFileAPI.findAll();
            setImageFiles(response);
        } catch (err) {
            console.error("Failed to fetch image files:", err);
            message.error("Failed to load image files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImageFiles();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await imageFileAPI.delete(id);
            message.success("Image file deleted successfully");
            // Refresh the list after deletion
            fetchImageFiles();
        } catch (err) {
            console.error("Failed to delete image file:", err);
            message.error("Failed to delete image file");
        }
    };

    const columns: ColumnsType<ImageFileResponse> = [
        filenameColumn<ImageFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }),
        filePathColumn<ImageFileResponse>(),
        fileSizeColumn<ImageFileResponse>(),
        mimetypeColumn<ImageFileResponse>(),
        {
            title: 'Width',
            dataIndex: 'width',
            key: 'width',
            sorter: (a: ImageFileResponse, b: ImageFileResponse) => a.width - b.width,
        },
        {
            title: 'Height',
            dataIndex: 'height',
            key: 'height',
            sorter: (a: ImageFileResponse, b: ImageFileResponse) => a.height - b.height,
        },
        {
            title: 'DPI',
            dataIndex: 'dpi',
            key: 'dpi',
        },
        {
            title: 'Color Depth',
            dataIndex: 'color_depth',
            key: 'color_depth',
        },
        {
            title: 'Group label',
            dataIndex: 'group_label',
            key: 'group_label',
        },
        createdColumn<ImageFileResponse>(),
        {
            title: 'Actions',
            key: 'actions',
            render: (_: undefined, record: ImageFileResponse) => (
                    <Popconfirm
                            title="Delete this image file"
                            description="Are you sure you want to delete this image file?"
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
                        dataSource={imageFiles.map(file => ({...file, key: file.id}))}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                        }}
                        scroll={{x: 'max-content'}}
                        key="image-files-table"
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