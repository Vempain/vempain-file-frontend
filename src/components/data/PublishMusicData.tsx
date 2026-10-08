import {Button, message, Space, Typography} from "antd";
import {useCallback, useState} from "react";
import {dataAPI} from "../../services";
import {useTranslation} from "react-i18next";
import {useTaskProgress} from "@vempain/vempain-common-frontend";

const {Title} = Typography;

export function PublishMusicData() {
    const {t} = useTranslation();
    const {trackTask} = useTaskProgress();
    const [submitting, setSubmitting] = useState<boolean>(false);

    const handlePublish = useCallback(() => {
        setSubmitting(true);
        // The data set is generated and uploaded as a background task shown in the task tray
        dataAPI.publishMusic()
                .then(accepted => {
                    trackTask(accepted);
                    message.success(t("PublishMusicData.messages.publishStarted"));
                })
                .catch(() => {
                    message.error(t("PublishMusicData.messages.publishError"));
                })
                .finally(() => {
                    setSubmitting(false);
                });
    }, [t, trackTask]);

    return (
            <Space orientation={"vertical"} style={{width: "95%", padding: 24}}>
                <Title level={3}>{t("PublishMusicData.header.title")}</Title>
                <Button
                        type="primary"
                        loading={submitting}
                        onClick={handlePublish}
                >
                    {t("PublishMusicData.actions.publish")}
                </Button>
            </Space>
    );
}
