import {Button, message, Space, Spin, Typography} from "antd";
import {useCallback, useEffect, useState} from "react";
import {dataAPI} from "../../services";
import type {DataSummaryResponse} from "../../models";
import {useTranslation} from "react-i18next";

const {Title, Text} = Typography;

const MUSIC_IDENTIFIER = "music";

export function PublishMusicData() {
    const {t} = useTranslation();
    const [loading, setLoading] = useState<boolean>(true);
    const [publishing, setPublishing] = useState<boolean>(false);
    const [musicDataSet, setMusicDataSet] = useState<DataSummaryResponse | null>(null);

    const fetchMusicDataSet = useCallback(() => {
        setLoading(true);
        dataAPI.getDataSetByIdentifier(MUSIC_IDENTIFIER)
                .then((data) => {
                    setMusicDataSet(data);
                })
                .catch(() => {
                    setMusicDataSet(null);
                    message.error(t("PublishMusicData.messages.fetchError"));
                })
                .finally(() => {
                    setLoading(false);
                });
    }, [t]);

    useEffect(() => {
        fetchMusicDataSet();
    }, [fetchMusicDataSet]);

    const handlePublish = useCallback(() => {
        setPublishing(true);
        dataAPI.publishDataSet(MUSIC_IDENTIFIER)
                .then(() => {
                    message.success(t("PublishMusicData.messages.publishSuccess"));
                })
                .catch(() => {
                    message.error(t("PublishMusicData.messages.publishError"));
                })
                .finally(() => {
                    setPublishing(false);
                });
    }, [t]);

    return (
            <Space direction="vertical" style={{width: "100%", padding: 24}}>
                <Title level={3}>{t("PublishMusicData.header.title")}</Title>
                <Spin spinning={loading}>
                    {musicDataSet ? (
                            <Space direction="vertical">
                                <Text><strong>{t("PublishMusicData.fields.identifier")}:</strong> {musicDataSet.identifier}</Text>
                                <Text><strong>{t("PublishMusicData.fields.type")}:</strong> {musicDataSet.type}</Text>
                                {musicDataSet.description && (
                                        <Text><strong>{t("PublishMusicData.fields.description")}:</strong> {musicDataSet.description}</Text>
                                )}
                                <Text><strong>{t("PublishMusicData.fields.updatedAt")}:</strong> {musicDataSet.updated_at}</Text>
                                <Button
                                        type="primary"
                                        loading={publishing}
                                        onClick={handlePublish}
                                >
                                    {t("PublishMusicData.actions.publish")}
                                </Button>
                            </Space>
                    ) : (
                            !loading && <Text type="warning">{t("PublishMusicData.messages.notFound")}</Text>
                    )}
                </Spin>
            </Space>
    );
}
