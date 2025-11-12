import type {GuardTypeEnum} from "../GuardTypeEnum.ts";
import type {GeoCoordinate} from "../GeoCoordinate.ts";

export interface LocationGuardRequest {
    id?: number | null;
    guard_type: GuardTypeEnum;
    primary_coordinate: GeoCoordinate;
    secondary_coordinate?: GeoCoordinate | null;
    radius?: number | null;
}