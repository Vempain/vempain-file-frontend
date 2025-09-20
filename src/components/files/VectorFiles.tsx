import {Button, message, Modal, Popconfirm, Space, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {vectorFileAPI} from "../../services";
import type {VectorFileResponse} from "../../models/responses";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function VectorFiles() {
    const {t} = useTranslation();
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
            message.error(t("VectorFiles.messages.fetchError"));
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
            message.success(t("VectorFiles.messages.deleteSuccess"));
            fetchVectorFiles();
        } catch (err) {
            console.error("Failed to delete vector file:", err);
            message.error(t("VectorFiles.messages.deleteError"));
        }
    };

    const columns: ColumnsType<VectorFileResponse> = [
        filenameColumn<VectorFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<VectorFileResponse>(t),
        fileSizeColumn<VectorFileResponse>(t),
        mimetypeColumn<VectorFileResponse>(t),
        {
            title: t("VectorFiles.columns.width.title"),
            dataIndex: 'width',
            key: 'width',
            sorter: (a, b) => a.width - b.width,
        },
        {
            title: t("VectorFiles.columns.height.title"),
            dataIndex: 'height',
            key: 'height',
            sorter: (a, b) => a.height - b.height,
        },
        {
            title: t("VectorFiles.columns.layers_count.title"),
            dataIndex: 'layers_count',
            key: 'layers_count',
        },
        createdColumn<VectorFileResponse>(t),
        {
            title: t("VectorFiles.columns.actions.title"),
            key: 'actions',
            render: (_: undefined, record: VectorFileResponse) => (
                    <Popconfirm
                            title={t("VectorFiles.popconfirm.delete.title")}
                            description={t("VectorFiles.popconfirm.delete.description")}
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
                        title={selectedFile?.filename || t("Common.modal.fileDetailsTitle")}
                        width={720}
                >
                    {selectedFile != null && <FileDetails file={selectedFile}/>}
                </Modal>
            </Space>
    );
}
