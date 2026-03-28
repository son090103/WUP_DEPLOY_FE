import type { BusType } from "./coachType";

export interface getBuses{
    _id: string;
    bus_type_id: BusType;
    license_plate: string;
    status: "GREEN" | "YELLOW" | "RED";
};