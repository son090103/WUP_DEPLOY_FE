export interface getTripFinished {
   _id: string;
   trip_id: string;
  from: string;
  to: string;
  departure_time: string;
  arrival_time: string;
  bus_name: string;
  pickup_point: string;
  dropoff_point: string;
  seat_labels: string[];
  total_price: number;
  status: string;
}