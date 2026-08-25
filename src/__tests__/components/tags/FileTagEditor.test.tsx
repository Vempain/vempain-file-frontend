import "../../../testUtils/mockAuthFrontend";
import {fireEvent, render, screen, waitFor} from "@testing-library/react";
import {FileTagEditor} from "../../../components/tags/FileTagEditor";
import {tagAPI} from "../../../services";

jest.mock("antd", () => {
    const React = jest.requireActual("react") as typeof import("react");
    const passthrough = ({children}: { children?: React.ReactNode }) => React.createElement("div", {}, children);

    return {
        Button: ({children, onClick}: { children?: React.ReactNode; onClick?: () => void }) =>
                React.createElement("button", {onClick}, children),
        Card: passthrough,
        Input: () => React.createElement("input"),
        Select: () => React.createElement("select"),
        Space: passthrough,
        Tabs: ({items, onChange}: {
            items: { key: string; label: React.ReactNode }[];
            onChange: (key: string) => void;
        }) => React.createElement("div", {}, items.map(item =>
                React.createElement("button", {
                    key: item.key,
                    role: "tab",
                    onClick: () => onChange(item.key),
                }, item.label),
        )),
        message: {error: jest.fn(), success: jest.fn()},
    };
});

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe("FileTagEditor", () => {
    it("loads tags when a tag-dependent tab is opened", async () => {
        const findAllSpy = jest.spyOn(tagAPI, "findAll").mockResolvedValue([]);

        render(<FileTagEditor/>);

        expect(findAllSpy).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.rename"}));
        await waitFor(() => expect(findAllSpy).toHaveBeenCalledTimes(1));

        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.add"}));
        expect(findAllSpy).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.replace"}));
        await waitFor(() => expect(findAllSpy).toHaveBeenCalledTimes(2));

        fireEvent.click(screen.getByRole("tab", {name: "FileTagEditor.actions.remove"}));
        await waitFor(() => expect(findAllSpy).toHaveBeenCalledTimes(3));
    });
});
