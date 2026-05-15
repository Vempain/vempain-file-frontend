import {Button, message, Modal, Popconfirm, Space, Spin, Table} from "antd";
import {useCallback, useEffect, useState} from "react";
import {DeleteOutlined} from "@ant-design/icons";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {fontFileAPI} from "../../services";
import type {FontFileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {FileDetails} from "./FileDetails";
import {createdColumn, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./commonColumns";
import {useTranslation} from "react-i18next";

export function FontFiles() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState(true);
    const [fontFiles, setFontFiles] = useState<FontFileResponse[]>([]);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FontFileResponse | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalElements, setTotalElements] = useState<number>(0);

    const fetchFontFiles = useCallback((page: number, size: number) => {
        setLoading(true);
        const pagedRequest: PagedRequest = {
            page: page - 1,
            size,
        };

        fontFileAPI.findAllPageable(pagedRequest)
                .then(response => {
                    if (response?.content) {
                        setFontFiles(response.content);
                    }

                    setTotalElements(response.total_elements ?? 0);
                    setCurrentPage(response.page + 1);
                    setPageSize(response.size);
                })
                .catch(err => {
                    console.error("Failed to fetch font files:", err);
                    message.error(t("FontFiles.messages.fetchError", {defaultValue: "Failed to load font files"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    useEffect(() => {
        fetchFontFiles(1, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleDelete(id: number) {
        setLoading(true);
        fontFileAPI.delete(id)
                .then(() => {
                    message.success(t("FontFiles.messages.deleteSuccess", {defaultValue: "Font file deleted successfully"}));
                    fetchFontFiles(currentPage, pageSize);
                })
                .catch(err => {
                    console.error("Failed to delete font file:", err);
                    message.error(t("FontFiles.messages.deleteError", {defaultValue: "Failed to delete font file"}));
                })
                .finally(() => {
                    setLoading(false);
                });
    }

    const columns: ColumnsType<FontFileResponse> = [
        filenameColumn<FontFileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<FontFileResponse>(t),
        fileSizeColumn<FontFileResponse>(t),
        mimetypeColumn<FontFileResponse>(t),
        {
            title: t("FontFiles.columns.font_family.title", {defaultValue: "Family"}),
            dataIndex: "font_family",
            key: "font_family",
        },
        {
            title: t("FontFiles.columns.weight.title", {defaultValue: "Weight"}),
            dataIndex: "weight",
            key: "weight",
        },
        {
            title: t("FontFiles.columns.style.title", {defaultValue: "Style"}),
            dataIndex: "style",
            key: "style",
        },
        createdColumn<FontFileResponse>(t),
        {
            title: t("FontFiles.columns.actions.title", {defaultValue: "Actions"}),
            key: "actions",
            render: (_: undefined, record: FontFileResponse) => (
                    <Popconfirm
                            title={t("FontFiles.popconfirm.delete.title", {defaultValue: "Delete this font file"})}
                            description={t("FontFiles.popconfirm.delete.description", {defaultValue: "Are you sure you want to delete this font file?"})}
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
        fetchFontFiles(nextPage, nextSize);
    }

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {fontFiles.length > 0 && <Table
                            columns={columns}
                            dataSource={fontFiles.map(file => ({...file, key: file.id}))}
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
                            key="font-files-table"
                            rowKey="external_file_id"
                    />
                    }{fontFiles.length === 0 && !loading && t("FontFiles.messages.noFiles", {defaultValue: "No font files found"})}
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

