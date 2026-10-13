import {render, screen} from "@testing-library/react";
import {Home} from "../../main/Home";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string) => key})
}));

describe("Home", () => {
    it("renders the translated title", () => {
        render(<Home/>);
        expect(screen.getByRole("heading", {level: 1}).textContent).toBe("Home.title");
    });
});
