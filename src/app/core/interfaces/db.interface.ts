export interface Cluster {
    id?: number;
    name: string;
    isActive: boolean;
}

export interface Activity {
    id?: number;
    name: string;
    clusterId: number;
    color?: string;
    icon?: string;
    isActive: boolean;
}

export interface TimeSlot {
    id?: number;
    activityId: string;
    startTime: Date;
    endTime: Date | null
}