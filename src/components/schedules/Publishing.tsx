import {Button, message, Modal, Space, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {adminScheduleAPI, type PublishScheduleResponse} from "../../services";

export function Publishing() {
    const {t} = useTranslation();
    const [schedules, setSchedules] = useState<PublishScheduleResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<PublishScheduleResponse | null>(null);

    const load = () => {
        setLoading(true);
        adminScheduleAPI.getPublishingSchedules()
                .then(setSchedules)
                .catch(error => message.error(t("Publishing.messages.fetchError", {defaultValue: "Failed to load publishing schedules", error: String(error)})))
                .finally(() => setLoading(false));
    };
    useEffect(load, [t]);

    const trigger = () => {
        if (!selected) return;
        setLoading(true);
        adminScheduleAPI.triggerPublishingSchedule(selected)
                .then(() => message.success(t("Publishing.messages.triggerSuccess", {defaultValue: "Publishing triggered"})))
                .catch(error => message.error(t("Publishing.messages.triggerError", {defaultValue: "Failed to trigger publishing", error: String(error)})))
                .finally(() => {
                    setLoading(false);
                    setSelected(null);
                });
    };

    const columns: ColumnsType<PublishScheduleResponse> = [
        {title: t("Publishing.columns.id", {defaultValue: "ID"}), dataIndex: "id", key: "id"},
        {
            title: t("Publishing.columns.time", {defaultValue: "Publish time"}),
            dataIndex: "publish_time",
            key: "publish_time",
            render: value => new Date(value).toLocaleString()
        },
        {title: t("Publishing.columns.status", {defaultValue: "Status"}), dataIndex: "publish_status", key: "publish_status"},
        {title: t("Publishing.columns.type", {defaultValue: "Type"}), dataIndex: "publish_type", key: "publish_type"},
        {title: t("Publishing.columns.message", {defaultValue: "Message"}), dataIndex: "publish_message", key: "publish_message"},
        {
            title: t("Common.modal.actions", {defaultValue: "Actions"}), key: "actions", render: (_value, record) =>
                    <Button onClick={() => setSelected(record)}>{t("Publishing.actions.trigger", {defaultValue: "Trigger"})}</Button>
        }
    ];

    return <Space direction="vertical" style={{width: "95%", margin: 30}} size="large">
        <h1>{t("Publishing.title", {defaultValue: "Publishing schedules"})}</h1>
        <Spin spinning={loading}><Table rowKey="id" columns={columns} dataSource={schedules} scroll={{x: "max-content"}}/></Spin>
        <Modal open={selected !== null} title={t("Publishing.actions.trigger", {defaultValue: "Trigger publishing"})}
               onCancel={() => setSelected(null)} onOk={trigger} confirmLoading={loading}>
            <p>{selected?.publish_message}</p>
        </Modal>
    </Space>;
}
