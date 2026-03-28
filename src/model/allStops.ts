export interface allStops{
    _id : string,
    name: string,
    province: string;
    is_active : boolean;
 stopLocation_id: {
    _id: string;
    location_name: string;
  } | null;
}