import {Button, Card, Form, Input, message, Spin} from "antd";
import type {UserVO} from "@vempain/vempain-auth-frontend";
import {useSession} from "@vempain/vempain-auth-frontend";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {adminUserAPI} from "../../services";

type AccountFields = Pick<UserVO, "name" | "nick" | "login_name" | "email" | "street" | "pob" | "description">;

export function Account() {
    const {t} = useTranslation();
    const {userSession} = useSession();
    const [form] = Form.useForm<AccountFields>();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserVO | null>(null);

    useEffect(() => {
        if (!userSession?.id) {
            setLoading(false);
            return;
        }
        adminUserAPI.findById(Number(userSession.id), null)
                .then(response => {
                    setUser(response);
                    form.setFieldsValue(response);
                })
                .catch(error => message.error(t("Account.messages.fetchError", {defaultValue: "Failed to load account", error: String(error)})))
                .finally(() => setLoading(false));
    }, [form, t, userSession?.id]);

    const save = (values: AccountFields) => {
        if (!user) return;
        setLoading(true);
        adminUserAPI.update({...values, id: user.id, private_user: user.private_user, privacy_type: user.privacy_type, acls: user.acls ?? []})
                .then(response => {
                    setUser(response);
                    message.success(t("Account.messages.success", {defaultValue: "Account updated"}));
                })
                .catch(error => message.error(t("Account.messages.error", {defaultValue: "Failed to update account", error: String(error)})))
                .finally(() => setLoading(false));
    };

    return <Card title={t("Account.title", {defaultValue: "Account"})} style={{margin: 30}}>
        <Spin spinning={loading}>
            <Form form={form} layout="vertical" onFinish={save}>
                <Form.Item name="login_name" label={t("Account.fields.login_name", {defaultValue: "Login name"})}><Input disabled/></Form.Item>
                <Form.Item name="name" label={t("Account.fields.name", {defaultValue: "Name"})} rules={[{required: true}]}><Input/></Form.Item>
                <Form.Item name="nick" label={t("Account.fields.nick", {defaultValue: "Nick"})}><Input/></Form.Item>
                <Form.Item name="email" label={t("Account.fields.email", {defaultValue: "Email"})}
                           rules={[{required: true, type: "email"}]}><Input/></Form.Item>
                <Form.Item name="street" label={t("Account.fields.street", {defaultValue: "Street"})}><Input/></Form.Item>
                <Form.Item name="pob" label={t("Account.fields.pob", {defaultValue: "Post office box"})}><Input/></Form.Item>
                <Form.Item name="description" label={t("Account.fields.description", {defaultValue: "Description"})}><Input.TextArea/></Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>{t("Common.modal.save", {defaultValue: "Save"})}</Button>
            </Form>
        </Spin>
    </Card>;
}
