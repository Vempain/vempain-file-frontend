import {AbstractAPI} from "@vempain/vempain-auth-frontend";
import type {LocationGuardRequest, LocationGuardResponse, LocationRequest, LocationResponse} from "../models";

export class LocationAPI extends AbstractAPI<LocationRequest, LocationResponse> {
    // Public static helpers to reuse in UI as well
    public static round5(n: number | null | undefined): number | null {
        if (typeof n !== "number" || !isFinite(n)) return null;
        return Math.round(n * 1e5) / 1e5;
    }

    public static roundCoord(coord?: { latitude: number; longitude: number } | null) {
        if (!coord) return null;
        const latitude = LocationAPI.round5(coord.latitude);
        const longitude = LocationAPI.round5(coord.longitude);
        if (latitude === null || longitude === null) return null;
        return {latitude, longitude};
    }

    public static sanitizeGuardRequest(req: LocationGuardRequest): LocationGuardRequest {
        return {
            ...req,
            primary_coordinate: LocationAPI.roundCoord(req.primary_coordinate)!,
            secondary_coordinate: LocationAPI.roundCoord(req.secondary_coordinate ?? null) ?? null,
        };
    }

    public async findLocationGuardById(id: number): Promise<LocationGuardResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.get<LocationGuardResponse>(`/${id}`);
        return response.data;
    }

    public async findAllLocationGuards(): Promise<LocationGuardResponse[]> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.get<LocationGuardResponse[]>("/guard");
        return response.data;
    }

    public async isGuardedLocation(gpsLocationId: number): Promise<boolean> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.get["Content-Type"] = "application/json;charset=utf-8";
        const response = await this.axiosInstance.get<boolean>(`/guard/${gpsLocationId}`);
        return response.data;
    }

    public async addLocationGuard(request: LocationGuardRequest): Promise<LocationGuardResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.post["Content-Type"] = "application/json;charset=utf-8";
        const payload = LocationAPI.sanitizeGuardRequest(request);
        const response = await this.axiosInstance.post<LocationGuardResponse>("/guard", payload);
        return response.data;
    }

    public async updateLocationGuard(request: LocationGuardRequest): Promise<LocationGuardResponse> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.put["Content-Type"] = "application/json;charset=utf-8";
        const payload = LocationAPI.sanitizeGuardRequest(request);
        const response = await this.axiosInstance.put<LocationGuardResponse>("/guard", payload);
        return response.data;
    }

    public async deleteLocationGuard(id: number): Promise<void> {
        this.setAuthorizationHeader();
        this.axiosInstance.defaults.headers.delete["Content-Type"] = "application/json;charset=utf-8";
        await this.axiosInstance.delete<void>(`/guard/${id}`);
    }
}

export const locationAPI = new LocationAPI(import.meta.env.VITE_APP_API_URL, "/location");