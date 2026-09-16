import {Footer} from "antd/es/layout/layout";
import type {BuildInfo} from "../models";
import BuildInfoData from "../buildInfo.json";
import {useTranslation} from "react-i18next";
import {resolveFooterConfig} from "./resolveFooterConfig";

export function BottomFooter() {
    const buildInfo: BuildInfo = BuildInfoData;
    const {t} = useTranslation();
    const footerConfig = resolveFooterConfig();

    return (
            <Footer style={{textAlign: "center"}}>
                <div>{footerConfig.copyright}</div>
                <div>
                    {t("BottomFooter.text.versionPrefix")}{buildInfo.version}{" "}
                    {t("BottomFooter.text.builtPrefix")} {buildInfo.buildTime}
                </div>
                <div>{footerConfig.poweredBy}</div>
            </Footer>
    );
}
