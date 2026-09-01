import {Button, Card, Form, Input, message} from "antd";
import type {UserVO} from "@vempain/vempain-auth-frontend";
import {useSession} from "@vempain/vempain-auth-frontend";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {adminUserAPI} from "../../services";

interface PasswordFields {
    password: string;
    confirmation: string;
}

export function ChangePassword() {
    const {t} = useTranslation();
    const {userSession} = useSession();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm<PasswordFields>();

    const save = (values: PasswordFields) => {
        if (!userSession?.id) return;
        setLoading(true);
        adminUserAPI.findById(Number(userSession.id), null)
                .then((user: UserVO) => adminUserAPI.update({
                    id: user.id,
                    private_user: user.private_user,
                    name: user.name,
                    nick: user.nick,
                    login_name: user.login_name,
                    privacy_type: user.privacy_type,
                    email: user.email,
                    street: user.street,
                    pob: user.pob,
                    description: user.description,
                    password: values.password,
                    acls: user.acls ?? []
                }))
                .then(() => {
                    message.success(t("ChangePassword.messages.success", {defaultValue: "Password changed"}));
                    form.resetFields();
                })
                .catch(error => message.error(t("ChangePassword.messages.error", {defaultValue: "Failed to change password", error: String(error)})))
                .finally(() => setLoading(false));
    };

    return <Card title={t("ChangePassword.title", {defaultValue: "Change password"})} style={{margin: 30}}>
        <Form form={form} layout="vertical" onFinish={save}>
            <Form.Item name="password" label={t("ChangePassword.fields.password", {defaultValue: "New password"})}
                       rules={[{required: true, min: 10}, {
                           pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
                           message: t("ChangePassword.messages.complexity", {defaultValue: "Use upper- and lowercase letters, a number and a symbol"})
                       }]}><Input.Password/></Form.Item>
            <Form.Item name="confirmation" label={t("ChangePassword.fields.confirmation", {defaultValue: "Confirm password"})}
                       dependencies={["password"]} rules={[{required: true}, ({getFieldValue}) => ({
                validator: (_, value) => value === getFieldValue("password")
                        ? Promise.resolve() : Promise.reject(new Error(t("ChangePassword.messages.match", {defaultValue: "Passwords do not match"})))
            })]}><Input.Password/></Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>{t("ChangePassword.actions.save", {defaultValue: "Change password"})}</Button>
        </Form>
    </Card>;
}
