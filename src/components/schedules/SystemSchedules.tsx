import {Button, InputNumber, message, Modal, Space, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {adminScheduleAPI, type ScheduleTriggerResponse} from "../../services";

export function SystemSchedules() {
    const {t} = useTranslation();
    const [schedules, setSchedules] = useState<ScheduleTriggerResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<ScheduleTriggerResponse | null>(null);
    const [delay, setDelay] = useState(0);

    const load = () => {
        setLoading(true);
        adminScheduleAPI.getSystemSchedules()
                .then(setSchedules)
                .catch(error => message.error(t("SystemSchedules.messages.fetchError", {defaultValue: "Failed to load schedules", error: String(error)})))
                .finally(() => setLoading(false));
    };
    useEffect(load, [t]);

    const trigger = () => {
        if (!selected) return;
        setLoading(true);
        adminScheduleAPI.triggerSystemSchedule({schedule_name: selected.schedule_name, delay})
                .then(() => message.success(t("SystemSchedules.messages.triggerSuccess", {defaultValue: "Schedule triggered"})))
                .catch(error => message.error(t("SystemSchedules.messages.triggerError", {defaultValue: "Failed to trigger schedule", error: String(error)})))
                .finally(() => {
                    setLoading(false);
                    setSelected(null);
                });
    };

    const columns: ColumnsType<ScheduleTriggerResponse> = [
        {title: t("SystemSchedules.columns.id", {defaultValue: "ID"}), dataIndex: "id", key: "id"},
        {title: t("SystemSchedules.columns.name", {defaultValue: "Schedule"}), dataIndex: "schedule_name", key: "schedule_name"},
        {title: t("SystemSchedules.columns.status", {defaultValue: "Status"}), dataIndex: "status", key: "status"},
        {
            title: t("Common.modal.actions", {defaultValue: "Actions"}), key: "actions", render: (_value, record) =>
                    <Button onClick={() => setSelected(record)}>{t("SystemSchedules.actions.trigger", {defaultValue: "Trigger"})}</Button>
        }
    ];

    return <Space direction="vertical" style={{width: "95%", margin: 30}} size="large">
        <h1>{t("SystemSchedules.title", {defaultValue: "System schedules"})}</h1>
        <Spin spinning={loading}><Table rowKey="id" columns={columns} dataSource={schedules}/></Spin>
        <Modal open={selected !== null} title={t("SystemSchedules.actions.trigger", {defaultValue: "Trigger schedule"})}
               onCancel={() => setSelected(null)} onOk={trigger} confirmLoading={loading}>
            <p>{selected?.schedule_name}</p>
            <InputNumber min={0} value={delay} onChange={value => setDelay(value ?? 0)}
                         addonAfter={t("SystemSchedules.fields.seconds", {defaultValue: "seconds"})}/>
        </Modal>
    </Space>;
}
