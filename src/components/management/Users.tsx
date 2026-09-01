import {Button, Form, Input, message, Modal, Space, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import type {PagedRequest, UserVO} from "@vempain/vempain-auth-frontend";
import {useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {adminUserAPI} from "../../services";
import {AclEditor} from "./AclEditor";

type UserForm = Pick<UserVO, "name" | "nick" | "login_name" | "email" | "description" | "password" | "acls"> & {
    id?: number;
};

export function Users() {
    const {t} = useTranslation();
    const [users, setUsers] = useState<UserVO[]>([]);
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<PagedRequest>({page: 0, size: 10, sort_by: "name", direction: "ASC", case_sensitive: false});
    const [total, setTotal] = useState(0);
    const [editing, setEditing] = useState<UserVO | null>(null);
    const [form] = Form.useForm<UserForm>();

    const fetchUsers = useCallback(() => {
        setLoading(true);
        adminUserAPI.findPageable(request)
                .then(response => {
                    setUsers(response.content ?? []);
                    setTotal(response.total_elements ?? 0);
                })
                .catch(error => message.error(t("Users.messages.fetchError", {defaultValue: "Failed to load users", error: String(error)})))
                .finally(() => setLoading(false));
    }, [request, t]);

    useEffect(fetchUsers, [fetchUsers]);

    const saveUser = (values: UserForm) => {
        setLoading(true);
        const payload = {
            ...values,
            id: editing?.id ?? 0,
            private_user: editing?.private_user ?? false,
            privacy_type: editing?.privacy_type ?? "PUBLIC",
            acls: editing?.acls ?? []
        };
        const operation = editing?.id ? adminUserAPI.update(payload) : adminUserAPI.create(payload);
        operation
                .then(() => {
                    message.success(t("Users.messages.saveSuccess", {defaultValue: "User saved"}));
                    setEditing(null);
                    form.resetFields();
                    fetchUsers();
                })
                .catch(error => message.error(t("Users.messages.saveError", {defaultValue: "Failed to save user", error: String(error)})))
                .finally(() => setLoading(false));
    };

    const columns: ColumnsType<UserVO> = [
        {title: t("Users.columns.id", {defaultValue: "ID"}), dataIndex: "id", key: "id", sorter: true},
        {title: t("Users.columns.login_name", {defaultValue: "Login name"}), dataIndex: "login_name", key: "login_name", sorter: true},
        {title: t("Users.columns.name", {defaultValue: "Name"}), dataIndex: "name", key: "name", sorter: true},
        {title: t("Users.columns.email", {defaultValue: "Email"}), dataIndex: "email", key: "email", sorter: true},
        {title: t("Users.columns.privacy_type", {defaultValue: "Privacy"}), dataIndex: "privacy_type", key: "privacy_type"},
        {
            title: t("Common.modal.actions", {defaultValue: "Actions"}), key: "actions",
            render: (_value, record) => <Button onClick={() => {
                setEditing(record);
                form.setFieldsValue({...record, password: ""});
            }}>{t("Common.modal.edit", {defaultValue: "Edit"})}</Button>
        }
    ];

    return <Space direction="vertical" style={{width: "95%", margin: 30}} size="large">
        <Space style={{justifyContent: "space-between", width: "100%"}}>
            <h1>{t("Users.title", {defaultValue: "Users"})}</h1>
            <Button type="primary" onClick={() => {
                setEditing({id: 0} as UserVO);
                form.resetFields();
            }}>{t("Users.actions.create", {defaultValue: "Create user"})}</Button>
        </Space>
        <Spin spinning={loading}>
            <Table<UserVO>
                    rowKey="id"
                    columns={columns}
                    dataSource={users}
                    scroll={{x: "max-content"}}
                    pagination={{current: request.page + 1, pageSize: request.size, total, showSizeChanger: true}}
                    onChange={pagination => setRequest(previous => ({
                        ...previous,
                        page: (pagination.current ?? 1) - 1,
                        size: pagination.pageSize ?? previous.size
                    }))}
            />
        </Spin>
        <Modal
                open={editing !== null}
                title={editing?.id ? t("Users.actions.edit", {defaultValue: "Edit user"}) : t("Users.actions.create", {defaultValue: "Create user"})}
                onCancel={() => setEditing(null)}
                footer={null}
                destroyOnHidden
        >
            <Form form={form} layout="vertical" onFinish={saveUser}>
                <Form.Item name="login_name" label={t("Users.fields.login_name", {defaultValue: "Login name"})} rules={[{required: true}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name="name" label={t("Users.fields.name", {defaultValue: "Name"})} rules={[{required: true}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name="nick" label={t("Users.fields.nick", {defaultValue: "Nick"})}><Input/></Form.Item>
                <Form.Item name="email" label={t("Users.fields.email", {defaultValue: "Email"})} rules={[{required: true, type: "email"}]}><Input/></Form.Item>
                <Form.Item name="password" label={t("Users.fields.password", {defaultValue: "Password"})}
                           rules={[{required: !editing?.id}]}><Input.Password/></Form.Item>
                <Form.Item name="description" label={t("Users.fields.description", {defaultValue: "Description"})}><Input.TextArea/></Form.Item>
                <Form.Item label={t("Users.fields.permissions", {defaultValue: "Permissions"})}><AclEditor initialAcls={editing?.acls ?? []}/></Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>{t("Common.modal.save", {defaultValue: "Save"})}</Button>
            </Form>
        </Modal>
    </Space>;
}
