import {Button, message, Modal, Popconfirm, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {vectorFileAPI} from "../../services";
import type {VectorFileResponse} from "../../models/responses";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";

export function VectorFiles() {
    const [loading, setLoading] = useState(true);
    const [vectorFiles, setVectorFiles] = useState<VectorFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<VectorFileResponse | null>(null);

    const fetchVectorFiles = async () => {
        setLoading(true);
        try {
            const response = await vectorFileAPI.findAll();
            setVectorFiles(response);
        } catch (err) {
            console.error("Failed to fetch vector files:", err);
            message.error("Failed to load vector files");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVectorFiles();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await vectorFileAPI.delete(id);
            message.success("Vector file deleted successfully");
            fetchVectorFiles();
        } catch (err) {
            console.error("Failed to delete vector file:", err);
            message.error("Failed to delete vector file");
        }
    };

    const columns: ColumnsType<VectorFileResponse> = [
        filenameColumn<VectorFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }),
        filePathColumn<VectorFileResponse>(),
        fileSizeColumn<VectorFileResponse>(),
        mimetypeColumn<VectorFileResponse>(),
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
            title: 'Layers Count',
            dataIndex: 'layers_count',
            key: 'layers_count',
        },
        createdColumn<VectorFileResponse>(),
        {
            title: 'Actions',
            key: 'actions',
            render: (_: undefined, record: VectorFileResponse) => (
                    <Popconfirm
                            title="Delete this vector file"
                            description="Are you sure you want to delete this vector file?"
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
                        dataSource={vectorFiles.map(file => ({...file, key: file.id}))}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                        }}
                        scroll={{x: 'max-content'}}
                        key="vector-files-table"
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
