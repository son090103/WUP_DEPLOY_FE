export interface createRoute{
    start_id: string,
    stop_id: string,
    stops: {
        stop_id: string,
        stop_order: number
    }[]
}