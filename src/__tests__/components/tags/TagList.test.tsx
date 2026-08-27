import {render, waitFor} from "@testing-library/react";
import {resetServiceMockState} from "../../../testUtils/mockAuthFrontend";
import {TagList} from "../../../components/tags/TagList";
import {tagAPI} from "../../../services";

jest.mock("react-router-dom", () => ({
    Link: ({children}: { children: string }) => <a>{children}</a>
}));

jest.mock("@ant-design/icons", () => ({
    SearchOutlined: () => <span/>
}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key
    })
}));

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

describe("TagList", () => {
    beforeEach(() => resetServiceMockState());

    it("loads the first page through the pageable API", async () => {
        const findPageable = jest.spyOn(tagAPI, "findPageable").mockResolvedValue({
            content: [{
                id: 1,
                tag_name: "nature",
                tag_name_de: "Natur",
                tag_name_en: "nature",
                tag_name_es: "naturaleza",
                tag_name_fi: "luonto",
                tag_name_sv: "natur"
            }],
            page: 0,
            size: 10,
            total_elements: 1,
            total_pages: 1,
            first: true,
            last: true,
            empty: false
        });

        render(<TagList/>);

        await waitFor(() => expect(findPageable).toHaveBeenCalledWith({
            page: 0,
            size: 10,
            sort_by: "tag_name",
            direction: "ASC",
            case_sensitive: false
        }));
        findPageable.mockRestore();
    });
});
