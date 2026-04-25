import {Button, message, Select, Space, Spin, Typography} from "antd";
import {useCallback, useEffect, useState} from "react";
import {dataAPI, fileGroupAPI} from "../../services";
import type {FileGroupListResponse} from "../../models";
import {useTranslation} from "react-i18next";
import type {PagedRequest} from "@vempain/vempain-auth-frontend";
import {fileGroupPathToIdentifier} from "../../tools";

const {Title, Text} = Typography;
const {Option} = Select;

export function PublishGpsTimeSeries() {
    const {t} = useTranslation();
    const [loadingGroups, setLoadingGroups] = useState<boolean>(true);
    const [imageGroups, setImageGroups] = useState<FileGroupListResponse[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
    const [publishing, setPublishing] = useState<boolean>(false);

    const fetchImageGroups = useCallback(() => {
        setLoadingGroups(true);
        const pagedRequest: PagedRequest = {
            page: 0,
            size: 200,
            sort_by: "path",
            direction: "ASC",
        };
        fileGroupAPI.getFileGroups(pagedRequest)
                .then((data) => {
                    setImageGroups(data.content ?? []);
                })
                .catch(() => {
                    message.error(t("PublishGpsTimeSeries.messages.fetchGroupsError"));
                })
                .finally(() => {
                    setLoadingGroups(false);
                });
    }, [t]);

    useEffect(() => {
        fetchImageGroups();
    }, [fetchImageGroups]);

    const selectedGroup = imageGroups.find(g => g.id === selectedGroupId);
    const identifier = selectedGroup ? fileGroupPathToIdentifier(selectedGroup.path) : undefined;

    const handlePublish = useCallback(() => {
        if (!identifier) {
            message.warning(t("PublishGpsTimeSeries.messages.selectWarning"));
            return;
        }
        setPublishing(true);
        dataAPI.publishGpsTimeSeries(identifier)
                .then(() => {
                    message.success(t("PublishGpsTimeSeries.messages.publishSuccess"));
                })
                .catch(() => {
                    message.error(t("PublishGpsTimeSeries.messages.publishError"));
                })
                .finally(() => {
                    setPublishing(false);
                });
    }, [identifier, t]);

    return (
            <Space direction="vertical" style={{width: "100%", padding: 24}}>
                <Title level={3}>{t("PublishGpsTimeSeries.header.title")}</Title>
                <Spin spinning={loadingGroups}>
                    <Space direction="vertical" style={{width: "100%"}}>
                        <Text>{t("PublishGpsTimeSeries.select.label")}</Text>
                        <Select
                                style={{width: 400}}
                                placeholder={t("PublishGpsTimeSeries.select.placeholder")}
                                onChange={(value: number) => setSelectedGroupId(value)}
                                value={selectedGroupId}
                        >
                            {imageGroups.map(group => (
                                    <Option key={group.id} value={group.id}>
                                        {group.path} {group.group_name ? `(${group.group_name})` : ""}
                                    </Option>
                            ))}
                        </Select>
                        {identifier && (
                                <Text type="secondary">
                                    {t("PublishGpsTimeSeries.fields.derivedIdentifier")}: <strong>{identifier}</strong>
                                </Text>
                        )}
                        <Button
                                type="primary"
                                loading={publishing}
                                disabled={!selectedGroupId}
                                onClick={handlePublish}
                        >
                            {t("PublishGpsTimeSeries.actions.publish")}
                        </Button>
                    </Space>
                </Spin>
            </Space>
    );
}
