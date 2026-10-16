/* eslint-disable react-refresh/only-export-components -- Jest stand-in, not an application module */
/**
 * Stand-in for the `AclRowsEditor` of @vempain/vempain-auth-frontend (the package ships an ESM build that the test runtime cannot
 * load). The publish dialog tests install it with
 * `jest.mock("@vempain/vempain-auth-frontend", () => jest.requireActual("<relative path>/testUtils/mockAclRowsEditor"), {virtual: true})`.
 * It records its props in `aclRowsEditorMock` and offers one button that fills the host's list with a single row for the first user
 * (read + modify), so that the wrapper tests can submit a granted row. The editor itself (row rules, "All" button, unique grantees) is
 * tested in the library.
 */
import {Form, type FormInstance} from "antd";

export const ACL_ROW_PRIVILEGES = ["create_privilege", "read_privilege", "modify_privilege", "delete_privilege"] as const;
export type AclRowPrivilege = typeof ACL_ROW_PRIVILEGES[number];

export const ACL_ROW_TRANSLATION_DEFAULTS = {
    "AclRow.actions.add": "Add ACL",
    "AclRow.actions.remove": "Remove row",
    "AclRow.actions.grantAll": "Grant all privileges"
} as const;

export interface AclGranteeOption {
    value: number;
    label: string;
}

export interface AclRowPrivileges {
    create_privilege: boolean;
    read_privilege: boolean;
    modify_privilege: boolean;
    delete_privilege: boolean;
}

export type AclRowValues = AclRowPrivileges & Record<string, unknown>;

export interface AclRowsEditorProps {
    form: FormInstance;
    fieldName?: string;
    users: AclGranteeOption[];
    units?: AclGranteeOption[];
    userField?: string;
    unitField?: string;
    hiddenFields?: string[];
    initialValue?: AclRowPrivileges[];
    newRow?: () => AclRowPrivileges;
    uniqueGrantees?: boolean;
    addDisabled?: boolean;
    showHeader?: boolean;
    rowTestId?: string;
}

export function defaultAclRow(userField: string = "user", unitField: string = "unit"): AclRowValues {
    return {[userField]: null, [unitField]: null, create_privilege: false, read_privilege: true, modify_privilege: false, delete_privilege: false};
}

export const aclRowsEditorMock = jest.fn();

/** Child of the hidden item that registers the list with the form, so that validateFields() returns the rows written by the button */
function RegisteredField() {
    return null;
}

export function AclRowsEditor(props: AclRowsEditorProps) {
    aclRowsEditorMock(props);
    const {form, fieldName = "acls", users, userField = "user", unitField = "unit", rowTestId = "acl-row"} = props;
    return (
            <div data-testid="acl-rows-editor" data-row-testid={rowTestId}>
                <Form.Item name={fieldName} hidden><RegisteredField/></Form.Item>
                <button type="button" disabled={users.length === 0}
                        onClick={() => form.setFieldValue(fieldName, [{
                            [userField]: users[0].value, [unitField]: null,
                            create_privilege: false, read_privilege: true, modify_privilege: true, delete_privilege: false
                        }])}>
                    stub: grant first user
                </button>
            </div>
    );
}
