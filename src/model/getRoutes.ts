interface Stop {
  _id: string;
  name: string;
}
export interface AllRoutes {
  _id: string;
  start_id: Stop;
  stop_id: Stop;
  estimated_duration: number;
}