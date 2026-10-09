import {Alert, Button, Col, Form, Row, Select, Spin, Switch, Typography} from "antd";
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {publishAPI} from "../../services";
import type {PublishUserResponse} from "../../models";
import {PUBLISH_ACL_FIELD, PUBLISH_PRIVILEGES, type PublishAclRow, type PublishPrivilege} from "../../tools/publishAcl";

/**
 * Lets the user grant additional admin-backend users privileges on the resources a publish creates. Must be rendered inside the
 * publish form; it owns the "acls" Form.List. The publishing service account always keeps every privilege, so this only ever adds.
 */
export function PublishAclEditor() {
    const {t} = useTranslation();
    const form = Form.useFormInstance();
    const rows = (Form.useWatch(PUBLISH_ACL_FIELD, form) ?? []) as PublishAclRow[];
    const [users, setUsers] = useState<PublishUserResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadFailed, setLoadFailed] = useState<boolean>(false);

    useEffect(() => {
        let active = true;
        publishAPI.getPublishUsers()
                .then(list => {
                    if (active) setUsers(list ?? []);
                })
                .catch(() => {
                    if (active) setLoadFailed(true);
                })
                .finally(() => {
                    if (active) setLoading(false);
                });
        return () => {
            active = false;
        };
    }, []);

    const privilegeLabel: Record<PublishPrivilege, string> = {
        read_privilege: t("PublishFileGroup.modal.acl.read", {defaultValue: "Read"}),
        create_privilege: t("PublishFileGroup.modal.acl.create", {defaultValue: "Create"}),
        modify_privilege: t("PublishFileGroup.modal.acl.modify", {defaultValue: "Modify"}),
        delete_privilege: t("PublishFileGroup.modal.acl.delete", {defaultValue: "Delete"})
    };

    function optionsFor(rowIndex: number) {
        const chosenElsewhere = new Set(rows.filter((_, index) => index !== rowIndex)
                .map(row => row?.user_id)
                .filter((id): id is number => typeof id === "number"));
        return users.filter(user => !chosenElsewhere.has(user.id))
                .map(user => ({value: user.id, label: `${user.name} (${user.login_name})`}));
    }

    return (
            <>
                <Typography.Title level={5} style={{marginTop: 16}}>
                    {t("PublishFileGroup.modal.acl.title", {defaultValue: "Additional admin users"})}
                </Typography.Title>
                <Typography.Paragraph type="secondary">
                    {t("PublishFileGroup.modal.acl.hint", {
                        defaultValue: "The publishing service account keeps every privilege. Grant other admin users access to the published files and gallery here."
                    })}
                </Typography.Paragraph>
                {loading && <Spin size="small"/>}
                {loadFailed && <Alert type="warning" showIcon
                                      title={t("PublishFileGroup.modal.acl.loadError", {defaultValue: "Could not load the admin users"})}/>}
                {!loading && !loadFailed && (
                        <Form.List name={PUBLISH_ACL_FIELD}>
                            {(fields, {add, remove}) => (
                                    <>
                                        {fields.map(field => (
                                                <Row gutter={8} align="middle" key={field.key} data-testid="publish-acl-row">
                                                    <Col flex="1">
                                                        <Form.Item
                                                                name={[field.name, "user_id"]}
                                                                dependencies={PUBLISH_PRIVILEGES.map(privilege => [PUBLISH_ACL_FIELD, field.name, privilege])}
                                                                rules={[
                                                                    {
                                                                        required: true,
                                                                        message: t("PublishFileGroup.modal.acl.userRequired", {defaultValue: "Select a user"})
                                                                    },
                                                                    {
                                                                        validator: () => {
                                                                            const row = form.getFieldValue([PUBLISH_ACL_FIELD, field.name]) as PublishAclRow | undefined;
                                                                            return PUBLISH_PRIVILEGES.some(privilege => row?.[privilege])
                                                                                    ? Promise.resolve()
                                                                                    : Promise.reject(new Error(t("PublishFileGroup.modal.acl.privilegeRequired",
                                                                                            {defaultValue: "Grant at least one privilege"})));
                                                                        }
                                                                    }
                                                                ]}
                                                        >
                                                            <Select
                                                                    showSearch
                                                                    optionFilterProp="label"
                                                                    placeholder={t("PublishFileGroup.modal.acl.userPlaceholder", {defaultValue: "Select admin user"})}
                                                                    options={optionsFor(field.name)}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    {PUBLISH_PRIVILEGES.map(privilege => (
                                                            <Col key={privilege}>
                                                                <Form.Item name={[field.name, privilege]} valuePropName="checked"
                                                                           label={privilegeLabel[privilege]}
                                                                           layout="vertical">
                                                                    <Switch size="small"/>
                                                                </Form.Item>
                                                            </Col>
                                                    ))}
                                                    <Col>
                                                        <Button type="text" danger icon={<MinusCircleOutlined/>} onClick={() => remove(field.name)}
                                                                aria-label={t("PublishFileGroup.modal.acl.remove", {defaultValue: "Remove"})}/>
                                                    </Col>
                                                </Row>
                                        ))}
                                        <Button type="dashed" block icon={<PlusOutlined/>} disabled={users.length === 0 || fields.length >= users.length}
                                                onClick={() => add({
                                                    user_id: null,
                                                    read_privilege: true,
                                                    create_privilege: false,
                                                    modify_privilege: false,
                                                    delete_privilege: false
                                                })}>
                                            {t("PublishFileGroup.modal.acl.add", {defaultValue: "Add admin user"})}
                                        </Button>
                                    </>
                            )}
                        </Form.List>
                )}
            </>
    );
}
