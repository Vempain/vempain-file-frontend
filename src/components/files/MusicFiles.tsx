import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useCallback, useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {musicFileAPI} from "../../services";
import type {MusicFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function MusicFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [musicFiles, setMusicFiles] = useState<MusicFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<MusicFileResponse | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    const fetchMusicFiles = useCallback((page: number, size: number) => {
        setLoading(true);
        const pagedRequest: PagedRequest = {
            page: page - 1,
            size,
        };

        musicFileAPI.findAllPageable(pagedRequest)
                .then(response => {
                    if (response?.content) {
                        setMusicFiles(response.content);
                    }

                    setTotalElements(response.total_elements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch music files:", err);
                    message.error(t("MusicFiles.messages.fetchError", {defaultValue: "Failed to load music files"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    useEffect(() => {
        fetchMusicFiles(1, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        musicFileAPI.delete(id)
                .then(() => {
                    message.success(t("MusicFiles.messages.deleteSuccess", {defaultValue: "Music file deleted successfully"}));
                    fetchMusicFiles(currentPage, pageSize);
                })
                .catch(err => {
                    console.error("Failed to delete music file:", err);
                    message.error(t("MusicFiles.messages.deleteError", {defaultValue: "Failed to delete music file"}));
                })
                .finally(() => {
                    setLoading(false);
                });
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
                    <Popconfirm
                            title={t("MusicFiles.popconfirm.delete.title", {defaultValue: "Delete this music file"})}
                            description={t("MusicFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this music file?"})}
                            onConfirm={() => handleDelete(record.id)}
                            okText={t("Common.popconfirm.yes", {defaultValue: "Yes"})}
                            cancelText={t("Common.popconfirm.no", {defaultValue: "No"})}
                    >
                        <Button danger icon={<DeleteOutlined/>}/>
                    </Popconfirm>
            ),
        },
    ];

    function handleTableChange(pagination: { current?: number; pageSize?: number }) {
        const nextPage = pagination.current ?? 1;
        const nextSize = pagination.pageSize ?? pageSize;
        setCurrentPage(nextPage);
        setPageSize(nextSize);
        fetchMusicFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {musicFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={musicFiles.map(file => ({...file, key: file.id}))}
                            loading={loading}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: totalElements,
                                showSizeChanger: true,
                                pageSizeOptions: ["10", "20", "50", "100"],
                            }}
                            onChange={handleTableChange}
                            scroll={{x: "max-content"}}
                            key="music-files-table"
                            rowKey="external_file_id"
                    />
                    }{musicFiles.length === 0 && !loading && t("MusicFiles.messages.noFiles", {defaultValue: "No music files found"})}
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

