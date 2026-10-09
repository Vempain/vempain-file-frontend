import {Button, message, Modal, Popconfirm, Space, Spin} from "antd";
import {useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {musicFileAPI} from "../../services";
import type {MusicFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {PublishFileButton} from "./PublishFileButton";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function MusicFiles() {
    const {t} = useTranslation();
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<MusicFileResponse | null>(null);

    const paged = usePagedTable<MusicFileResponse>(
            request => musicFileAPI.findAllPageable(request),
            {defaultPageSize: 10}
    );

    function handleDelete(id: number) {
        musicFileAPI.delete(id)
                .then(() => {
                    message.success(t("MusicFiles.messages.deleteSuccess", {defaultValue: "Music file deleted successfully"}));
                    paged.reload();
                })
                .catch(err => {
                    console.error("Failed to delete music file:", err);
                    message.error(t("MusicFiles.messages.deleteError", {defaultValue: "Failed to delete music file"}));
                })
    }

    const columns: ColumnsType<MusicFileResponse> = [
        filenameColumn<MusicFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<MusicFileResponse>(t),
        fileSizeColumn<MusicFileResponse>(t),
        mimetypeColumn<MusicFileResponse>(t),
        {
            title: t("MusicFiles.columns.duration.title", {defaultValue: "Duration"}),
            dataIndex: "duration",
            key: "duration",
            render: (duration: number) => `${duration}s`,
        },
        {
            title: t("MusicFiles.columns.bit_rate.title", {defaultValue: "Bit rate"}),
            dataIndex: "bit_rate",
            key: "bit_rate",
        },
        {
            title: t("MusicFiles.columns.codec.title", {defaultValue: "Codec"}),
            dataIndex: "codec",
            key: "codec",
        },
        {
            title: t("MusicFiles.columns.artist.title", {defaultValue: "Artist"}),
            dataIndex: "artist",
            key: "artist",
        },
        {
            title: t("MusicFiles.columns.album.title", {defaultValue: "Album"}),
            dataIndex: "album",
            key: "album",
        },
        {
            title: t("MusicFiles.columns.track_name.title", {defaultValue: "Track"}),
            dataIndex: "track_name",
            key: "track_name",
        },
        {
            title: t("MusicFiles.columns.genre.title", {defaultValue: "Genre"}),
            dataIndex: "genre",
            key: "genre",
        },
        createdColumn<MusicFileResponse>(t),
        {
            title: t("MusicFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: MusicFileResponse) => (
                    <Space>
                        <PublishFileButton file={record} onPublished={() => paged.reload()}/>
                        <Popconfirm
                                title={t("MusicFiles.popconfirm.delete.title", {defaultValue: "Delete this music file"})}
                                description={t("MusicFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this music file?"})}
                                onConfirm={() => handleDelete(record.id)}
                                okText={t("Common.popconfirm.yes", {defaultValue: "Yes"})}
                                cancelText={t("Common.popconfirm.no", {defaultValue: "No"})}
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
                            scroll={{x: "max-content"}}
                            rowKey="external_file_id"
                    />
                    }{paged.dataSource.length === 0 && !paged.loading && t("MusicFiles.messages.noFiles", {defaultValue: "No music files found"})}
                </Spin>
                <Modal
                        open={detailsOpen}
                        onCancel={() => setDetailsOpen(false)}
                        afterClose={() => setSelectedFile(null)}
                        footer={null}
                        destroyOnHidden
                        maskClosable
                        title={selectedFile?.filename || t("Common.modal.fileDetailsTitle", {defaultValue: "File details"})}
                        width={720}
                >
                    {selectedFile != null && <FileDetails file={selectedFile}/>}
                </Modal>
            </Space>
    );
}

