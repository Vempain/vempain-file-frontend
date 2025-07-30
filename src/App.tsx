import './App.css'
import {ConfigProvider, Layout, theme} from "antd";
import {Navigate, Route, Routes} from "react-router-dom";
import {TopBar} from "./main/TopBar.tsx";
import {Login, Logout} from "../../vempain-frontend-auth/src/main";
import {Home} from "./main/Home.tsx";
import {BottomFooter} from "./main/BottomFooter.tsx";
import {TagCreate, TagList, TagSearch} from "./components/tags";
import {AudioFiles, DocumentFiles, ImageFiles, ImportFiles, SearchFiles, VideoFiles} from "./components/files";
import {FileImports, Publishing, SystemSchedules} from "./components/schedules";
import {FilePermissions, Units, Users} from "./components/management";
import {Account, ChangePassword} from "./components/user";

const {Content} = Layout;

function App() {
    const {darkAlgorithm} = theme;

    return (
            <ConfigProvider theme={{algorithm: darkAlgorithm}}>
                <Layout className={"layout"}>
                    <TopBar/>
                    <Content style={{padding: "0 50px"}}>
                        <div className={"site-layout-content"}>
                            <Routes>
                                <Route path={"*"} element={<Navigate to={"/"}/>}/>
                                <Route path={"/"} element={<Home/>}/>
                                <Route path={"/login"} element={<Login/>}/>
                                <Route path={"/logout"} element={<Logout/>}/>
                                <Route path="/" element={<Home/>}/>
                                <Route path="/tags/list" element={<TagList/>}/>
                                <Route path="/tags/create" element={<TagCreate/>}/>
                                <Route path="/tags/search" element={<TagSearch/>}/>
                                <Route path="/files/audios" element={<AudioFiles/>}/>
                                <Route path="/files/documents" element={<DocumentFiles/>}/>
                                <Route path="/files/images" element={<ImageFiles/>}/>
                                <Route path="/files/videos" element={<VideoFiles/>}/>
                                <Route path="/files/import" element={<ImportFiles/>}/>
                                <Route path="/files/search" element={<SearchFiles/>}/>
                                <Route path="/schedules/system" element={<SystemSchedules/>}/>
                                <Route path="/schedules/file-imports" element={<FileImports/>}/>
                                <Route path="/schedules/publishing" element={<Publishing/>}/>
                                <Route path="/management/users" element={<Users/>}/>
                                <Route path="/management/units" element={<Units/>}/>
                                <Route path="/management/permissions" element={<FilePermissions/>}/>
                                <Route path="/user/account" element={<Account/>}/>
                                <Route path="/user/password" element={<ChangePassword/>}/>
                                <Route path="/user/logout" element={<Logout/>}/>
                                <Route path="/login" element={<Login/>}/>
                                <Route path="/logout" element={<Logout/>}/> </Routes>
                        </div>
                        <BottomFooter/>
                    </Content>
                </Layout>
            </ConfigProvider>
    );
}

export default App
