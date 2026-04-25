import {Button, message, Space, Spin, Typography} from "antd";
import {useCallback, useState} from "react";
import {dataAPI} from "../../services";
import {useTranslation} from "react-i18next";

const {Title} = Typography;

export function PublishMusicData() {
    const {t} = useTranslation();
    const [publishing, setPublishing] = useState<boolean>(false);

    const handlePublish = useCallback(() => {
        setPublishing(true);
        dataAPI.publishMusic()
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
                <Spin spinning={publishing}>
                    <Button
                            type="primary"
                            loading={publishing}
                            onClick={handlePublish}
                    >
                        {t("PublishMusicData.actions.publish")}
                    </Button>
                </Spin>
            </Space>
    );
}
