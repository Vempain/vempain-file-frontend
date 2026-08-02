import {Popover} from "antd";
import type {ReactNode} from "react";
import {FileDisplay} from "./FileDisplay";

type ThumbnailPopupProps = {
    children: ReactNode;
    id: number;
    maxSize: number;
};

export function ThumbnailPopup({children, id, maxSize}: ThumbnailPopupProps) {
    return (
            <Popover
                    content={<FileDisplay id={id} maxSize={maxSize}/>}
                    trigger="hover"
            >
                {children}
            </Popover>
    );
}
