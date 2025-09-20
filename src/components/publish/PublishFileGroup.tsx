import {useEffect, useState} from "react";
import {Button, message, Select, Space, Spin, Typography} from "antd";
import {fileGroupAPI, publishAPI} from "../../services";
import type {FileGroupResponse, PublishFileGroupResponse} from "../../models/responses";
import type {PublishFileGroupRequest} from "../../models/requests";
import {useTranslation} from "react-i18next";

export function PublishFileGroup() {
    const [fileGroups, setFileGroups] = useState<FileGroupResponse[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const {t} = useTranslation();

    useEffect(() => {
        setLoading(true);
        fileGroupAPI.findAll()
                .then((groups: FileGroupResponse[]) => setFileGroups(groups))
                .catch(() => message.error(t("PublishFileGroup.messages.fetchError")))
                .finally(() => setLoading(false));
    }, [t]);

    const handlePublish = () => {
        if (!selectedGroupId) {
            message.warning(t("PublishFileGroup.messages.selectWarning"));
            return;
        }
        setLoading(true);
        const request: PublishFileGroupRequest = {file_group_id: selectedGroupId};
        publishAPI.publishFileGroup(request)
                .then((result: PublishFileGroupResponse[]) => {
                    const count = result[0]?.files_to_publish_count ?? 0;
                    message.success(t("PublishFileGroup.messages.publishSuccess", {count}));
                })
                .catch(() => message.error(t("PublishFileGroup.messages.publishError")))
                .finally(() => setLoading(false));
    };

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    <Space direction="vertical" style={{width: "100%", margin: 30}} size="large">
                        <Typography.Title level={4}>{t("PublishFileGroup.header.title")}</Typography.Title>
                        <Select
                                style={{width: 400}}
                                placeholder={t("PublishFileGroup.select.placeholder")}
                                loading={loading}
                                value={selectedGroupId ?? undefined}
                                onChange={setSelectedGroupId}
                                options={fileGroups.map(group => ({
                                    label: group.path + " " + group.group_name,
                                    value: group.id
                                }))}
                                allowClear
                        />
                        <Button
                                type="primary"
                                onClick={handlePublish}
                                disabled={!selectedGroupId}
                                loading={loading}
                        >
                            {t("PublishFileGroup.actions.publish")}
                        </Button>
                    </Space>
                </Spin>
            </div>
    );
}
