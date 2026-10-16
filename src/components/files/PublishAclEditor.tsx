import {Alert, Form, Spin, Typography} from "antd";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {type AclGranteeOption, AclRowsEditor} from "@vempain/vempain-auth-frontend";
import {publishAPI} from "../../services";
import {PUBLISH_ACL_FIELD} from "../../tools/publishAcl";

/**
 * Lets the user grant additional admin-backend users and units privileges on the resources a publish creates. Must be rendered inside
 * the publish form; it owns the "acls" Form.List through the shared AclRowsEditor of vempain-auth-frontend. The grantees are admin
 * accounts and units fetched through the file backend (GET /publish/users and /publish/units), never this service's own users. The
 * publishing service account always keeps every privilege, so this only ever adds.
 */
export function PublishAclEditor() {
    const {t} = useTranslation();
    const form = Form.useFormInstance();
    const [users, setUsers] = useState<AclGranteeOption[]>([]);
    const [units, setUnits] = useState<AclGranteeOption[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [loadFailed, setLoadFailed] = useState<boolean>(false);

    useEffect(() => {
        let active = true;
        Promise.all([publishAPI.getPublishUsers(), publishAPI.getPublishUnits()])
                .then(([userList, unitList]) => {
                    if (!active) return;
                    setUsers((userList ?? []).map(user => ({value: user.id, label: `${user.name} (${user.login_name})`})));
                    setUnits((unitList ?? []).map(unit => ({value: unit.id, label: unit.name})));
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

    return (
            <>
                <Typography.Title level={5} style={{marginTop: 16}}>
                    {t("PublishFileGroup.modal.acl.title", {defaultValue: "Additional admin users and units"})}
                </Typography.Title>
                <Typography.Paragraph type="secondary">
                    {t("PublishFileGroup.modal.acl.hint", {
                        defaultValue: "The publishing service account keeps every privilege. Grant other admin users or units access to the published files and gallery here."
                    })}
                </Typography.Paragraph>
                {loading && <Spin size="small"/>}
                {loadFailed && <Alert type="warning" showIcon
                                      title={t("PublishFileGroup.modal.acl.loadError", {defaultValue: "Could not load the admin users and units"})}/>}
                {!loading && !loadFailed && (
                        <AclRowsEditor form={form} fieldName={PUBLISH_ACL_FIELD} users={users} units={units}
                                       userField="user_id" unitField="unit_id" uniqueGrantees rowTestId="publish-acl-row"/>
                )}
            </>
    );
}
