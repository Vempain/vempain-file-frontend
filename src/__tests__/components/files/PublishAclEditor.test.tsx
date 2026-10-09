import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {Form} from "antd";
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
        getPublishUsers: jest.fn()
    }
}));

const getPublishUsers = jest.mocked(publishAPI.getPublishUsers);

// antd's responsive Row and the Form field scheduler need these browser APIs that jsdom lacks
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

function renderEditor(onFinish: jest.Mock = jest.fn()) {
    return render(
            <Form onFinish={onFinish}>
                <PublishAclEditor/>
                <button type="submit">submit</button>
            </Form>
    );
}

describe("toPublishAclRequests", () => {
    it("drops rows without a user, defaults missing switches to false and returns null when empty", () => {
        expect(toPublishAclRequests(undefined)).toBeNull();
        expect(toPublishAclRequests([])).toBeNull();
        expect(toPublishAclRequests([{user_id: null, read_privilege: true}])).toBeNull();
        expect(toPublishAclRequests([{user_id: 12, read_privilege: true}, {user_id: 13, modify_privilege: true, delete_privilege: true}])).toEqual([
            {user_id: 12, read_privilege: true, create_privilege: false, modify_privilege: false, delete_privilege: false},
            {user_id: 13, read_privilege: false, create_privilege: false, modify_privilege: true, delete_privilege: true}
        ]);
    });
});

describe("PublishAclEditor", () => {
    beforeEach(() => {
        getPublishUsers.mockReset();
    });

    it("loads the admin users and adds a row with read granted by default", async () => {
        getPublishUsers.mockResolvedValue(users);
        const onFinish = jest.fn();
        renderEditor(onFinish);

        await waitFor(() => expect(screen.getByText("Add admin user")).toBeTruthy());
        expect(getPublishUsers).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText("Add admin user"));
        await waitFor(() => expect(screen.getAllByTestId("publish-acl-row")).toHaveLength(1));
        expect(screen.getByText("Read")).toBeTruthy();
        expect(screen.getByText("Delete")).toBeTruthy();
        const switches = screen.getAllByRole("switch");
        expect(switches).toHaveLength(4);
        expect(switches[0].getAttribute("aria-checked")).toBe("true");
        expect(switches[1].getAttribute("aria-checked")).toBe("false");

        // Submitting without a user fails validation and never reaches onFinish
        fireEvent.click(screen.getByText("submit"));
        await waitFor(() => expect(screen.getByText("Select a user")).toBeTruthy());
        expect(onFinish).not.toHaveBeenCalled();

        // Removing the row makes the form valid again
        fireEvent.click(screen.getByLabelText("Remove"));
        await waitFor(() => expect(screen.queryAllByTestId("publish-acl-row")).toHaveLength(0));
        fireEvent.click(screen.getByText("submit"));
        await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
        expect(toPublishAclRequests(onFinish.mock.calls[0][0].acls)).toBeNull();
    });

    it("rejects a row whose every privilege is off", async () => {
        getPublishUsers.mockResolvedValue(users);
        const onFinish = jest.fn();
        const {container} = render(
                <Form onFinish={onFinish}
                      initialValues={{acls: [{user_id: 12, read_privilege: false, create_privilege: false, modify_privilege: false, delete_privilege: false}]}}>
                    <PublishAclEditor/>
                    <button type="submit">submit</button>
                </Form>
        );

        await waitFor(() => expect(screen.getAllByTestId("publish-acl-row")).toHaveLength(1));
        expect(container.textContent).toContain("Arnold (arnold)");

        fireEvent.click(screen.getByText("submit"));
        await waitFor(() => expect(screen.getByText("Grant at least one privilege")).toBeTruthy());
        expect(onFinish).not.toHaveBeenCalled();

        // Granting modify satisfies the rule
        fireEvent.click(screen.getAllByRole("switch")[2]);
        fireEvent.click(screen.getByText("submit"));
        await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
        expect(toPublishAclRequests(onFinish.mock.calls[0][0].acls)).toEqual([
            {user_id: 12, read_privilege: false, create_privilege: false, modify_privilege: true, delete_privilege: false}
        ]);
    });

    it("shows a warning when the admin users cannot be loaded", async () => {
        getPublishUsers.mockRejectedValue(new Error("down"));
        renderEditor();

        await waitFor(() => expect(screen.getByText("Could not load the admin users")).toBeTruthy());
        expect(screen.queryByText("Add admin user")).toBeNull();
    });
});
