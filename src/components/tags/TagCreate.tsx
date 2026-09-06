import {Button, Card, Form, Input, message, Space} from "antd";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {tagAPI} from "../../services";
import type {TagRequest} from "../../models";

export function TagCreate() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const [form] = Form.useForm<TagRequest>();

    const submit = (values: TagRequest) => {
        tagAPI.create({...values, id: 0})
                .then(response => {
                    message.success(t("TagCreate.messages.success", {defaultValue: "Tag created"}));
                    navigate(`/tags/${response.id}/edit`);
                })
                .catch(error => message.error(t("TagCreate.messages.error", {defaultValue: "Failed to create tag", error: String(error)})));
    };

    const fields: (keyof TagRequest)[] = ["tag_name", "tag_name_de", "tag_name_en", "tag_name_es", "tag_name_fi", "tag_name_sv"];
    return <Card title={t("TagCreate.title", {defaultValue: "Create tag"})} style={{margin: 30}}>
        <Form form={form} layout="vertical" onFinish={submit}>
            {fields.map(field => <Form.Item key={field} name={field}
                                            label={t(`TagCreate.fields.${field}`, {defaultValue: field === "tag_name" ? "Tag name" : `Tag name (${field.slice(-2).toUpperCase()})`})}
                                            rules={field === "tag_name" ? [{required: true}] : []}><Input/></Form.Item>)}
            <Space>
                <Button type="primary" htmlType="submit">{t("Common.modal.create", {defaultValue: "Create"})}</Button>
                <Button onClick={() => navigate("/tags/list")}>{t("Common.modal.cancel", {defaultValue: "Cancel"})}</Button>
            </Space>
        </Form>
    </Card>;
}
