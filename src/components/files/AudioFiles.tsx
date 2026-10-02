import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {audioFileAPI} from "../../services";
import type {AudioFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function AudioFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<AudioFileResponse | null>(null);

    const paged = usePagedTable<AudioFileResponse>(
            request => audioFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        audioFileAPI.delete(id)
                .then(() => {
                    message.success(t("AudioFiles.messages.deleteSuccess"));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete audio file:", err);
                    message.error(t("AudioFiles.messages.deleteError"));
                })
    }

    const columns: ColumnsType<AudioFileResponse> = [
        filenameColumn<AudioFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<AudioFileResponse>(t),
        fileSizeColumn<AudioFileResponse>(t),
        mimetypeColumn<AudioFileResponse>(t),
        {
            title: t("AudioFiles.columns.duration.title"),
            dataIndex: 'duration',
            key: 'duration',
            render: (duration: number) => `${duration}s`,
        },
        {
            title: t("AudioFiles.columns.bit_rate.title"),
            dataIndex: 'bit_rate',
            key: 'bit_rate',
        },
        {
            title: t("AudioFiles.columns.sample_rate.title"),
            dataIndex: 'sample_rate',
            key: 'sample_rate',
        },
        {
            title: t("AudioFiles.columns.codec.title"),
            dataIndex: 'codec',
            key: 'codec',
        },
        {
            title: t("AudioFiles.columns.channels.title"),
            dataIndex: 'channels',
            key: 'channels',
        },
        createdColumn<AudioFileResponse>(t),
        {
            title: t("AudioFiles.columns.actions.title"),
            key: 'actions',
            render: (_: undefined, record: AudioFileResponse) => (
                    <Popconfirm
                            title={t("AudioFiles.popconfirm.delete.title")}
                            description={t("AudioFiles.popconfirm.delete.description")}
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
                    }{paged.dataSource.length === 0 && !paged.loading && t("AudioFiles.messages.noFiles")}
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
