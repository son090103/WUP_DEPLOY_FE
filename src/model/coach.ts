export type ColumnName = "LEFT" | "MIDDLE" | "RIGHT";

export interface Column {
  name: ColumnName;
  seats_per_row: number;
}
export interface ColumnOverride {
  column_name: ColumnName;
  seats: number;
}
export interface RowOverride {
  row_index: number;
  floor: 1 | 2;
  column_overrides: ColumnOverride[];
}

export interface coach{
    license_plate : string,
    bus_type_id : string,
    current_stop_id : string
}
export interface SeatLayout {
  template_name: string;
  floors: number;
  rows: number;
  columns: Column[];
  row_overrides: RowOverride[];
  total_seats: number;
}
export interface CreateBusRequest {
  license_plate: string;
  bus_type_id: string;
  seat_layout: SeatLayout;
}
