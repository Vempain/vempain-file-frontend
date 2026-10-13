import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {message} from "antd";
import {ShowFileGroup} from "../../../components/files/ShowFileGroup";
import {fileGroupAPI} from "../../../services";

let routeParams: Record<string, string | undefined> = {id: "5"};

jest.mock("react-router-dom", () => ({
    useParams: () => routeParams
}));

// A stable translation function: the screen refetches when `t` changes
const translate = (key: string) => key;
jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: translate})
}));

jest.mock("../../../services", () => ({
    fileGroupAPI: {findById: jest.fn()}
}));

// The barrel is replaced so that the shared file details modal (map, user names) stays out of this test
jest.mock("../../../components/files/index", () => ({
    ...jest.requireActual("../../../components/files/commonColumns"),
    FileDetails: ({file}: { file: { filename: string } }) => <div>details of {file.filename}</div>
}));

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn()})
});

const findById = jest.mocked(fileGroupAPI.findById);

const group = {
    id: 5,
    path: "/trips/2024",
    group_name: "Summer",
    description: "Summer trip",
    files: [
        {
            id: 1,
            external_file_id: "ext-1",
            filename: "a.jpg",
            file_path: "/trips/2024/a.jpg",
            filesize: 1024,
            mimetype: "image/jpeg",
            created: "2024-01-01T00:00:00Z"
        },
        {id: 2, external_file_id: "ext-2", filename: "b.jpg", file_path: "/trips/2024/b.jpg", filesize: 2048, mimetype: "image/jpeg", created: null}
    ]
};

describe("ShowFileGroup", () => {
    beforeEach(() => {
        routeParams = {id: "5"};
        findById.mockReset();
        jest.spyOn(message, "error").mockImplementation(() => ({}) as never);
        jest.spyOn(console, "error").mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it("loads the group of the route and opens the details of a file", async () => {
        findById.mockResolvedValue(group as never);
        render(<ShowFileGroup/>);

        await waitFor(() => expect(findById).toHaveBeenCalledWith(5));
        await waitFor(() => expect(screen.getByText("Summer")).toBeTruthy());
        expect(screen.getByText("/trips/2024")).toBeTruthy();
        expect(screen.getByText("1.00 kB")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", {name: "b.jpg"}));
        await waitFor(() => expect(screen.getByText("details of b.jpg")).toBeTruthy());
        fireEvent.click(screen.getByRole("button", {name: "Close"}));
        await waitFor(() => expect(screen.queryByText("details of b.jpg")).toBeNull());
    });

    it("renders a group without files", async () => {
        findById.mockResolvedValue({...group, files: undefined} as never);
        render(<ShowFileGroup/>);

        await waitFor(() => expect(screen.getByText("Summer")).toBeTruthy());
        expect(screen.queryByRole("button", {name: "a.jpg"})).toBeNull();
    });

    it("reports a failed load", async () => {
        findById.mockRejectedValue(new Error("gone"));
        render(<ShowFileGroup/>);

        await waitFor(() => expect(message.error).toHaveBeenCalledWith("ShowFileGroup.messages.fetchError"));
        expect(screen.queryByText("ShowFileGroup.header.title")).toBeNull();
    });

    it("fetches nothing without a group id", () => {
        routeParams = {};
        render(<ShowFileGroup/>);

        expect(findById).not.toHaveBeenCalled();
    });
});
