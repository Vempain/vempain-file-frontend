import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {imageFileAPI} from "../../services";
import type {ImageFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn, thumbnailColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function ImageFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<ImageFileResponse | null>(null);

    const paged = usePagedTable<ImageFileResponse>(
            request => imageFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        imageFileAPI.delete(id)
                .then(() => {
                    message.success(t("ImageFiles.messages.deleteSuccess"));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete image file:", err);
                    message.error(t("ImageFiles.messages.deleteError"));
                })
    }

    const columns: ColumnsType<ImageFileResponse> = [
        filenameColumn<ImageFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        thumbnailColumn<ImageFileResponse>(t),
        filePathColumn<ImageFileResponse>(t),
        fileSizeColumn<ImageFileResponse>(t),
        mimetypeColumn<ImageFileResponse>(t),
        {
            title: t("ImageFiles.columns.width.title"),
            dataIndex: 'width',
            key: 'width',
            sorter: (a: ImageFileResponse, b: ImageFileResponse) => a.width - b.width,
        },
        {
            title: t("ImageFiles.columns.height.title"),
            dataIndex: 'height',
            key: 'height',
            sorter: (a: ImageFileResponse, b: ImageFileResponse) => a.height - b.height,
        },
        {
            title: t("ImageFiles.columns.dpi.title"),
            dataIndex: 'dpi',
            key: 'dpi',
        },
        {
            title: t("ImageFiles.columns.color_depth.title"),
            dataIndex: 'color_depth',
            key: 'color_depth',
        },
        {
            title: t("ImageFiles.columns.group_label.title"),
            dataIndex: 'group_label',
            key: 'group_label',
        },
        createdColumn<ImageFileResponse>(t),
        {
            title: t("ImageFiles.columns.actions.title"),
            key: 'actions',
            render: (_: undefined, record: ImageFileResponse) => (
                    <Popconfirm
                            title={t("ImageFiles.popconfirm.delete.title")}
                            description={t("ImageFiles.popconfirm.delete.description")}
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
                    }{paged.dataSource.length === 0 && !paged.loading && t("ImageFiles.messages.noFiles")}
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