import {Button, Form, message, Modal, Tooltip, Typography} from "antd";
import {UploadOutlined} from "@ant-design/icons";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import {useTaskProgress} from "@vempain/vempain-common-frontend";
import {publishAPI} from "../../services";
import type {FileResponse, PublishFileRequest, TaskAcceptedResponse} from "../../models";
import {PublishAclEditor} from "./PublishAclEditor";
import {toPublishAclRequests} from "../../tools/publishAcl";

interface PublishFileButtonProps {
    file: FileResponse;
    /** Called when the background task has finished, e.g. to reload the list */
    onPublished?: () => void;
}

/**
 * Action button of the typed file lists: opens a modal where additional admin users can be granted access, then starts the
 * single-file publish task (POST /publish/file). No gallery is created on the admin side; the progress shows in the task tray.
 */
export function PublishFileButton({file, onPublished}: PublishFileButtonProps) {
    const {t} = useTranslation();
    const {trackTask} = useTaskProgress();
    const [open, setOpen] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [form] = Form.useForm();

    function close() {
        setOpen(false);
        form.resetFields();
    }

    function submit() {
        form.validateFields()
                .then(values => {
                    setSubmitting(true);
                    const request: PublishFileRequest = {
                        file_id: file.id,
                        acls: toPublishAclRequests(values.acls)
                    };
                    // The backend answers 202 immediately; the upload runs as a background task shown in the task tray
                    publishAPI.publishFile(request)
                            .then((accepted: TaskAcceptedResponse) => {
                                trackTask(accepted, {onFinished: () => onPublished?.()});
                                message.success(t("PublishFile.messages.publishStarted", {
                                    defaultValue: "Publishing of {{filename}} started, follow the progress in the lower right corner",
                                    filename: file.filename
                                }));
                                close();
                            })
                            .catch(err => {
                                console.error("Failed to publish file:", err);
                                message.error(t("PublishFile.messages.publishError", {defaultValue: "Failed to publish file"}));
                            })
                            .finally(() => setSubmitting(false));
                })
                .catch(() => undefined);
    }

    return (
            <>
                <Tooltip title={t("PublishFile.actions.publish", {defaultValue: "Publish"})}>
                    <Button icon={<UploadOutlined/>} onClick={() => setOpen(true)} aria-label={t("PublishFile.actions.publish", {defaultValue: "Publish"})}/>
                </Tooltip>
                <Modal
                        open={open}
                        title={t("PublishFile.modal.title", {defaultValue: "Publish file"})}
                        onOk={submit}
                        onCancel={close}
                        confirmLoading={submitting}
                        destroyOnHidden
                        width={760}
                >
                    <Typography.Paragraph>
                        {t("PublishFile.modal.description", {
                            defaultValue: "{{filename}} is published to Vempain Admin as a single site file; no gallery is created.",
                            filename: file.filename
                        })}
                    </Typography.Paragraph>
                    <Form form={form} layout="vertical" initialValues={{acls: []}}>
                        {open && <PublishAclEditor/>}
                    </Form>
                </Modal>
            </>
    );
}
