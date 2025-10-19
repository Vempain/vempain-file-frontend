import Axios, {type AxiosInstance} from "axios";
import type {JwtResponse} from "@vempain/vempain-auth-frontend";
import type {PublishFileGroupRequest, PublishFileGroupResponse} from "../models";

class PublishAPI {
    protected axiosInstance: AxiosInstance;

    constructor(member: string) {
        this.axiosInstance = Axios.create({
            baseURL: `${import.meta.env.VITE_APP_API_URL}` + member
        });
    }

    /**
     * Sets the authorization header for the axios instance. We get the authorization bearer value from the local storage. We're forced
     * to do this on every request because the token can expire at any time.
     * @protected
     */
    protected setAuthorizationHeader(): void {
        const session: JwtResponse = JSON.parse(localStorage.getItem("vempainUser") || "{}");

        if (session && session.token) {
            this.axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + session.token;
        }
    }

    public async publishFileGroup(publishFileGroupRequest: PublishFileGroupRequest): Promise<PublishFileGroupResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';
        const response = await this.axiosInstance.post<PublishFileGroupResponse[]>("/file-group", publishFileGroupRequest);
        return response.data;
    }

}

export const publishAPI = new PublishAPI("/publish");
