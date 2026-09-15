import {render, screen} from "@testing-library/react";
import {BottomFooter} from "../../../main/BottomFooter";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe("BottomFooter", () => {
    it("renders build metadata as text instead of interpreting configured HTML", () => {
        render(<BottomFooter/>);

        const footer = screen.getByRole("contentinfo");
        expect(footer.querySelector("script")).toBeNull();
        expect(footer.innerHTML).not.toContain("dangerouslySetInnerHTML");
        expect(footer.textContent).toContain("BottomFooter.text.versionPrefix");
    });
});
