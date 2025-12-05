import {useEffect, useState} from "react";
import {message, Modal, Space, Spin, Table, Typography} from "antd";
import {useParams} from "react-router-dom";
import {fileGroupAPI} from "../../services";
import type {FileGroupResponse, FileResponse} from "../../models";
import type {ColumnsType} from "antd/es/table";
import {useTranslation} from "react-i18next";
import {createdColumn, FileDetails, filenameColumn, filePathColumn, fileSizeColumn, mimetypeColumn} from "./index";

export function ShowFileGroup() {
    const {t} = useTranslation();
    const {id} = useParams<{ id: string }>();
    const [loading, setLoading] = useState<boolean>(false);
    const [group, setGroup] = useState<FileGroupResponse | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<FileResponse | null>(null);

    useEffect(() => {
        if (!id) {
            return;
        }
        setLoading(true);
        const groupId = Number(id);
        fileGroupAPI.findById(groupId)
                .then((resp) => {
                    setGroup(resp);
                })
                .catch((err) => {
                    console.error("Failed to fetch file group:", err);
                    message.error(t("ShowFileGroup.messages.fetchError"));
                })
                .finally(() => setLoading(false));
    }, [id]);

    const columns: ColumnsType<FileResponse> = [
        filenameColumn<FileResponse>((record) => {
            setSelectedFile(record);
            setDetailsOpen(true);
        }, t),
        filePathColumn<FileResponse>(t),
        fileSizeColumn<FileResponse>(t),
        mimetypeColumn<FileResponse>(t),
        createdColumn<FileResponse>(t),
    ];

    return (
            <Space vertical={true} style={{width: "95%", margin: 30}} size="large">
                <Spin spinning={loading}>
                    {group && (
                            <>
                                <Typography.Title level={4}>
                                    {t("ShowFileGroup.header.title")}
                                </Typography.Title>
                                <Typography.Paragraph>
                                    <strong>{t("FileGroups.columns.group_name.title")}:</strong> {group.group_name}
                                </Typography.Paragraph>
                                <Typography.Paragraph>
                                    <strong>{t("FileGroups.columns.path.title")}:</strong> {group.path}
                                </Typography.Paragraph>
                                <Table<FileResponse>
                                        columns={columns}
                                        dataSource={(group.files ?? []).map(f => ({...f, key: f.id}))}
                                        pagination={{
                                            pageSize: 10,
                                            showSizeChanger: true,
                                            pageSizeOptions: ['10', '20', '50', '100'],
                                        }}
                                        scroll={{x: 'max-content'}}
                                        rowKey="external_file_id"
                                />
                            </>
                    )}
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

