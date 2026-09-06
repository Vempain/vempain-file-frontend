import {Button, Card, Form, Input, message, Space, Spin} from "antd";
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import type {TagRequest} from "../../models";
import {tagAPI} from "../../services";

export function TagEdit() {
    const {tagId} = useParams<{ tagId: string }>();
    const navigate = useNavigate();
    const {t} = useTranslation();
    const [form] = Form.useForm<TagRequest>();
    const [loading, setLoading] = useState(true);
    const id = Number(tagId);

    useEffect(() => {
        if (!Number.isInteger(id) || id < 1) {
            message.error(t("TagEdit.messages.invalid", {defaultValue: "Invalid tag"}));
            setLoading(false);
            return;
        }
        tagAPI.findById(id, null)
                .then(tag => form.setFieldsValue(tag))
                .catch(error => message.error(t("TagEdit.messages.fetchError", {defaultValue: "Failed to load tag", error: String(error)})))
                .finally(() => setLoading(false));
    }, [form, id, t]);

    const submit = (values: TagRequest) => {
        tagAPI.update({...values, id})
                .then(() => {
                    message.success(t("TagEdit.messages.success", {defaultValue: "Tag updated"}));
                    navigate("/tags/list");
                })
                .catch(error => message.error(t("TagEdit.messages.error", {defaultValue: "Failed to update tag", error: String(error)})));
    };
    const fields: (keyof TagRequest)[] = ["tag_name", "tag_name_de", "tag_name_en", "tag_name_es", "tag_name_fi", "tag_name_sv"];
    return <Card title={t("TagEdit.title", {defaultValue: "Edit tag"})} style={{margin: 30}}>
        <Spin spinning={loading}>
            <Form form={form} layout="vertical" onFinish={submit}>
                <Form.Item name="id" label="ID"><Input disabled/></Form.Item>
                {fields.map(field => <Form.Item key={field} name={field}
                                                label={t(`TagEdit.fields.${field}`, {defaultValue: field === "tag_name" ? "Tag name" : `Tag name (${field.slice(-2).toUpperCase()})`})}
                                                rules={field === "tag_name" ? [{required: true}] : []}><Input/></Form.Item>)}
                <Space>
                    <Button type="primary" htmlType="submit">{t("Common.modal.save", {defaultValue: "Save"})}</Button>
                    <Button onClick={() => navigate("/tags/list")}>{t("Common.modal.cancel", {defaultValue: "Cancel"})}</Button>
                </Space>
            </Form>
        </Spin>
    </Card>;
}
