import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import {videoFileAPI} from "../../services";
import type {VideoFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function VideoFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [videoFiles, setVideoFiles] = useState<VideoFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<VideoFileResponse | null>(null);
    // Add paging state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    function fetchVideoFiles(page: number = currentPage, size: number = pageSize) {
        setLoading(true);
        videoFileAPI.findAllPageable(page - 1, size)
                .then(response => {
                    if (response && response.content) {
                        setVideoFiles(response.content);
                    }

                    setTotalElements(response.totalElements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch image files:", err);
                    message.error(t("VideoFiles.messages.fetchError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    useEffect(() => {
        fetchVideoFiles();
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        videoFileAPI.delete(id)
                .then(_ => {
                    message.success(t("VideoFiles.messages.deleteSuccess"));
                    fetchVideoFiles();
                })
                .catch(err => {
                    console.error("Failed to delete video file:", err);
                    message.error(t("VideoFiles.messages.deleteError"));
                })
                .finally(() => {
                    setLoading(false);
                });
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
                    <Popconfirm
                            title={t("VideoFiles.popconfirm.delete.title")}
                            description={t("VideoFiles.popconfirm.delete.description")}
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
        fetchVideoFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "100%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {videoFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={videoFiles.map(file => ({...file, key: file.id}))}
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
                            key="video-files-table"
                            rowKey="external_file_id"
                    />
                    }{videoFiles.length === 0 && !loading && t("VideoFiles.messages.noFiles")}
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
