import {Button, Form, Input, message, Modal, Space, Spin} from "antd";
import type {ColumnsType} from "antd/es/table";
import type {UnitVO} from "@vempain/vempain-auth-frontend";
import {usePagedTable, VempainTable} from "@vempain/vempain-auth-frontend";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {adminUnitAPI} from "../../services";
import {AclEditor} from "./AclEditor";

export function Units() {
    const {t} = useTranslation();
    const paged = usePagedTable<UnitVO>(
            request => adminUnitAPI.findPageable(request),
            {defaultPageSize: 10, defaultSortBy: "name"}
    );
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState<UnitVO | null>(null);
    const [form] = Form.useForm<Pick<UnitVO, "name" | "description">>();

    const saveUnit = (values: Pick<UnitVO, "name" | "description">) => {
        setLoading(true);
        const operation = editing?.id
                ? adminUnitAPI.update({...values, id: editing.id, acls: editing.acls ?? [], locked: editing.locked})
                : adminUnitAPI.create({...values, id: 0, acls: [], locked: false});
        operation
                .then(() => {
                    message.success(t("Units.messages.saveSuccess", {defaultValue: "Unit saved"}));
                    setEditing(null);
                    paged.reload();
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
        {paged.contextHolder}
        <Space style={{justifyContent: "space-between", width: "100%"}}>
            <h1>{t("Units.title", {defaultValue: "Units"})}</h1>
            <Button type="primary" onClick={() => {
                setEditing({id: 0} as UnitVO);
                form.resetFields();
            }}>{t("Units.actions.create", {defaultValue: "Create unit"})}</Button>
        </Space>
        <Spin spinning={paged.loading}>
            <VempainTable<UnitVO>
                    dataMode="server"
                    paged={paged}
                    rowKey="id"
                    columns={columns}
            />
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
