export interface Review {
  rating: number;
  comment: string;
  driver_rating: number;
  assistant_rating: number;
  bus_rating: number;
}
export interface getTripFinishedWithReview {
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
  review: Review
}