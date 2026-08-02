import {AbstractAPI} from "@vempain/vempain-auth-frontend";

export class FileContentAPI extends AbstractAPI<never, Blob> {
    public async getFileContent(id: number): Promise<Blob> {
        this.setAuthorizationHeader();
        const response = await this.axiosInstance.get<Blob>(`/${id}/content`, {
            responseType: "blob",
        });
        return response.data;
    }
}
