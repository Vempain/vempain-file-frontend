import {Alert, Form, Input, message, Modal, Typography} from "antd";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {useTaskProgress} from "@vempain/vempain-common-frontend";
import type {MetadataSummaryResponse, MetadataValueUpdateRequest, TaskAcceptedResponse} from "../../models";
import {metadataAPI} from "../../services";

interface MetadataValueEditModalProps {
    /** The row being edited; null keeps the modal closed */
    summary: MetadataSummaryResponse | null;
    onClose: () => void;
    /** Called when the background task has finished, so that the list can reload */
    onFinished?: () => void;
}

interface FormValues {
    new_value: string;
}

/**
 * Edit dialog of one metadata row: the new value (which may be empty, removing the entry) is written into every file carrying
 * the row's group, key and current value. The backend answers 202 and the rewrite runs as a background task in the tray.
 */
export function MetadataValueEditModal({summary, onClose, onFinished}: MetadataValueEditModalProps) {
    const {t} = useTranslation();
    const {trackTask} = useTaskProgress();
    const [form] = Form.useForm<FormValues>();
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (summary) {
            form.setFieldsValue({new_value: summary.metadata_value});
        }
    }, [form, summary]);

    function close() {
        form.resetFields();
        onClose();
    }

    function submit() {
        if (!summary) {
            return;
        }
        form.validateFields()
                .then(values => {
                    const request: MetadataValueUpdateRequest = {
                        metadata_group: summary.metadata_group,
                        metadata_key: summary.metadata_key,
                        metadata_value: summary.metadata_value,
                        new_value: values.new_value ?? ""
                    };
                    setSubmitting(true);
                    // The backend answers 202 immediately; the rewrite runs as a background task shown in the task tray
                    metadataAPI.updateValue(request)
                            .then((accepted: TaskAcceptedResponse) => {
                                trackTask(accepted, {onFinished: () => onFinished?.()});
                                message.success(t("MetadataValueEdit.messages.started", {
                                    defaultValue: "Rewriting {{key}} in {{count}} files started, follow the progress in the lower right corner",
                                    key: `${summary.metadata_group}:${summary.metadata_key}`,
                                    count: summary.file_count
                                }));
                                close();
                            })
                            .catch(error => {
                                console.error("Failed to start the metadata rewrite:", error);
                                message.error(t("MetadataValueEdit.messages.error", {defaultValue: "Failed to start the metadata rewrite"}));
                            })
                            .finally(() => setSubmitting(false));
                })
                .catch(() => undefined);
    }

    return (
            <Modal
                    open={summary !== null}
                    title={t("MetadataValueEdit.title", {defaultValue: "Edit metadata value"})}
                    onOk={submit}
                    onCancel={close}
                    okText={t("Common.modal.save", {defaultValue: "Save"})}
                    cancelText={t("Common.modal.cancel", {defaultValue: "Cancel"})}
                    confirmLoading={submitting}
                    destroyOnHidden
            >
                {summary && <>
                    <Typography.Paragraph>
                        <Typography.Text strong>{summary.metadata_group}:{summary.metadata_key}</Typography.Text>
                    </Typography.Paragraph>
                    <Typography.Paragraph>
                        {t("MetadataValueEdit.currentValue", {defaultValue: "Current value"})}: <Typography.Text code>{summary.metadata_value}</Typography.Text>
                    </Typography.Paragraph>
                    <Alert
                            type="warning"
                            showIcon
                            style={{marginBottom: 16}}
                            message={t("MetadataValueEdit.warning", {
                                defaultValue: "The new value is written into all {{count}} files carrying this value. Leave it empty to remove the entry from the files.",
                                count: summary.file_count
                            })}
                    />
                    <Form form={form} layout="vertical" onFinish={submit}>
                        <Form.Item name="new_value" label={t("MetadataValueEdit.newValue", {defaultValue: "New value"})}>
                            <Input.TextArea autoSize={{minRows: 1, maxRows: 6}} autoFocus/>
                        </Form.Item>
                    </Form>
                </>}
            </Modal>
    );
}
