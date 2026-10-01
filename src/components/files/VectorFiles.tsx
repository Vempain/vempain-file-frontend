import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {vectorFileAPI} from "../../services";
import type {VectorFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function VectorFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<VectorFileResponse | null>(null);

    const paged = usePagedTable<VectorFileResponse>(
            request => vectorFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        vectorFileAPI.delete(id)
                .then(() => {
                    message.success(t("VectorFiles.messages.deleteSuccess"));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete vector file:", err);
                    message.error(t("VectorFiles.messages.deleteError"));
                })
    }

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
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                {paged.contextHolder}
                <Spin spinning={paged.loading}>
                    {paged.dataSource.length > 0 && <VempainTable
                            dataMode="server"
                            paged={paged}
                            columns={columns}
                            scroll={{x: 'max-content'}}
                            rowKey="external_file_id"
                    />
                    }{paged.dataSource.length === 0 && !paged.loading && t("VectorFiles.messages.noFiles")}
                </Spin>
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
