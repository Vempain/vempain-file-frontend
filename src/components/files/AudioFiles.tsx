import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {audioFileAPI} from "../../services";
import type {AudioFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function AudioFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [audioFiles, setAudioFiles] = useState<AudioFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<AudioFileResponse | null>(null);
    // Add paging state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    function fetchAudioFiles(page: number = currentPage, size: number = pageSize) {
        setLoading(true);
        audioFileAPI.findAllPageable(page - 1, size)
                .then(response => {
                    if (response && response.content) {
                        setAudioFiles(response.content);
                    }

                    setTotalElements(response.totalElements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch archive files:", err);
                    message.error(t("AudioFiles.messages.fetchError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    useEffect(() => {
        fetchAudioFiles();
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        audioFileAPI.delete(id)
                .then(_ => {
                    message.success(t("AudioFiles.messages.deleteSuccess"));
                    fetchAudioFiles();
                })
                .catch(err => {
                    console.error("Failed to delete audio file:", err);
                    message.error(t("AudioFiles.messages.deleteError"));
                })
                .finally(() => {
                    setLoading(false);
                });
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

    function handleTableChange(pagination: { current?: number; pageSize?: number }) {
        const nextPage = pagination.current ?? 1;
        const nextSize = pagination.pageSize ?? pageSize;
        setCurrentPage(nextPage);
        setPageSize(nextSize);
        fetchAudioFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "100%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {audioFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={audioFiles.map(file => ({...file, key: file.id}))}
                            loading={loading}
                            pagination={{
                                current: currentPage,
                                pageSize: pageSize,
                                total: totalElements,
                                showSizeChanger: true,
                                pageSizeOptions: ['10', '20', '50', '100'],
                            }}
                            onChange={handleTableChange}
                            scroll={{x: 'max-content'}}
                            key="audio-files-table"
                            rowKey="external_file_id"
                    />
                    }{audioFiles.length === 0 && !loading && t("AudioFiles.messages.noFiles")}
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
