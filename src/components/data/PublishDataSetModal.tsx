import {Form, Modal, Typography} from "antd";
import {type ReactNode, useEffect} from "react";
import {useTranslation} from "react-i18next";
import {dataAPI} from "../../services";
import type {PublishAclRequest} from "../../models";
import {PublishAclEditor} from "../files/PublishAclEditor";
import {PublishStatusNotice} from "../files/PublishStatusNotice";
import {usePublishStatus} from "../files/usePublishStatus";
import {toPublishAclRequests} from "../../tools/publishAcl";

interface PublishDataSetModalProps {
    open: boolean;
    /** Identifier of the data set in the admin backend (music_library, or the identifier derived from the GPS series name) */
    identifier: string;
    title: string;
    /** What the action does, shown above the status line */
    description: string;
    /** The label of the OK button, the action picked on the split button */
    okText: ReactNode;
    submitting: boolean;
    onCancel: () => void;
    /** Called with the grantees to send: always a list, empty when every row was removed, so that the admin backend can drop old grantees */
    onSubmit: (acls: PublishAclRequest[]) => void;
}

/**
 * The dialog of the data set screens, the same pattern as the file and file group publish dialogs: it tells whether the admin backend holds the
 * data set already (GET /data-publish/{identifier}/status), prefills the admin users and units granted access by the previous creation, and
 * lets the user change them through the shared ACL editor before the data set task is started. The publishing service account always keeps
 * every privilege; the rows only concern other admin users and units.
 */
export function PublishDataSetModal({open, identifier, title, description, okText, submitting, onCancel, onSubmit}: PublishDataSetModalProps) {
    const {t} = useTranslation();
    const [form] = Form.useForm();
    const {status, loading, failed} = usePublishStatus(open, () => dataAPI.getDataSetStatus(identifier), form);

    // The form instance outlives the dialog: forget the rows whenever it closes (cancelled or submitted), the next opening prefills anew
    useEffect(() => {
        if (!open) {
            form.resetFields();
        }
    }, [open, form]);

    function close() {
        onCancel();
    }

    function submit() {
        form.validateFields()
                .then(values => onSubmit(toPublishAclRequests(values.acls) ?? []))
                .catch(() => undefined);
    }

    return (
            <Modal
                    open={open}
                    title={title}
                    onOk={submit}
                    okText={okText}
                    onCancel={close}
                    confirmLoading={submitting}
                    destroyOnHidden
                    width={760}
            >
                <Typography.Paragraph>{description}</Typography.Paragraph>
                <Typography.Paragraph type="secondary">
                    {t("PublishDataSet.modal.identifier", {defaultValue: "Data set identifier"})}: <strong>{identifier}</strong>
                </Typography.Paragraph>
                <PublishStatusNotice loading={loading} failed={failed} published={status?.published ?? null}
                                     publishedMessage={t("PublishDataSet.modal.status.published", {
                                         defaultValue: "Data set {{identifier}} exists in Vempain Admin; this run replaces its content",
                                         identifier
                                     })}/>
                <Form form={form} layout="vertical" initialValues={{acls: []}}>
                    {open && <PublishAclEditor/>}
                </Form>
            </Modal>
    );
}
