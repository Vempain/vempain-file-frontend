/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, no-var, react-hooks/rules-of-hooks */
// @ts-nocheck
import React from "react";
import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {
    aclAPI,
    adminScheduleAPI,
    archiveFileAPI,
    audioFileAPI,
    binaryFileAPI,
    dataFileAPI,
    documentFileAPI,
    executableFileAPI,
    fontFileAPI,
    iconFileAPI,
    imageFileAPI,
    interactiveFileAPI,
    musicFileAPI,
    tagAPI,
    thumbFileAPI,
    unitAPI,
    userAPI,
    vectorFileAPI,
    videoFileAPI
} from "../../services";
import {message} from "antd";
import {FilePermissions} from "../../components/management/FilePermissions";
import {Units} from "../../components/management/Units";
import {UnitEdit} from "../../components/management/UnitEdit";
import {Users} from "../../components/management/Users";
import {UserEdit} from "../../components/management/UserEdit";
import {FileImports} from "../../components/schedules/FileImports";
import {Publishing} from "../../components/schedules/Publishing";
import {SystemSchedules} from "../../components/schedules/SystemSchedules";
import {TagCreate} from "../../components/tags/TagCreate";
import {TagEdit} from "../../components/tags/TagEdit";
import {Account} from "../../components/user/Account";
import {ChangePassword} from "../../components/user/ChangePassword";
import {TopBar} from "../../main/TopBar";
import {SearchFiles} from "../../components/files/SearchFiles";

var axiosMock = {defaults: {headers: {get: {}, post: {}, put: {}, delete: {}}}, get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};
const authSession = {userSession: {id: 7}, getSessionLanguage: () => "en", setSessionLanguage: jest.fn()};

jest.mock("@vempain/vempain-auth-frontend", () => {
    const R = jest.requireActual("react") as typeof React;
    class AbstractAPI {
        axiosInstance = axiosMock;

        constructor(_base: string, _member: string) {
        }

        findAll = async (params?: unknown) => (await axiosMock.get("", {params})).data;
        findPageable = async (params?: unknown) => (await axiosMock.post("paged", params)).data;
        findById = async (id: number, suffix = "") => (await axiosMock.get(`/${id}${suffix}`)).data;
        create = async (payload: unknown) => (await axiosMock.post("", payload)).data;
        update = async (payload: unknown) => (await axiosMock.put("", payload)).data;
    }

    function usePagedTable(fetcher: (request: unknown) => Promise<any>, options: any = {}) {
        const [dataSource, setDataSource] = R.useState<any[]>([]);
        const [loading, setLoading] = R.useState(true);
        const [reloadToken, setReloadToken] = R.useState(0);
        R.useEffect(() => {
            setLoading(true);
            fetcher({
                page: 0,
                size: options.defaultPageSize ?? 10,
                ...(options.defaultSortBy ? {sort_by: options.defaultSortBy, direction: "ASC"} : {})
            }).then(response => {
                setDataSource(response?.content ?? []);
                setLoading(false);
            }).catch(() => setLoading(false));
        }, [options.defaultPageSize, options.defaultSortBy, reloadToken]);
        const handleTableChange = (pagination: any) => {
            setLoading(true);
            fetcher({
                page: (pagination.current ?? 1) - 1,
                size: pagination.pageSize ?? options.defaultPageSize ?? 10,
                ...(options.defaultSortBy ? {sort_by: options.defaultSortBy, direction: "ASC"} : {})
            }).then(response => {
                setDataSource(response?.content ?? []);
                setLoading(false);
            }).catch(() => setLoading(false));
        };
        return {
            dataSource,
            loading,
            pagination: {},
            handleTableChange,
            reload: () => setReloadToken(value => value + 1),
            contextHolder: null
        };
    }

    const VempainTable = ({paged, columns = []}: any) => <div data-testid="table">
        {paged.dataSource.map((row: any) => <div key={row.id}>
            {columns.map((column: any) => <span key={column.key}>
                {column.render ? column.render(row[column.dataIndex], row) : String(row[column.dataIndex] ?? "")}
            </span>)}
        </div>)}
        <button onClick={() => paged.handleTableChange({current: 2, pageSize: 20})}>next page</button>
        <button onClick={() => paged.handleTableChange({})}>default page</button>
    </div>;

    class UserAPI extends AbstractAPI {
        update = async (payload: any) => (await axiosMock.put(`/${payload.id}`, payload)).data;
    }

    class UnitAPI extends AbstractAPI {
        update = async (payload: any) => (await axiosMock.put(`/${payload.id}`, payload)).data;
    }

    class AclAPI extends AbstractAPI {
        getAll = async () => (await axiosMock.get("", {params: undefined})).data;
    }

    // The shared management screens are tested in the library; here they are stand-ins that expose their callbacks
    const UserList = ({onEdit, onCreate}: any) => <div data-testid="shared-user-list">
        <button onClick={() => onEdit(5)}>edit user</button>
        <button onClick={onCreate}>create user</button>
    </div>;
    const UnitList = ({onEdit, onCreate}: any) => <div data-testid="shared-unit-list">
        <button onClick={() => onEdit(3)}>edit unit</button>
        <button onClick={onCreate}>create unit</button>
    </div>;
    const UserEditor = ({userId, currentUserId, onSaved, onCancel}: any) => <div data-testid="shared-user-editor">
        user {userId} by {String(currentUserId)}
        <button onClick={() => onSaved({id: userId})}>saved user</button>
        <button onClick={onCancel}>cancel user</button>
    </div>;
    const UnitEditor = ({unitId, currentUserId, onSaved, onCancel}: any) => <div data-testid="shared-unit-editor">
        unit {unitId} by {String(currentUserId)}
        <button onClick={() => onSaved({id: unitId})}>saved unit</button>
        <button onClick={onCancel}>cancel unit</button>
    </div>;
    const validateParamId = (paramId?: string) => paramId === undefined || paramId.length === 0 ? -1 : (Number.isNaN(parseInt(paramId)) ? 0 : parseInt(paramId));
    return {
        AbstractAPI,
        UserAPI,
        UnitAPI,
        AclAPI,
        UserList,
        UnitList,
        UserEditor,
        UnitEditor,
        validateParamId,
        useSession: () => authSession,
        usePagedTable,
        VempainTable
    };
}, {virtual: true});

const mockTranslate = (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key;
jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: mockTranslate})
}));

const navigate = jest.fn();
let routeParams: Record<string, string> = {tagId: "1"};
jest.mock("react-router-dom", () => ({
    useNavigate: () => navigate,
    useParams: () => routeParams,
    NavLink: ({children, to}: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>
}));

jest.mock("@ant-design/icons", () => new Proxy({}, {get: () => () => <span/>}));

jest.mock("antd", () => {
    const R = jest.requireActual("react") as typeof React;
    const Ctx = R.createContext<any>(null);
    const passthrough = ({children, ...props}: any) => <div {...props}>{children}</div>;
    const Input = ({onPressEnter, ...props}: any) => <input {...props} onKeyDown={event => event.key === "Enter" && onPressEnter?.(event)}/>;
    Input.Password = Input;
    Input.TextArea = (props: any) => <textarea {...props}/>;
    const Button = ({children, onClick, htmlType, ...props}: any) =>
            <button type={htmlType === "submit" ? "submit" : "button"} onClick={onClick} {...props}>{children}</button>;
    const Form = ({children, onFinish, form: supplied}: any) => {
        const own = R.useMemo(() => ({
            values: {}, validators: [], setFieldsValue(v: any) {
                Object.assign(this.values, v);
            }, resetFields() {
                this.values = {};
            }
        }), []);
        const form = supplied ?? own;
        return <Ctx.Provider value={form}>
            <form onSubmit={event => {
                event.preventDefault();
                form.validators?.forEach(({name, rule}: any) => {
                    try {
                        const result = rule({getFieldValue: (field: string) => form.values[field]});
                        result?.validator?.({}, form.values[name])?.catch?.(() => undefined);
                    } catch { /* validation is exercised without blocking this lightweight form */
                    }
                });
                onFinish?.(form.values);
            }}>{children}</form>
        </Ctx.Provider>;
    };
    Form.useForm = () => {
        const form = R.useMemo(() => ({
            values: {}, validators: [], setFieldsValue(v: any) {
                Object.assign(this.values, v);
            }, resetFields() {
                this.values = {};
            }
        }), []);
        return [form];
    };
    Form.Item = ({children, label, name, rules}: any) => {
        const form = R.useContext(Ctx);
        if (name && rules && form) rules.filter((rule: any) => typeof rule === "function").forEach((rule: any) => {
            if (!form.validators.some((item: any) => item.name === name && item.rule === rule)) form.validators.push({name, rule});
        });
        const child = R.isValidElement(children) ? R.cloneElement(children, {
            value: name ? form?.values[name] ?? "" : undefined,
            onChange: (event: any) => {
                if (name && form) form.values[name] = event?.target?.value ?? event;
                children.props?.onChange?.(event);
            }
        }) : children;
        return <label>{label}{child}</label>;
    };
    Form.List = ({children, initialValue}: any) => {
        const [fields, setFields] = R.useState((initialValue ?? []).map((_: any, name: number) => ({key: name, name})));
        return children(fields, {
            add: () => setFields((old: any[]) => [...old, {key: old.length, name: old.length}]),
            remove: (name: number) => setFields((old: any[]) => old.filter(field => field.name !== name))
        });
    };
    const Table = ({columns = [], dataSource = [], onChange, rowKey}: any) =>
            <div data-testid="table">
                <div>{columns.map((column: any) => <span key={column.key}>{column.title}</span>)}</div>
                {dataSource.map((record: any, row: number) => <div
                        key={typeof rowKey === "function" ? rowKey(record) : record[rowKey] ?? record.id ?? record.acl_id ?? row}>
                    {columns.map((column: any) => <span
                            key={column.key}>{column.render ? column.render(record[column.dataIndex], record) : String(record[column.dataIndex] ?? "")}</span>)}
                </div>)}
                {onChange && <>
                    <button onClick={() => onChange({current: 2, pageSize: 20})}>next page</button>
                    <button onClick={() => onChange({})}>default page</button>
                </>}
            </div>;
    const Select = ({options = [], value, onChange, ...props}: any) =>
            <select value={value} onChange={event => onChange?.(event.target.value)} {...props}>
                {options.map((option: any) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>;
    const InputNumber = ({value, onChange, ...props}: any) => <input type="number" value={value}
                                                                     onChange={event => onChange?.(event.target.value === "" ? null : Number(event.target.value))} {...props}/>;
    const Modal = ({open, title, children, onOk, onCancel}: any) => <div role={open ? "dialog" : undefined} hidden={!open}>{open && <h2>{title}</h2>}{children}{
        <Button onClick={onOk}>OK</Button>}<Button onClick={onCancel}>Cancel</Button></div>;
    const Menu = ({items = [], onClick}: any) => <div role="menu">{items.map((item: any) => <div key={item.key}>
        <button onClick={() => {
            onClick?.({key: item.key});
            item.onClick?.();
        }}>{item.label}</button>
        {item.children && <Menu items={item.children} onClick={onClick}/>}</div>)}</div>;
    const Drawer = ({open, children, onClose}: any) => open ? <div role="dialog"><Button onClick={onClose}>close drawer</Button>{children}</div> : null;
    const Grid = {useBreakpoint: () => ({md: !(globalThis as any).__mobile})};
    const message = {error: jest.fn(), success: jest.fn()};
    return {
        Alert: passthrough,
        Card: ({title, children}: any) => <section><h1>{title}</h1>{children}</section>,
        Button,
        Col: passthrough,
        Form,
        Input,
        InputNumber,
        Modal,
        Row: passthrough,
        Space: Object.assign(passthrough, {Compact: passthrough}),
        Spin: passthrough,
        Table,
        Select,
        Switch: (props: any) => <input type="checkbox" {...props}/>,
        Layout: {Header: passthrough},
        Grid,
        Menu,
        Drawer,
        Tooltip: passthrough,
        message
    };
});

jest.mock("@ant-design/charts", () => ({Column: () => <div/>, Line: () => <div/>}));
jest.mock("../../components/files/FileDetails", () => ({FileDetails: () => <div>details</div>}));
jest.mock("../../tools", () => ({
    formatByteSize: (value: number) => `${value} B`,
    formatDateWithTimeZone: (value: string | null) => value ?? "-",
    LanguageTool: {
        getLanguages: () => [{label: "Suomi 🇫🇮", value: "fi"}, {label: "English 🇬🇧", value: "en"}],
        getLabelByValue: (value: string) => value === "en" ? "English 🇬🇧" : "Suomi 🇫🇮"
    }
}));

const page = (content: any[] = []) => ({content, total_elements: content.length});
const user = {
    id: 7,
    name: "Alice",
    nick: "A",
    login_name: "alice",
    email: "alice@example.com",
    description: "",
    private_user: false,
    privacy_type: "PUBLIC",
    acls: []
};
const unit = {id: 4, name: "Team", description: "desc", acls: undefined, locked: false};
const tag = {id: 1, tag_name: "nature", tag_name_de: "Natur", tag_name_en: "Nature", tag_name_es: "", tag_name_fi: "", tag_name_sv: ""};

beforeEach(() => {
    cleanup();
    jest.restoreAllMocks();
    jest.clearAllMocks();
    routeParams = {tagId: "1"};
    (globalThis as any).__mobile = false;
    authSession.userSession = {id: 7};
    jest.spyOn(userAPI, "findPageable").mockResolvedValue(page([user]) as any);
    jest.spyOn(unitAPI, "findPageable").mockResolvedValue(page([unit]) as any);
});

describe("management components", () => {
    it("renders permissions from the file backend and reports load errors", async () => {
        jest.spyOn(aclAPI, "getAll").mockResolvedValue([
            {acl_id: 1, user: null, unit: 2, create_privilege: true, read_privilege: false, modify_privilege: true, delete_privilege: false},
            {acl_id: 2, user: 3, unit: null, create_privilege: false, read_privilege: true, modify_privilege: false, delete_privilege: true}
        ] as any);
        render(<FilePermissions/>);
        await waitFor(() => expect(screen.getAllByText("✓").length).toBeGreaterThan(0));
        expect(screen.getAllByText("—").length).toBeGreaterThan(0);
        jest.spyOn(aclAPI, "getAll").mockRejectedValueOnce(new Error("bad"));
        render(<FilePermissions/>);
        await waitFor(() => expect(message.error).toHaveBeenCalled());
    });

    it("hosts the shared unit list and editor on the file backend routes", async () => {
        render(<Units/>);
        fireEvent.click(screen.getByText("edit unit"));
        expect(navigate).toHaveBeenCalledWith("/management/units/3/edit");
        fireEvent.click(screen.getByText("create unit"));
        expect(navigate).toHaveBeenCalledWith("/management/units/0/edit");

        routeParams = {paramId: "3"};
        cleanup();
        render(<UnitEdit/>);
        expect(screen.getByText("unit 3 by 7")).toBeTruthy();
        fireEvent.click(screen.getByText("saved unit"));
        expect(navigate).toHaveBeenLastCalledWith("/management/units");
        fireEvent.click(screen.getByText("cancel unit"));
        expect(navigate).toHaveBeenLastCalledWith("/management/units");

        // An unparsable id falls back to creating a new unit
        routeParams = {paramId: "abc"};
        cleanup();
        render(<UnitEdit/>);
        expect(screen.getByText("unit 0 by 7")).toBeTruthy();
    });

    it("hosts the shared user list and editor on the file backend routes", async () => {
        render(<Users/>);
        fireEvent.click(screen.getByText("edit user"));
        expect(navigate).toHaveBeenCalledWith("/management/users/5/edit");
        fireEvent.click(screen.getByText("create user"));
        expect(navigate).toHaveBeenCalledWith("/management/users/0/edit");

        routeParams = {paramId: "5"};
        cleanup();
        render(<UserEdit/>);
        expect(screen.getByText("user 5 by 7")).toBeTruthy();
        fireEvent.click(screen.getByText("saved user"));
        expect(navigate).toHaveBeenLastCalledWith("/management/users");
    });
});

describe("schedule components", () => {
    it("loads file imports and handles errors", async () => {
        jest.spyOn(adminScheduleAPI, "getFileImportSchedules").mockResolvedValue([
            {id: 1, source_directory: "/in", destination_directory: "/out", generate_gallery: true, generate_page: false},
            {id: 2, source_directory: "/in2", destination_directory: "/out2", generate_gallery: false, generate_page: true}
        ]);
        render(<FileImports/>);
        await waitFor(() => expect(screen.getByText("/in")).toBeTruthy());
        jest.spyOn(adminScheduleAPI, "getFileImportSchedules").mockRejectedValueOnce(new Error("bad"));
        render(<FileImports/>);
        await waitFor(() => expect(message.error).toHaveBeenCalled());
    });

    it("triggers publishing schedules on success and failure", async () => {
        const publishing = {
            id: 1,
            publish_time: "2024-01-01T00:00:00Z",
            publish_status: "READY",
            publish_message: "Publish now",
            publish_type: "ALL",
            publish_id: 2
        };
        jest.spyOn(adminScheduleAPI, "getPublishingSchedules").mockResolvedValue([publishing]);
        jest.spyOn(adminScheduleAPI, "triggerPublishingSchedule").mockResolvedValue(publishing);
        render(<Publishing/>);
        fireEvent.click(screen.getAllByText("OK", {hidden: true})[0]);
        await waitFor(() => expect(screen.getByText("Publish now")).toBeTruthy());
        fireEvent.click(screen.getByText("Trigger"));
        fireEvent.click(screen.getByText("OK"));
        await waitFor(() => expect(adminScheduleAPI.triggerPublishingSchedule).toHaveBeenCalledWith(publishing));
        (adminScheduleAPI.triggerPublishingSchedule as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByText("Trigger"));
        fireEvent.click(screen.getByText("OK"));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
    });

    it("triggers system schedules with a delay and handles load errors", async () => {
        const schedule = {id: 1, schedule_name: "Nightly", status: "IDLE"};
        jest.spyOn(adminScheduleAPI, "getSystemSchedules").mockResolvedValue([schedule]);
        jest.spyOn(adminScheduleAPI, "triggerSystemSchedule").mockResolvedValue(schedule);
        render(<SystemSchedules/>);
        fireEvent.click(screen.getAllByText("OK", {hidden: true})[0]);
        await waitFor(() => expect(screen.getByText("Nightly")).toBeTruthy());
        fireEvent.click(screen.getByText("Trigger"));
        fireEvent.change(screen.getByRole("spinbutton"), {target: {value: ""}});
        fireEvent.change(screen.getByRole("spinbutton"), {target: {value: "5"}});
        fireEvent.click(screen.getByText("OK"));
        await waitFor(() => expect(adminScheduleAPI.triggerSystemSchedule).toHaveBeenCalledWith({schedule_name: "Nightly", delay: 5}));
        (adminScheduleAPI.triggerSystemSchedule as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByText("Trigger"));
        fireEvent.click(screen.getByText("OK"));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
    });
});

describe("tag and account components", () => {
    it("creates tags and handles cancellation/errors", async () => {
        jest.spyOn(tagAPI, "create").mockResolvedValue(tag as any);
        render(<TagCreate/>);
        fireEvent.click(screen.getByText("Create"));
        await waitFor(() => expect(tagAPI.create).toHaveBeenCalled());
        fireEvent.click(screen.getByText("Cancel"));
        (tagAPI.create as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByText("Create"));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
    });

    it("loads, edits and validates tags", async () => {
        jest.spyOn(tagAPI, "findById").mockResolvedValue(tag as any);
        jest.spyOn(tagAPI, "update").mockResolvedValue(tag as any);
        render(<TagEdit/>);
        await waitFor(() => expect(tagAPI.findById).toHaveBeenCalledWith(1, null));
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(tagAPI.update).toHaveBeenCalled());
        fireEvent.click(screen.getByText("Cancel"));
        (tagAPI.findById as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        render(<TagEdit/>);
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        routeParams = {tagId: "bad"};
        render(<TagEdit/>);
        await waitFor(() => expect(message.error).toHaveBeenCalled());
    });

    it("loads account with and without a session and saves success/error", async () => {
        jest.spyOn(userAPI, "findById").mockResolvedValue(user as any);
        jest.spyOn(userAPI, "update").mockResolvedValue(user as any);
        render(<Account/>);
        await waitFor(() => expect(userAPI.findById).toHaveBeenCalledWith(7, null));
        await waitFor(() => expect(screen.getByDisplayValue("Alice")).toBeTruthy());
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(userAPI.update).toHaveBeenCalled());
        (userAPI.update as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        authSession.userSession = undefined;
        cleanup();
        render(<Account/>);
        fireEvent.click(screen.getByText("Save"));
        expect(userAPI.findById).toHaveBeenCalledTimes(1);
        authSession.userSession = {id: 7};
        (userAPI.findById as jest.Mock).mockRejectedValueOnce(new Error("load"));
        cleanup();
        render(<Account/>);
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        (userAPI.findById as jest.Mock).mockResolvedValueOnce({...user, acls: undefined} as any);
        cleanup();
        render(<Account/>);
        await waitFor(() => expect(screen.getByDisplayValue("Alice")).toBeTruthy());
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(userAPI.update).toHaveBeenCalled());
    });

    it("changes password and handles both lookup and update errors", async () => {
        jest.spyOn(userAPI, "findById").mockResolvedValue({...user, acls: undefined} as any);
        jest.spyOn(userAPI, "update").mockResolvedValue(user as any);
        render(<ChangePassword/>);
        fireEvent.click(screen.getByRole("button", {name: "Change password"}));
        await waitFor(() => expect(userAPI.update).toHaveBeenCalled());
        const passwordFields = screen.getAllByRole("textbox");
        fireEvent.change(passwordFields[0], {target: {value: "Abcdefghij1!"}});
        fireEvent.change(passwordFields[1], {target: {value: "different"}});
        fireEvent.click(screen.getByRole("button", {name: "Change password"}));
        (userAPI.findById as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByRole("button", {name: "Change password"}));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        (userAPI.findById as jest.Mock).mockResolvedValueOnce(user as any);
        (userAPI.update as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByRole("button", {name: "Change password"}));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        authSession.userSession = undefined;
        cleanup();
        render(<ChangePassword/>);
        fireEvent.click(screen.getByRole("button", {name: "Change password"}));
        expect(userAPI.findById).toHaveBeenCalledTimes(4);
    });
});

describe("search and navigation components", () => {
    it("searches a selected file type and all file APIs, and opens details", async () => {
        const file = {
            id: 1,
            external_file_id: "x",
            filename: "photo.jpg",
            file_path: "/photo.jpg",
            filesize: 3,
            mimetype: "image/jpeg",
            file_type: "image",
            created: "2024-01-01"
        };
        const apis = [archiveFileAPI, audioFileAPI, binaryFileAPI, dataFileAPI, documentFileAPI, executableFileAPI, fontFileAPI, iconFileAPI, imageFileAPI, interactiveFileAPI, musicFileAPI, thumbFileAPI, vectorFileAPI, videoFileAPI];
        apis.forEach(api => jest.spyOn(api, "findAllPageable").mockResolvedValue({content: [file]} as any));
        render(<SearchFiles/>);
        fireEvent.click(screen.getByText("Search"));
        await waitFor(() => expect(screen.getAllByText("photo.jpg").length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByText("photo.jpg")[0]);
        expect(screen.getByText("details")).toBeTruthy();
        (imageFileAPI.findAllPageable as jest.Mock).mockResolvedValueOnce({content: [{...file, external_file_id: undefined}]} as any);
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "image"}});
        fireEvent.change(screen.getByPlaceholderText("Search filename, path or metadata"), {target: {value: "  photo "}});
        fireEvent.keyDown(screen.getByPlaceholderText("Search filename, path or metadata"), {key: "Enter"});
        await waitFor(() => expect(imageFileAPI.findAllPageable).toHaveBeenCalledWith(expect.objectContaining({search: "photo"})));
        apis.forEach(api => (api.findAllPageable as jest.Mock).mockRejectedValueOnce(new Error("bad")));
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "all"}});
        fireEvent.click(screen.getByText("Cancel"));
        fireEvent.click(screen.getByText("Search"));
        await waitFor(() => expect(imageFileAPI.findAllPageable).toHaveBeenCalledTimes(3));
        (imageFileAPI.findAllPageable as jest.Mock).mockResolvedValueOnce({} as any);
        fireEvent.change(screen.getByRole("combobox"), {target: {value: "image"}});
        fireEvent.click(screen.getByText("Search"));
        await waitFor(() => expect(imageFileAPI.findAllPageable).toHaveBeenCalled());
    });

    it("shows desktop and mobile authenticated navigation", () => {
        render(<TopBar/>);
        expect(screen.getAllByRole("menu").length).toBeGreaterThan(0);
        expect(screen.getAllByText("English 🇬🇧").length).toBeGreaterThan(0);
        (globalThis as any).__mobile = true;
        cleanup();
        render(<TopBar/>);
        fireEvent.click(screen.getByLabelText("TopBar.a11y.openMenu"));
        expect(screen.getByRole("dialog")).toBeTruthy();
        fireEvent.click(screen.getAllByText("English 🇬🇧").at(-1)!);
        expect(authSession.setSessionLanguage).toHaveBeenCalledWith("en");
        fireEvent.click(screen.getByText("close drawer"));
        authSession.userSession = undefined;
        cleanup();
        render(<TopBar/>);
        fireEvent.click(screen.getByLabelText("TopBar.a11y.openMenu"));
        expect(screen.getByText("TopBar.menu.auth.login")).toBeTruthy();
    });
});
