import {Button, Col, Form, Row, Select, Spin, Switch} from "antd";
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import type {AclVO, UnitVO, UserVO} from "@vempain/vempain-auth-frontend";
import {useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {adminUnitAPI, adminUserAPI} from "../../services";

export function AclEditor({initialAcls}: { initialAcls: AclVO[] }) {
    const {t} = useTranslation();
    const [users, setUsers] = useState<UserVO[]>([]);
    const [units, setUnits] = useState<UnitVO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            adminUserAPI.findPageable({page: 0, size: 200, sort_by: "name", direction: "ASC", case_sensitive: false}),
            adminUnitAPI.findPageable({page: 0, size: 200, sort_by: "name", direction: "ASC", case_sensitive: false})
        ])
                .then(([userResponse, unitResponse]) => {
                    setUsers(userResponse.content ?? []);
                    setUnits(unitResponse.content ?? []);
                })
                .catch(() => {
                    setUsers([]);
                    setUnits([]);
                })
                .finally(() => setLoading(false));
    }, []);

    if (loading) return <Spin size="small"/>;
    return <Form.List name="acls" initialValue={initialAcls}>
        {(fields, {add, remove}) => <SpaceRows fields={fields} add={add} remove={remove} users={users} units={units} t={t}/>}
    </Form.List>;
}

interface SpaceRowsProps {
    fields: { key: number; name: number }[];
    add: (defaultValue?: Partial<AclVO>) => void;
    remove: (index: number) => void;
    users: UserVO[];
    units: UnitVO[];
    t: ReturnType<typeof useTranslation>["t"];
}

function SpaceRows({fields, add, remove, users, units, t}: SpaceRowsProps) {
    return <>
        {fields.map(field => <Row gutter={8} align="middle" key={field.key}>
            <Col flex="1"><Form.Item name={[field.name, "user"]}><Select allowClear placeholder={t("Users.acl.user", {defaultValue: "User"})}
                                                                         options={users.map(user => ({
                                                                             value: user.id,
                                                                             label: `${user.name} (${user.login_name})`
                                                                         }))}/></Form.Item></Col>
            <Col flex="1"><Form.Item name={[field.name, "unit"]}><Select allowClear placeholder={t("Units.acl.unit", {defaultValue: "Unit"})}
                                                                         options={units.map(unit => ({value: unit.id, label: unit.name}))}/></Form.Item></Col>
            {(["create_privilege", "read_privilege", "modify_privilege", "delete_privilege"] as const).map(privilege =>
                    <Col key={privilege}><Form.Item name={[field.name, privilege]} valuePropName="checked"><Switch/></Form.Item></Col>)}
            <Col><Button type="text" danger icon={<MinusCircleOutlined/>} onClick={() => remove(field.name)}/></Col>
        </Row>)}
        <Button type="dashed" block icon={<PlusOutlined/>} onClick={() => add({
            user: null, unit: null, create_privilege: false, read_privilege: true, modify_privilege: false, delete_privilege: false
        })}>{t("Common.modal.addPermission", {defaultValue: "Add permission"})}</Button>
    </>;
}
