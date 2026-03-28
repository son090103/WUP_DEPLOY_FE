export interface Avatar {
    url: string;
    publicId: string;
}
export interface User {
    _id: string;
    name: string;
    phone: string;
    status: string;
    isVerified: boolean;
    deletedAt: string | null;
    createdAt: string;
    updatedAt: string;
    face_updated_at?: string;
    avatar: Avatar;
}

export interface Route {
    _id: string;
    start_id: {
        name: string
    };
    stop_id: {
        name: string
    };
    distance_km: number;
    is_active: boolean;
}

export interface DriverShift {
    _id: string;
    driver_id: User;
    shift_start: string;
    shift_end: string;
    actual_shift_start?: string;
}

export interface Trip {
    _id: string;
    route_id: Route;
    bus_id: {
        bus_type_id: {
            name: string
        }
    };
    drivers: DriverShift[];
    assistant_id: User | null;
    departure_time: string;
    status: "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED";
    created_at: string;
    arrival_time?: string;
}
