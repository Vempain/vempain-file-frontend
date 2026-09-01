/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/rules-of-hooks */
// @ts-nocheck
import React from "react";
import {cleanup, fireEvent, render, screen, waitFor} from "@testing-library/react";
import {
    adminAclAPI,
    adminScheduleAPI,
    adminUnitAPI,
    adminUserAPI,
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
    vectorFileAPI,
    videoFileAPI
} from "../../services";
import {message} from "antd";
import {AclEditor} from "../../components/management/AclEditor";
import {FilePermissions} from "../../components/management/FilePermissions";
import {Units} from "../../components/management/Units";
import {Users} from "../../components/management/Users";
import {FileImports} from "../../components/schedules/FileImports";
import {Publishing} from "../../components/schedules/Publishing";
import {SystemSchedules} from "../../components/schedules/SystemSchedules";
import {TagCreate} from "../../components/tags/TagCreate";
import {TagEdit} from "../../components/tags/TagEdit";
import {TagSearch} from "../../components/tags/TagSearch";
import {Account} from "../../components/user/Account";
import {ChangePassword} from "../../components/user/ChangePassword";
import {TopBar} from "../../main/TopBar";
import {SearchFiles} from "../../components/files/SearchFiles";

const axiosMock = {defaults: {headers: {get: {}, post: {}, put: {}, delete: {}}}, get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn()};
const authSession = {userSession: {id: 7}, getSessionLanguage: () => "en", setSessionLanguage: jest.fn()};

jest.mock("@vempain/vempain-auth-frontend", () => {
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

    return {AbstractAPI, useSession: () => authSession};
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
    jest.spyOn(adminUserAPI, "findPageable").mockResolvedValue(page([user]) as any);
    jest.spyOn(adminUnitAPI, "findPageable").mockResolvedValue(page([unit]) as any);
});

describe("management components", () => {
    it("loads ACL choices and supports add/remove, including failure", async () => {
        render(<AclEditor initialAcls={[{user: null, unit: null} as any]}/>);
        await waitFor(() => expect(screen.getByText("Add permission")).toBeTruthy());
        fireEvent.click(screen.getByText("Add permission"));
        expect(screen.getAllByRole("button").length).toBeGreaterThan(1);
        fireEvent.click(screen.getAllByRole("button")[0]);
        (adminUserAPI.findPageable as jest.Mock).mockRejectedValueOnce(new Error("no"));
        (adminUnitAPI.findPageable as jest.Mock).mockRejectedValueOnce(new Error("no"));
        render(<AclEditor initialAcls={[]}/>);
        await waitFor(() => expect(screen.queryByText("Add permission")).toBeTruthy());
        (adminUserAPI.findPageable as jest.Mock).mockResolvedValueOnce({} as any);
        (adminUnitAPI.findPageable as jest.Mock).mockResolvedValueOnce({} as any);
        cleanup();
        render(<AclEditor initialAcls={[]}/>);
        await waitFor(() => expect(screen.getByText("Add permission")).toBeTruthy());
    });

    it("renders permissions and reports load errors", async () => {
        jest.spyOn(adminAclAPI, "getAll").mockResolvedValue([
            {acl_id: 1, user: null, unit: 2, create_privilege: true, read_privilege: false, modify_privilege: true, delete_privilege: false},
            {acl_id: 2, user: 3, unit: null, create_privilege: false, read_privilege: true, modify_privilege: false, delete_privilege: true}
        ]);
        render(<FilePermissions/>);
        await waitFor(() => expect(screen.getAllByText("✓").length).toBeGreaterThan(0));
        expect(screen.getAllByText("—").length).toBeGreaterThan(0);
        jest.spyOn(adminAclAPI, "getAll").mockRejectedValueOnce(new Error("bad"));
        render(<FilePermissions/>);
        await waitFor(() => expect(message.error).toHaveBeenCalled());
    });

    it("creates and updates units through the form and handles errors", async () => {
        jest.spyOn(adminUnitAPI, "create").mockResolvedValue(unit as any);
        jest.spyOn(adminUnitAPI, "update").mockResolvedValue(unit as any);
        render(<Units/>);
        await waitFor(() => expect(screen.getByText("Team")).toBeTruthy());
        fireEvent.click(screen.getByText("default page"));
        fireEvent.click(screen.getAllByText("Save", {hidden: true})[0]);
        fireEvent.click(screen.getByText("Create unit"));
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(adminUnitAPI.create).toHaveBeenCalled());
        fireEvent.click(screen.getByText("Edit"));
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(adminUnitAPI.update).toHaveBeenCalled());
        (adminUnitAPI.create as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByText("Create unit"));
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        (adminUnitAPI.findPageable as jest.Mock).mockRejectedValue(new Error("load"));
        cleanup();
        render(<Units/>);
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        (adminUnitAPI.findPageable as jest.Mock).mockResolvedValue({});
        cleanup();
        render(<Units/>);
        await waitFor(() => expect(adminUnitAPI.findPageable).toHaveBeenCalled());
        fireEvent.click(screen.getAllByText("Cancel")[0]);
    });

    it("creates and updates users through the form and handles errors", async () => {
        jest.spyOn(adminUserAPI, "create").mockResolvedValue(user as any);
        jest.spyOn(adminUserAPI, "update").mockResolvedValue(user as any);
        render(<Users/>);
        await waitFor(() => expect(screen.getByText("Alice")).toBeTruthy());
        fireEvent.click(screen.getByText("default page"));
        fireEvent.click(screen.getAllByText("Save", {hidden: true})[0]);
        fireEvent.click(screen.getByText("Create user"));
        await waitFor(() => expect(screen.getByText("Save")).toBeTruthy());
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(adminUserAPI.create).toHaveBeenCalled());
        fireEvent.click(screen.getByText("Edit"));
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(adminUserAPI.update).toHaveBeenCalled());
        (adminUserAPI.update as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByText("Edit"));
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        (adminUserAPI.findPageable as jest.Mock).mockRejectedValue(new Error("load"));
        cleanup();
        render(<Users/>);
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        fireEvent.click(screen.getAllByText("Cancel")[0]);
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

    it("searches tags, handles empty/error responses and navigates to edit", async () => {
        jest.spyOn(tagAPI, "findPageable").mockResolvedValue(page([tag]) as any);
        render(<TagSearch/>);
        fireEvent.click(screen.getByText("Search"));
        await waitFor(() => expect(screen.getByText("nature")).toBeTruthy());
        fireEvent.click(screen.getByText("Edit"));
        expect(navigate).toHaveBeenCalledWith("/tags/1/edit");
        (tagAPI.findPageable as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.change(screen.getByPlaceholderText("Search tag names"), {target: {value: "  tree "}});
        fireEvent.keyDown(screen.getByPlaceholderText("Search tag names"), {key: "Enter"});
        await waitFor(() => expect(tagAPI.findPageable).toHaveBeenCalledWith(expect.objectContaining({search: "tree"})));
        await waitFor(() => expect(tagAPI.findPageable).toHaveBeenCalledTimes(2));
        (tagAPI.findPageable as jest.Mock).mockResolvedValueOnce({} as any);
        fireEvent.click(screen.getByText("Search"));
        await waitFor(() => expect(tagAPI.findPageable).toHaveBeenCalledTimes(3));
    });

    it("loads account with and without a session and saves success/error", async () => {
        jest.spyOn(adminUserAPI, "findById").mockResolvedValue(user as any);
        jest.spyOn(adminUserAPI, "update").mockResolvedValue(user as any);
        render(<Account/>);
        await waitFor(() => expect(adminUserAPI.findById).toHaveBeenCalledWith(7, null));
        await waitFor(() => expect(screen.getByDisplayValue("Alice")).toBeTruthy());
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(adminUserAPI.update).toHaveBeenCalled());
        (adminUserAPI.update as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        authSession.userSession = undefined;
        cleanup();
        render(<Account/>);
        fireEvent.click(screen.getByText("Save"));
        expect(adminUserAPI.findById).toHaveBeenCalledTimes(1);
        authSession.userSession = {id: 7};
        (adminUserAPI.findById as jest.Mock).mockRejectedValueOnce(new Error("load"));
        cleanup();
        render(<Account/>);
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        (adminUserAPI.findById as jest.Mock).mockResolvedValueOnce({...user, acls: undefined} as any);
        cleanup();
        render(<Account/>);
        await waitFor(() => expect(screen.getByDisplayValue("Alice")).toBeTruthy());
        fireEvent.click(screen.getByText("Save"));
        await waitFor(() => expect(adminUserAPI.update).toHaveBeenCalled());
    });

    it("changes password and handles both lookup and update errors", async () => {
        jest.spyOn(adminUserAPI, "findById").mockResolvedValue({...user, acls: undefined} as any);
        jest.spyOn(adminUserAPI, "update").mockResolvedValue(user as any);
        render(<ChangePassword/>);
        fireEvent.click(screen.getByRole("button", {name: "Change password"}));
        await waitFor(() => expect(adminUserAPI.update).toHaveBeenCalled());
        const passwordFields = screen.getAllByRole("textbox");
        fireEvent.change(passwordFields[0], {target: {value: "Abcdefghij1!"}});
        fireEvent.change(passwordFields[1], {target: {value: "different"}});
        fireEvent.click(screen.getByRole("button", {name: "Change password"}));
        (adminUserAPI.findById as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByRole("button", {name: "Change password"}));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        (adminUserAPI.findById as jest.Mock).mockResolvedValueOnce(user as any);
        (adminUserAPI.update as jest.Mock).mockRejectedValueOnce(new Error("bad"));
        fireEvent.click(screen.getByRole("button", {name: "Change password"}));
        await waitFor(() => expect(message.error).toHaveBeenCalled());
        authSession.userSession = undefined;
        cleanup();
        render(<ChangePassword/>);
        fireEvent.click(screen.getByRole("button", {name: "Change password"}));
        expect(adminUserAPI.findById).toHaveBeenCalledTimes(4);
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
