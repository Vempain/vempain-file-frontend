import {Image, Spin} from "antd";
import {useEffect, useState} from "react";
import {fileContentAPI} from "../../services";

type FileDisplayProps = {
    id: number;
    maxSize: number;
};

export function FileDisplay({id, maxSize}: FileDisplayProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        let objectUrl: string | null = null;

        setLoading(true);
        setImageUrl(null);

        fileContentAPI.getFileContent(id)
                .then(file => {
                    if (!active) return;
                    objectUrl = URL.createObjectURL(file);
                    setImageUrl(objectUrl);
                })
                .catch(error => {
                    if (active) {
                        console.error(`Failed to fetch file content for file ${id}:`, error);
                    }
                })
                .finally(() => {
                    if (active) setLoading(false);
                });

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [id]);

    return (
            <Spin spinning={loading}>
                {imageUrl && <Image
                        alt={`File ${id}`}
                        preview={false}
                        src={imageUrl}
                        style={{maxWidth: maxSize, maxHeight: maxSize}}
                />}
            </Spin>
    );
}
