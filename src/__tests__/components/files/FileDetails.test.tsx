import {render, screen} from "@testing-library/react";
import {FileDetails} from "../../../components/files/FileDetails";
import type {FileResponse} from "../../../models";

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string) => key})
}));

jest.mock("../../../services", () => ({userAPI: {}}));

jest.mock("../../../components/common", () => ({
    DisplayMap: ({location}: { location: { city: string } }) => <div>map of {location.city}</div>
}));

jest.mock("@vempain/vempain-auth-frontend", () => ({
    UserName: ({id}: { id?: number }) => <span>user {String(id)}</span>
}), {virtual: true});

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn()})
});

const file = {
    id: 7,
    filename: "holiday.jpg",
    file_path: "/2024/holiday.jpg",
    external_file_id: "ext-7",
    mimetype: "image/jpeg",
    filesize: 2048,
    sha256sum: "abc123",
    original_datetime: "2024-03-05T07:08:09Z",
    original_second_fraction: 250,
    original_document_id: "doc-1",
    description: "Beach",
    file_type: "IMAGE",
    rights_holder: "Jane",
    rights_terms: "CC-BY",
    rights_url: "https://example.org/license",
    gps_timestamp: "2024-03-05T07:00:00Z",
    location: {
        id: 1,
        latitude: 60.1,
        latitude_ref: "N",
        longitude: 24.9,
        longitude_ref: "E",
        altitude: null,
        direction: null,
        satellite_count: null,
        country: "FI",
        state: null,
        city: "Helsinki",
        street: null,
        sub_location: null
    },
    creator_name: "Jane Doe",
    creator_country: "FI",
    creator_email: "jane@example.org",
    creator_url: "https://example.org",
    tags: ["beach", "summer"],
    locked: true,
    creator: 3,
    created: "2024-03-06T00:00:00Z",
    modifier: 4,
    modified: "2024-03-07T00:00:00Z",
    acls: [{acl_id: 1}, {acl_id: 2}]
} as unknown as Partial<FileResponse>;

describe("FileDetails", () => {
    beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => undefined));
    afterEach(() => jest.restoreAllMocks());

    it("lists every detail of a fully described file", () => {
        render(<FileDetails file={file}/>);

        expect(screen.getByText("holiday.jpg")).toBeTruthy();
        expect(screen.getByText("/2024/holiday.jpg")).toBeTruthy();
        expect(screen.getByText("2.00 KB")).toBeTruthy();
        expect(screen.getByText("abc123")).toBeTruthy();
        expect(screen.getByText("250")).toBeTruthy();
        expect(screen.getByText("FileTypeEnum.image")).toBeTruthy();
        expect(screen.getByText("map of Helsinki")).toBeTruthy();
        expect(screen.getByText("beach")).toBeTruthy();
        expect(screen.getByText("summer")).toBeTruthy();
        expect(screen.getByText("Common.general.yes")).toBeTruthy();
        expect(screen.getByText("user 3")).toBeTruthy();
        expect(screen.getByText("user 4")).toBeTruthy();
        expect(screen.getByText("2")).toBeTruthy();
        // Timestamps are shown in the local time zone with the zone name
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        expect(screen.getAllByText(new RegExp(`\\(${timezone.replace("/", "\\/")}\\)$`)).length).toBe(4);
    });

    it("renders empty values, the unknown type and no map or tags for a sparse file", () => {
        const {container} = render(<FileDetails file={{id: 1, filename: "sparse.bin"} as Partial<FileResponse>}/>);

        expect(screen.getByText("FileTypeEnum.unknown")).toBeTruthy();
        expect(screen.getByText("Common.general.no")).toBeTruthy();
        expect(screen.queryByText(/map of/)).toBeNull();
        expect(container.querySelectorAll(".ant-tag")).toHaveLength(1);
        expect(screen.getAllByText("user undefined")).toHaveLength(2);
    });

    it("renders nothing without a file", () => {
        const {container} = render(<FileDetails file={null as unknown as Partial<FileResponse>}/>);
        expect(container.innerHTML).toBe("");
    });
});
