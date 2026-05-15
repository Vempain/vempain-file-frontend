import './App.css'
import {ConfigProvider, Layout, theme} from "antd";
import {Navigate, Route, Routes} from "react-router-dom";
import {TopBar} from "./main/TopBar.tsx";
import {Home} from "./main/Home.tsx";
import {BottomFooter} from "./main/BottomFooter.tsx";
import {
    Account,
    ArchiveFiles,
    AudioFiles,
    BinaryFiles,
    ChangePassword,
    DataFiles,
    DocumentFiles,
    ExecutableFiles,
    FileGroups,
    FileImports,
    FilePermissions,
    FontFiles,
    IconFiles,
    ImageFiles,
    ImportFiles,
    InteractiveFiles,
    LocationGuards,
    MusicFiles,
    PublishGpsTimeSeries,
    Publishing,
    PublishMusicData,
    SearchFiles,
    SystemSchedules,
    TagCreate,
    TagList,
    TagSearch,
    ThumbFiles,
    Units,
    Users,
    VectorFiles,
    VideoFiles
} from "./components";
import {Login, Logout, useSession} from "@vempain/vempain-auth-frontend";
import i18next from "i18next";

const {Content} = Layout;

export default function App() {
    const {getSessionLanguage} = useSession();

    const sessionLanguage = getSessionLanguage();

    const {darkAlgorithm} = theme;
    const darkThemeTokens = {
        colorBgBase: "#050505",
        colorBgLayout: "#121212",
        colorTextBase: "#E0E0E0",
        colorTextSecondary: "#B0B0B0",
        colorPrimary: "#50B0ff",
        colorLink: "#888888",
        colorMenuItemHoverBg: "#333333",
        colorMenuBackground: "#121212",
        colorMenuItemText: "#E0E0E0",
        colorMenuItemActiveBg: "#444444",
    };

    if (sessionLanguage !== undefined && sessionLanguage !== i18next.language) {
        i18next.changeLanguage(getSessionLanguage());
    }

    return (
            <ConfigProvider theme={{algorithm: darkAlgorithm, token: darkThemeTokens}}>
                <Layout className={"layout"}>
                    <TopBar/>
                    <Content style={{marginTop: "65px"}}>
                        <Routes>
                            <Route path={"*"} element={<Navigate to={"/"}/>}/>
                            <Route path={"/"} element={<Home/>}/>
                            <Route path={"/login"} element={<Login/>}/>
                            <Route path={"/logout"} element={<Logout/>}/>
                            <Route path={"/data/music"} element={<PublishMusicData/>}/>
                            <Route path={"/data/gps-time-series"} element={<PublishGpsTimeSeries/>}/>
                            <Route path={"/files/archives"} element={<ArchiveFiles/>}/>
                            <Route path={"/files/audios"} element={<AudioFiles/>}/>
                            <Route path={"/files/binaries"} element={<BinaryFiles/>}/>
                            <Route path={"/files/data"} element={<DataFiles/>}/>
                            <Route path={"/files/documents"} element={<DocumentFiles/>}/>
                            <Route path={"/files/executables"} element={<ExecutableFiles/>}/>
                            <Route path={"/files/file-groups"} element={<FileGroups/>}/>
                            <Route path={"/files/fonts"} element={<FontFiles/>}/>
                            <Route path={"/files/icons"} element={<IconFiles/>}/>
                            <Route path={"/files/images"} element={<ImageFiles/>}/>
                            <Route path={"/files/import"} element={<ImportFiles/>}/>
                            <Route path={"/files/interactives"} element={<InteractiveFiles/>}/>
                            <Route path={"/files/music"} element={<MusicFiles/>}/>
                            <Route path={"/files/search"} element={<SearchFiles/>}/>
                            <Route path={"/files/thumbs"} element={<ThumbFiles/>}/>
                            <Route path={"/files/vectors"} element={<VectorFiles/>}/>
                            <Route path={"/files/videos"} element={<VideoFiles/>}/>
                            <Route path={"/management/permissions"} element={<FilePermissions/>}/>
                            <Route path={"/management/units"} element={<Units/>}/>
                            <Route path={"/management/users"} element={<Users/>}/>
                            <Route path={"/security/location-guards"} element={<LocationGuards/>}/>
                            <Route path={"/schedules/file-imports"} element={<FileImports/>}/>
                            <Route path={"/schedules/publishing"} element={<Publishing/>}/>
                            <Route path={"/schedules/system"} element={<SystemSchedules/>}/>
                            <Route path={"/tags/create"} element={<TagCreate/>}/>
                            <Route path={"/tags/list"} element={<TagList/>}/>
                            <Route path={"/tags/search"} element={<TagSearch/>}/>
                            <Route path={"/user/account"} element={<Account/>}/>
                            <Route path={"/user/logout"} element={<Logout/>}/>
                            <Route path={"/user/password"} element={<ChangePassword/>}/>
                        </Routes>
                        <BottomFooter/>
                    </Content>
                </Layout>
            </ConfigProvider>
    );
}
