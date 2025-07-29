import './App.css'
import {ConfigProvider, Layout, theme} from "antd";
import {Navigate, Route, Routes} from "react-router-dom";
import {TopBar} from "./main/TopBar.tsx";
import {Login, Logout} from "../../vempain-frontend-auth/src/main";
import {Home} from "./main/Home.tsx";
import {BottomFooter} from "./main/BottomFooter.tsx";

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
                            </Routes>
                        </div>
                        <BottomFooter/>
                    </Content>
                </Layout>
            </ConfigProvider>
    );
}

export default App
