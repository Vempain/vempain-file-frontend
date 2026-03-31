import {GuardTypeEnum, type LocationGuardRequest, type LocationGuardResponse} from "../../models";
import {axiosMock, constructorSpy, resetServiceMockState, setAuthorizationHeaderSpy} from "../../testUtils/mockAuthFrontend";
import {LocationAPI} from "../../services";

describe("LocationAPI", () => {
    const locationAPI = new LocationAPI("http://localhost:8080/api", "/location");

    const guardRequest: LocationGuardRequest = {
        id: 1,
        guard_type: GuardTypeEnum.CIRCLE,
        primary_coordinate: {
            latitude: 60.1234567,
            longitude: 24.9876543,
        },
        secondary_coordinate: {
            latitude: 60.9999999,
            longitude: 24.1111119,
        },
        radius: 10,
    };

    beforeEach(() => {
        resetServiceMockState();
    });

    it("is instantiated with /location member path", () => {
        expect(constructorSpy.mock.calls).toEqual(expect.arrayContaining([
            [expect.anything(), "/location"],
        ]));
    });

    it("round5 returns rounded coordinates or null for invalid values", () => {
        expect(LocationAPI.round5(10.123456)).toBe(10.12346);
        expect(LocationAPI.round5(null)).toBeNull();
        expect(LocationAPI.round5(undefined)).toBeNull();
    });

    it("sanitizeGuardRequest rounds coordinates for backend payload", () => {
        const sanitized = LocationAPI.sanitizeGuardRequest(guardRequest);

        expect(sanitized.primary_coordinate.latitude).toBe(60.12346);
        expect(sanitized.primary_coordinate.longitude).toBe(24.98765);
        expect(sanitized.secondary_coordinate?.latitude).toBe(61);
        expect(sanitized.secondary_coordinate?.longitude).toBe(24.11111);
    });

    it("findLocationGuardById GETs /{id}", async () => {
        const responseData = {
            ...guardRequest,
            primary_coordinate: {latitude: 60.12346, longitude: 24.98765},
            secondary_coordinate: {latitude: 61, longitude: 24.11111},
        } as LocationGuardResponse;
        axiosMock.get.mockResolvedValueOnce({data: responseData});

        const response = await locationAPI.findLocationGuardById(1);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("/1");
        expect(response).toEqual(responseData);
    });

    it("findAllLocationGuards GETs /guard", async () => {
        const responseData: LocationGuardResponse[] = [{
            id: 1,
            guard_type: GuardTypeEnum.CIRCLE,
            primary_coordinate: {latitude: 60, longitude: 24},
            secondary_coordinate: null,
            radius: 10,
        }];
        axiosMock.get.mockResolvedValueOnce({data: responseData});

        const response = await locationAPI.findAllLocationGuards();

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("/guard");
        expect(response).toEqual(responseData);
    });

    it("isGuardedLocation GETs /guard/{id}", async () => {
        axiosMock.get.mockResolvedValueOnce({data: true});

        const response = await locationAPI.isGuardedLocation(33);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith("/guard/33");
        expect(response).toBe(true);
    });

    it("addLocationGuard POSTs sanitized payload to /guard", async () => {
        const responseData = {
            id: 1,
            guard_type: GuardTypeEnum.CIRCLE,
            primary_coordinate: {latitude: 60.12346, longitude: 24.98765},
            secondary_coordinate: {latitude: 61, longitude: 24.11111},
            radius: 10,
        } as LocationGuardResponse;
        axiosMock.post.mockResolvedValueOnce({data: responseData});

        const response = await locationAPI.addLocationGuard(guardRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith("/guard", {
            ...guardRequest,
            primary_coordinate: {latitude: 60.12346, longitude: 24.98765},
            secondary_coordinate: {latitude: 61, longitude: 24.11111},
        });
        expect(response).toEqual(responseData);
    });

    it("updateLocationGuard PUTs sanitized payload to /guard", async () => {
        const responseData = {
            id: 1,
            guard_type: GuardTypeEnum.CIRCLE,
            primary_coordinate: {latitude: 60.12346, longitude: 24.98765},
            secondary_coordinate: {latitude: 61, longitude: 24.11111},
            radius: 10,
        } as LocationGuardResponse;
        axiosMock.put.mockResolvedValueOnce({data: responseData});

        const response = await locationAPI.updateLocationGuard(guardRequest);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.put).toHaveBeenCalledWith("/guard", {
            ...guardRequest,
            primary_coordinate: {latitude: 60.12346, longitude: 24.98765},
            secondary_coordinate: {latitude: 61, longitude: 24.11111},
        });
        expect(response).toEqual(responseData);
    });

    it("deleteLocationGuard DELETEs /guard/{id}", async () => {
        axiosMock.delete.mockResolvedValueOnce({data: undefined});

        await locationAPI.deleteLocationGuard(5);

        expect(setAuthorizationHeaderSpy).toHaveBeenCalledTimes(1);
        expect(axiosMock.delete).toHaveBeenCalledWith("/guard/5");
    });
});


