import {render, screen} from "@testing-library/react";
import {PublishStatusNotice} from "../../../components/files/PublishStatusNotice";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key})
}));

describe("PublishStatusNotice", () => {
    it("shows the lookup in progress", () => {
        render(<PublishStatusNotice loading failed={false} published={null} publishedMessage="x"/>);
        expect(screen.getByTestId("publish-status-loading")).toBeTruthy();
    });

    it("warns about a failed lookup", () => {
        render(<PublishStatusNotice loading={false} failed published={null} publishedMessage="x"/>);
        expect(screen.getByTestId("publish-status-failed")).toBeTruthy();
        expect(screen.getByText("Could not check whether this was published before; the permissions start empty")).toBeTruthy();
    });

    it("tells what the previous publish created and that its grantees are prefilled", () => {
        render(<PublishStatusNotice loading={false} failed={false} published publishedMessage="Published before as site file #7"/>);
        expect(screen.getByTestId("publish-status-published")).toBeTruthy();
        expect(screen.getByText("Published before as site file #7")).toBeTruthy();
        expect(screen.getByText(/prefilled below/)).toBeTruthy();
    });

    it("tells that nothing was published before", () => {
        render(<PublishStatusNotice loading={false} failed={false} published={false} publishedMessage="x"/>);
        expect(screen.getByTestId("publish-status-new")).toBeTruthy();
        expect(screen.getByText("Not published to Vempain Admin before")).toBeTruthy();
    });

    it("renders nothing before the status is known", () => {
        const {container} = render(<PublishStatusNotice loading={false} failed={false} published={null} publishedMessage="x"/>);
        expect(container.innerHTML).toBe("");
    });
});
