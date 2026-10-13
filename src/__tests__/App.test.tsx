import {render, screen} from "@testing-library/react";
import {MemoryRouter} from "react-router-dom";
import i18next from "i18next";
import App from "../App";

let sessionLanguage: string | undefined = "en";

jest.mock("i18next", () => ({__esModule: true, default: {language: "en", changeLanguage: jest.fn()}}));

jest.mock("react-i18next", () => ({
    useTranslation: () => ({t: (key: string) => key})
}));

jest.mock("@vempain/vempain-auth-frontend", () => ({
    Login: () => <div data-testid="screen-Login"/>,
    Logout: () => <div data-testid="screen-Logout"/>,
    useSession: () => ({getSessionLanguage: () => sessionLanguage})
}), {virtual: true});

jest.mock("../services", () => ({taskAPI: {}}));
jest.mock("../main/TopBar.tsx", () => ({TopBar: () => <nav data-testid="top-bar"/>}));
jest.mock("../main/BottomFooter.tsx", () => ({BottomFooter: () => <footer data-testid="bottom-footer"/>}));

// Every screen is a named stub so that the routing itself can be asserted
jest.mock("../components", () => new Proxy({}, {
    get: (_target, name: string) => name === "__esModule" ? true : () => <div data-testid={`screen-${name}`}/>
}));

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: () => ({matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn()})
});

const changeLanguage = jest.mocked(i18next.changeLanguage);

function renderAt(path: string) {
    return render(<MemoryRouter initialEntries={[path]}><App/></MemoryRouter>);
}

describe("App", () => {
    beforeEach(() => {
        sessionLanguage = "en";
        changeLanguage.mockClear();
    });

    it("renders the frame with the home screen and redirects unknown paths to it", () => {
        renderAt("/");
        expect(screen.getByTestId("top-bar")).toBeTruthy();
        expect(screen.getByTestId("bottom-footer")).toBeTruthy();
        expect(screen.getByText("Home.title")).toBeTruthy();

        const {unmount} = renderAt("/no/such/route");
        expect(screen.getAllByText("Home.title")).toHaveLength(2);
        unmount();
    });

    it.each([
        ["/login", "Login"],
        ["/logout", "Logout"],
        ["/user/logout", "Logout"],
        ["/data/music", "PublishMusicData"],
        ["/data/gps-time-series", "PublishGpsTimeSeries"],
        ["/data/statistics", "Statistics"],
        ["/files/archives", "ArchiveFiles"],
        ["/files/audios", "AudioFiles"],
        ["/files/binaries", "BinaryFiles"],
        ["/files/data", "DataFiles"],
        ["/files/documents", "DocumentFiles"],
        ["/files/executables", "ExecutableFiles"],
        ["/files/file-groups", "FileGroups"],
        ["/files/fonts", "FontFiles"],
        ["/files/icons", "IconFiles"],
        ["/files/images", "ImageFiles"],
        ["/files/import", "ImportFiles"],
        ["/files/interactives", "InteractiveFiles"],
        ["/files/music", "MusicFiles"],
        ["/files/search", "SearchFiles"],
        ["/files/thumbs", "ThumbFiles"],
        ["/files/vectors", "VectorFiles"],
        ["/files/videos", "VideoFiles"],
        ["/management/permissions", "FilePermissions"],
        ["/management/units", "Units"],
        ["/management/units/3/edit", "UnitEdit"],
        ["/management/users", "Users"],
        ["/management/users/5/edit", "UserEdit"],
        ["/metadata/list", "MetadataList"],
        ["/security/location-guards", "LocationGuards"],
        ["/tags/create", "TagCreate"],
        ["/tags/7/edit", "TagEdit"],
        ["/tags/list", "TagList"],
        ["/tags/7", "TaggedFiles"],
        ["/tags/edit-files", "FileTagEditor"],
        ["/user/account", "Account"],
        ["/user/password", "ChangePassword"]
    ])("routes %s to %s", (path, screenName) => {
        renderAt(path);
        expect(screen.getByTestId(`screen-${screenName}`)).toBeTruthy();
    });

    it("switches i18next to the session language only when it differs", () => {
        sessionLanguage = "fi";
        renderAt("/");
        expect(changeLanguage).toHaveBeenCalledWith("fi");

        changeLanguage.mockClear();
        sessionLanguage = "en";
        renderAt("/");
        expect(changeLanguage).not.toHaveBeenCalled();

        sessionLanguage = undefined;
        renderAt("/");
        expect(changeLanguage).not.toHaveBeenCalled();
    });
});
