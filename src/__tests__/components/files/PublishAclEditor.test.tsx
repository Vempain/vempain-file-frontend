import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {Form} from "antd";
import {aclRowsEditorMock as sharedEditor} from "../../../testUtils/mockAclRowsEditor";
import {publishAPI} from "../../../services";
import {PublishAclEditor} from "../../../components/files/PublishAclEditor";
import {toPublishAclRequests} from "../../../tools/publishAcl";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key
    })
}));

jest.mock("../../../services", () => ({
    publishAPI: {
        getPublishUsers: jest.fn(),
        getPublishUnits: jest.fn()
    }
}));

// The shared editor of the auth library is the stand-in of src/testUtils/mockAclRowsEditor.tsx, which records its props in aclRowsEditorMock
jest.mock("@vempain/vempain-auth-frontend", () => jest.requireActual("../../../testUtils/mockAclRowsEditor"), {virtual: true});

const getPublishUsers = jest.mocked(publishAPI.getPublishUsers);
const getPublishUnits = jest.mocked(publishAPI.getPublishUnits);

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    })
});

// antd's Form field scheduler needs MessageChannel, which jsdom lacks
if (typeof globalThis.MessageChannel === "undefined") {
    class StubMessageChannel {
        port1: { onmessage: ((event: { data: unknown }) => void) | null; postMessage: (data: unknown) => void };
        port2: { onmessage: ((event: { data: unknown }) => void) | null; postMessage: (data: unknown) => void };

        constructor() {
            this.port1 = {onmessage: null, postMessage: data => setTimeout(() => this.port2.onmessage?.({data}), 0)};
            this.port2 = {onmessage: null, postMessage: data => setTimeout(() => this.port1.onmessage?.({data}), 0)};
        }
    }

    Object.defineProperty(globalThis, "MessageChannel", {writable: true, value: StubMessageChannel});
}

const users = [
    {id: 12, login_name: "arnold", name: "Arnold", nick: "Ahnold"},
    {id: 13, login_name: "bea", name: "Bea", nick: "B"}
];
const units = [{id: 3, name: "Editors", description: "Site editors"}];

function renderEditor(onFinish: jest.Mock = jest.fn()) {
    return render(
            <Form onFinish={onFinish}>
                <PublishAclEditor/>
                <button type="submit">submit</button>
            </Form>
    );
}

describe("toPublishAclRequests", () => {
    it("drops rows without a grantee, defaults missing switches to false and returns null when empty", () => {
        expect(toPublishAclRequests(undefined)).toBeNull();
        expect(toPublishAclRequests([])).toBeNull();
        expect(toPublishAclRequests([{user_id: null, unit_id: null, read_privilege: true}])).toBeNull();
        expect(toPublishAclRequests([
            {user_id: 12, read_privilege: true},
            {unit_id: 3, modify_privilege: true, delete_privilege: true},
            {user_id: 13, unit_id: null, create_privilege: true}
        ])).toEqual([
            {user_id: 12, unit_id: null, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: false},
            {user_id: null, unit_id: 3, read_privilege: false, create_privilege: false, modify_privilege: true, delete_privilege: true},
            {user_id: 13, unit_id: null, read_privilege: false, create_privilege: true, modify_privilege: false, delete_privilege: false}
        ]);
    });
});

describe("PublishAclEditor", () => {
    beforeEach(() => {
        getPublishUsers.mockReset();
        getPublishUnits.mockReset();
        sharedEditor.mockClear();
    });

    it("loads the admin users and units and hands them to the shared editor as options on the acls list", async () => {
        getPublishUsers.mockResolvedValue(users);
        getPublishUnits.mockResolvedValue(units);
        const onFinish = jest.fn();
        renderEditor(onFinish);

        await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());
        expect(getPublishUsers).toHaveBeenCalledTimes(1);
        expect(getPublishUnits).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Additional admin users and units")).toBeTruthy();

        const props = sharedEditor.mock.calls.at(-1)[0];
        expect(props.fieldName).toBe("acls");
        expect(props.userField).toBe("user_id");
        expect(props.unitField).toBe("unit_id");
        expect(props.uniqueGrantees).toBe(true);
        expect(props.rowTestId).toBe("publish-acl-row");
        expect(props.users).toEqual([{value: 12, label: "Arnold (arnold)"}, {value: 13, label: "Bea (bea)"}]);
        expect(props.units).toEqual([{value: 3, label: "Editors"}]);

        // A row written by the editor reaches the form as a request entry
        fireEvent.click(screen.getByText("stub: grant first user"));
        fireEvent.click(screen.getByText("submit"));
        await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
        expect(toPublishAclRequests(onFinish.mock.calls[0][0].acls)).toEqual([
            {user_id: 12, unit_id: null, read_privilege: true, create_privilege: false, modify_privilege: true, delete_privilege: false}
        ]);
    });

    it("shows a warning when the admin users or units cannot be loaded", async () => {
        getPublishUsers.mockResolvedValue(users);
        getPublishUnits.mockRejectedValue(new Error("down"));
        renderEditor();

        await waitFor(() => expect(screen.getByText("Could not load the admin users and units")).toBeTruthy());
        expect(screen.queryByTestId("acl-rows-editor")).toBeNull();
    });

    it("treats missing lists as empty and ignores results that arrive after unmounting", async () => {
        getPublishUsers.mockResolvedValue(null as never);
        getPublishUnits.mockResolvedValue(null as never);
        renderEditor();
        await waitFor(() => expect(screen.getByTestId("acl-rows-editor")).toBeTruthy());
        expect(sharedEditor.mock.calls.at(-1)[0].users).toEqual([]);
        expect(sharedEditor.mock.calls.at(-1)[0].units).toEqual([]);

        let rejectLoad: (error: Error) => void = () => undefined;
        getPublishUsers.mockReturnValue(new Promise((_resolve, reject) => {
            rejectLoad = reject;
        }));
        getPublishUnits.mockResolvedValue(units);
        const {unmount} = renderEditor();
        unmount();
        rejectLoad(new Error("late"));
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(screen.queryByText("Could not load the admin users and units")).toBeNull();
    });
});
