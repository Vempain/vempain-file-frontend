import type {GuardTypeEnum} from "../GuardTypeEnum.ts";
import type {GeoCoordinate} from "../GeoCoordinate.ts";

export interface LocationGuardResponse {
    id: number;
    guard_type: GuardTypeEnum;
    primary_coordinate: GeoCoordinate;
    secondary_coordinate?: GeoCoordinate | null;
    radius?: number | null;
}