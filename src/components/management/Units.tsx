import {Button, Form, Input, message, Modal, Space, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import type {PagedRequest, UnitVO} from "@vempain/vempain-auth-frontend";
import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {adminUnitAPI} from "../../services";
import {AclEditor} from "./AclEditor";

export function Units() {
    const {t} = useTranslation();
    const [units, setUnits] = useState<UnitVO[]>([]);
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<PagedRequest>({page: 0, size: 10, sort_by: "name", direction: "ASC", case_sensitive: false});
    const [total, setTotal] = useState(0);
    const [editing, setEditing] = useState<UnitVO | null>(null);
    const [form] = Form.useForm<Pick<UnitVO, "name" | "description">>();

    const fetchUnits = useCallback(() => {
        setLoading(true);
        adminUnitAPI.findPageable(request)
                .then(response => {
                    setUnits(response.content ?? []);
                    setTotal(response.total_elements ?? 0);
                })
                .catch(error => message.error(t("Units.messages.fetchError", {defaultValue: "Failed to load units", error: String(error)})))
                .finally(() => setLoading(false));
    }, [request, t]);
    useEffect(fetchUnits, [fetchUnits]);

    const saveUnit = (values: Pick<UnitVO, "name" | "description">) => {
        setLoading(true);
        const operation = editing?.id
                ? adminUnitAPI.update({...values, id: editing.id, acls: editing.acls ?? [], locked: editing.locked})
                : adminUnitAPI.create({...values, id: 0, acls: [], locked: false});
        operation
                .then(() => {
                    message.success(t("Units.messages.saveSuccess", {defaultValue: "Unit saved"}));
                    setEditing(null);
                    fetchUnits();
                })
                .catch(error => message.error(t("Units.messages.saveError", {defaultValue: "Failed to save unit", error: String(error)})))
                .finally(() => setLoading(false));
    };

    const columns: ColumnsType<UnitVO> = [
        {title: t("Units.columns.id", {defaultValue: "ID"}), dataIndex: "id", key: "id"},
        {title: t("Units.columns.name", {defaultValue: "Name"}), dataIndex: "name", key: "name"},
        {title: t("Units.columns.description", {defaultValue: "Description"}), dataIndex: "description", key: "description"},
        {
            title: t("Common.modal.actions", {defaultValue: "Actions"}), key: "actions",
            render: (_value, record) => <Button onClick={() => {
                setEditing(record);
                form.setFieldsValue(record);
            }}>{t("Common.modal.edit", {defaultValue: "Edit"})}</Button>
        }
    ];

    return <Space direction="vertical" style={{width: "95%", margin: 30}} size="large">
        <Space style={{justifyContent: "space-between", width: "100%"}}>
            <h1>{t("Units.title", {defaultValue: "Units"})}</h1>
            <Button type="primary" onClick={() => {
                setEditing({id: 0} as UnitVO);
                form.resetFields();
            }}>{t("Units.actions.create", {defaultValue: "Create unit"})}</Button>
        </Space>
        <Spin spinning={loading}>
            <Table<UnitVO> rowKey="id" columns={columns} dataSource={units}
                           pagination={{current: request.page + 1, pageSize: request.size, total, showSizeChanger: true}}
                           onChange={pagination => setRequest(previous => ({
                               ...previous, page: (pagination.current ?? 1) - 1, size: pagination.pageSize ?? previous.size
                           }))}/>
        </Spin>
        <Modal open={editing !== null}
               title={editing?.id ? t("Units.actions.edit", {defaultValue: "Edit unit"}) : t("Units.actions.create", {defaultValue: "Create unit"})}
               onCancel={() => setEditing(null)} footer={null} destroyOnHidden>
            <Form form={form} layout="vertical" onFinish={saveUnit}>
                <Form.Item name="name" label={t("Units.fields.name", {defaultValue: "Name"})} rules={[{required: true}]}><Input/></Form.Item>
                <Form.Item name="description" label={t("Units.fields.description", {defaultValue: "Description"})}><Input.TextArea/></Form.Item>
                <Form.Item label={t("Units.fields.permissions", {defaultValue: "Permissions"})}><AclEditor initialAcls={editing?.acls ?? []}/></Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>{t("Common.modal.save", {defaultValue: "Save"})}</Button>
            </Form>
        </Modal>
    </Space>;
}
