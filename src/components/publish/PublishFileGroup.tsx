import {useEffect, useState} from "react";
import {Button, message, Select, Space, Spin, Typography} from "antd";
import {fileGroupAPI, publishAPI} from "../../services";
import type {FileGroupResponse, PublishFileGroupResponse} from "../../models/responses";
import type {PublishFileGroupRequest} from "../../models/requests";

export function PublishFileGroup() {
    const [fileGroups, setFileGroups] = useState<FileGroupResponse[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fileGroupAPI.findAll()
                .then((groups: FileGroupResponse[]) => setFileGroups(groups))
                .catch(() => message.error("Failed to load file groups"))
                .finally(() => setLoading(false));
    }, []);

    const handlePublish = () => {
        if (!selectedGroupId) {
            message.warning("Please select a file group to publish");
            return;
        }
        setLoading(true);
        const request: PublishFileGroupRequest = {file_group_id: selectedGroupId};
        publishAPI.publishFileGroup(request)
                .then((result: PublishFileGroupResponse[]) => {
                    message.success(`Published ${result[0]?.files_to_publish_count ?? 0} files`);
                })
                .catch(() => message.error("Failed to publish file group"))
                .finally(() => setLoading(false));
    };

    return (
            <div className={"darkDiv"}>
                <Spin spinning={loading}>
                    <Space direction="vertical" style={{width: "100%", margin: 30}} size="large">
                        <Typography.Title level={4}>Publish File Group</Typography.Title>
                        <Select
                                style={{width: 400}}
                                placeholder="Select file group"
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
                            Publish
                        </Button>
                    </Space>
                </Spin>
            </div>
    );
}
