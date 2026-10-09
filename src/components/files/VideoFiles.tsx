import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {videoFileAPI} from "../../services";
import type {VideoFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {PublishFileButton} from "./PublishFileButton";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function VideoFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<VideoFileResponse | null>(null);

    const paged = usePagedTable<VideoFileResponse>(
            request => videoFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        videoFileAPI.delete(id)
                .then(() => {
                    message.success(t("VideoFiles.messages.deleteSuccess"));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete video file:", err);
                    message.error(t("VideoFiles.messages.deleteError"));
                })
    }

    const columns: ColumnsType<VideoFileResponse> = [
        filenameColumn<VideoFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<VideoFileResponse>(t),
        fileSizeColumn<VideoFileResponse>(t),
        mimetypeColumn<VideoFileResponse>(t),
        {
            title: t("VideoFiles.columns.width.title"),
            dataIndex: 'width',
            key: 'width',
            sorter: (a, b) => a.width - b.width,
        },
        {
            title: t("VideoFiles.columns.height.title"),
            dataIndex: 'height',
            key: 'height',
            sorter: (a, b) => a.height - b.height,
        },
        {
            title: t("VideoFiles.columns.frame_rate.title"),
            dataIndex: 'frame_rate',
            key: 'frame_rate',
        },
        {
            title: t("VideoFiles.columns.duration.title"),
            dataIndex: 'duration',
            key: 'duration',
            render: (duration: number) => `${duration}s`,
        },
        {
            title: t("VideoFiles.columns.codec.title"),
            dataIndex: 'codec',
            key: 'codec',
        },
        createdColumn<VideoFileResponse>(t),
        {
            title: t("VideoFiles.columns.actions.title"),
            key: 'actions',
            render: (_: undefined, record: VideoFileResponse) => (
                    <Space>
                        <PublishFileButton file={record} onPublished={() => paged.reload()}/>
                        <Popconfirm
                                title={t("VideoFiles.popconfirm.delete.title")}
                                description={t("VideoFiles.popconfirm.delete.description")}
                                onConfirm={() => handleDelete(record.id)}
                                okText={t("Common.popconfirm.yes")}
                                cancelText={t("Common.popconfirm.no")}
                        >
                            <Button danger icon={<DeleteOutlined/>}/>
                        </Popconfirm>
                    </Space>
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
                    }{paged.dataSource.length === 0 && !paged.loading && t("VideoFiles.messages.noFiles")}
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
