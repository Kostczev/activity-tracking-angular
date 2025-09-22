export interface Cluster {
    id?: number;
    name: string;
    isActive: number;
}

export interface Activity {
    id?: number;
    name: string;
    clusterId: number;
    color?: string;
    icon?: string;
    isActive: number;
}

export interface TimeSlot {
    id?: number;
    activityId: number;
    startTime: Date;
    endTime: Date | null
}