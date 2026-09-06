import {Alert, message, Space, Spin, Table} from "antd";
import type {ColumnsType} from "antd/es/table";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import type {AdminAclResponse} from "../../services/AdminAclAPI";
import {adminAclAPI} from "../../services";

export function FilePermissions() {
    const {t} = useTranslation();
    const [permissions, setPermissions] = useState<AdminAclResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminAclAPI.getAll()
                .then(setPermissions)
                .catch(error => message.error(t("FilePermissions.messages.fetchError", {
                    defaultValue: "Failed to load permissions", error: String(error)
                })))
                .finally(() => setLoading(false));
    }, [t]);

    const columns: ColumnsType<AdminAclResponse> = [
        {title: t("FilePermissions.columns.acl_id", {defaultValue: "ACL ID"}), dataIndex: "acl_id", key: "acl_id"},
        {title: t("FilePermissions.columns.user", {defaultValue: "User ID"}), dataIndex: "user", key: "user", render: value => value ?? "-"},
        {title: t("FilePermissions.columns.unit", {defaultValue: "Unit ID"}), dataIndex: "unit", key: "unit", render: value => value ?? "-"},
        {
            title: t("FilePermissions.columns.create", {defaultValue: "Create"}),
            dataIndex: "create_privilege",
            key: "create_privilege",
            render: value => value ? "✓" : "—"
        },
        {
            title: t("FilePermissions.columns.read", {defaultValue: "Read"}),
            dataIndex: "read_privilege",
            key: "read_privilege",
            render: value => value ? "✓" : "—"
        },
        {
            title: t("FilePermissions.columns.modify", {defaultValue: "Modify"}),
            dataIndex: "modify_privilege",
            key: "modify_privilege",
            render: value => value ? "✓" : "—"
        },
        {
            title: t("FilePermissions.columns.delete", {defaultValue: "Delete"}),
            dataIndex: "delete_privilege",
            key: "delete_privilege",
            render: value => value ? "✓" : "—"
        }
    ];

    return <Space direction="vertical" style={{width: "95%", margin: 30}} size="large">
        <h1>{t("FilePermissions.title", {defaultValue: "File permissions"})}</h1>
        <Alert type="info" showIcon message={t("FilePermissions.info", {
            defaultValue: "Permissions are managed centrally in the administration service."
        })}/>
        <Spin spinning={loading}>
            <Table rowKey="acl_id" columns={columns} dataSource={permissions} scroll={{x: "max-content"}}/>
        </Spin>
    </Space>;
}
