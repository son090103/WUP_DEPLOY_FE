export interface searchStops{
    _id : string,
    name: string,
    province: string,
    location: {
        type:"Point";
        coordinates :[number,number];
    },
    distance : number,
    selected: boolean
}

