import { DateFormatService } from './date-format.service';
import { TimeSlot, Activity, Cluster, StatisticSlot } from './../interfaces/db.interface';
import { db } from '../db';
import { Injectable, OnInit } from '@angular/core';
import { liveQuery } from 'dexie';
import { catchError, forkJoin, from, map, Observable, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { Data } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class DataService {
    clustersCache = new Map<number, Cluster>();
    private clustersLoaded = false;

    constructor() {
        this.preloadClusters().subscribe();
    }

    // Приватный метод-обертка для всех liveQuery
    private wrapLiveQuery<T>(queryFn: () => Promise<T[]>): Observable<T[]> {
        return new Observable<T[]>(subscriber => {
            const subscription = liveQuery(queryFn).subscribe({
                next: (data) => subscriber.next(data),
                error: (err) => subscriber.error(err),
                complete: () => subscriber.complete()
            });
            return () => subscription.unsubscribe()
        });
    }

    async addTimeSlot(slot: Omit<TimeSlot, 'id'>): Promise<number> {
        const newId = await db.timeSlots.add(slot)
        if (newId === undefined) {
            throw new Error('Ошибка базы данных: не удалось добавить кластер, ID не получен.');
        }
        return newId
    }

    async stopTimeSlot(timeSlotId: number): Promise<void> {
        const updatedCount = await db.timeSlots.update(timeSlotId, {
            endTime: new Date()
        });

        if (updatedCount === 0) {
            console.error('❌ No record found with ID:', timeSlotId);
        }
    }

    getLastTimeSlot(): Observable<TimeSlot | null> {
        return from(db.timeSlots.orderBy('id').reverse().first()).pipe(
            map(timeSlot => timeSlot || null),
            catchError(error => of(null))
        );
    }

    getAllTimeSlots(): Observable<TimeSlot[]> {
        return this.wrapLiveQuery(
            () => db.timeSlots.toArray()
        )
    }

    getActivityById(activityId: number): Observable<Activity> {
        return this.wrapLiveQuery(() =>
            db.activities
                .where('id')
                .equals(activityId)
                .toArray()
        ).pipe(
            map(activities => activities[0])
        );
    }

    // Основной метод для получения кластера
    getClusterById(clusterId: number): Observable<Cluster | null> {
        // Если уже загружены - возвращаем из кеша
        if (this.clustersLoaded) {
            return of(this.clustersCache.get(clusterId) || null);
        }

        // Если еще не загружали - загружаем все и кешируем
        return this.getAllClusters().pipe(
            tap(clusters => this.cacheClusters(clusters)),
            map(() => this.clustersCache.get(clusterId) || null)
        );
    }

    preloadClusters(): Observable<Cluster[]> {
        return this.getAllClusters().pipe(
            tap(clusters => {
                clusters.forEach(cluster => {
                    if (cluster.id) {
                        this.clustersCache.set(cluster.id, cluster);
                    }
                });
            })
        );
    }

    getAllClusters(): Observable<Cluster[]> {
        return this.wrapLiveQuery(() => db.clusters.toArray());
    }

    private cacheClusters(clusters: Cluster[]): void {
        clusters.forEach(cluster => {
            if (cluster.id) {
                this.clustersCache.set(cluster.id, cluster);
            }
        });
    }

    // Вспомогательный метод для быстрого доступа
    getClusterName(clusterId: number): string {
        return this.clustersCache.get(clusterId)?.name || 'Unknown';
    }

    getActivitiesByClusterId(clusterId: number): Observable<Activity[]> {
        return this.wrapLiveQuery(() =>
            db.activities
                .where('clusterId')
                .equals(clusterId)
                .and(activity => activity.isActive === 1)
                .toArray()
        );
    }
    getAllActiveClusters(): Observable<Cluster[]> {
        return this.wrapLiveQuery(() =>
            db.clusters.where('isActive').equals(1).toArray()
        );
    }

    // метод принимает объект, где id ТОЧНО НЕ ДОЛЖНО быть
    async addActivity(activity: Omit<Activity, 'id'>): Promise<number> {
        const newId = await db.activities.add(activity)
        if (newId === undefined) {
            throw new Error('Ошибка базы данных: не удалось добавить кластер, ID не получен.');
        }
        return newId
    }

    async addCluster(cluster: Omit<Cluster, 'id'>): Promise<number> {
        const newId = await db.clusters.add(cluster)
        if (newId === undefined) {
            throw new Error('Ошибка базы данных: не удалось добавить кластер, ID не получен.');
        }
        return newId
    }

    async updateActivity(activity: Activity): Promise<void> {
        if (activity.id === undefined) {
            throw new Error('Cannot update activity without ID');
        }
        await db.activities.update(activity.id, activity);
    }

    async deactivateActivity(activityId: number): Promise<void> {
        await db.activities.update(activityId, { isActive: 0 });
    }

    async activateActivity(activityId: number): Promise<void> {
        await db.activities.update(activityId, { isActive: 1 });
    }

    async permanentlyDeleteActivity(activityId: number): Promise<{ success: boolean; message: string }> {
        // 1. Проверяем, есть ли связанные записи в timeSlots
        const relatedTimeSlots = await db.timeSlots.where('activityId').equals(activityId).count();
        if (relatedTimeSlots > 0) {
            // 2. Если есть, не удаляем, а возвращаем ошибку
            return {
                success: false,
                message: `Невозможно удалить. Существует ${relatedTimeSlots} записей времени, связанных с этой активностью. Сначала удалите их в истории.`
            };
        }
        // 3. Если связей нет — удаляем навсегда
        await db.activities.delete(activityId)
        return { success: true, message: 'Активность удалена.' }
    }

    getAllActivities(): Observable<Activity[]> {
        return this.wrapLiveQuery(() => db.activities.toArray())
    }

    getAllActiveActivities(): Observable<Activity[]> {
        return this.wrapLiveQuery(() =>
            db.activities.where('isActive').equals(1).toArray()
        )
    }

    async debugActivities() {
        const allActivities = await db.activities.toArray();
        return allActivities;
    }

    getTimeSlotsForPeriod(startDate: Date, endDate: Date): Observable<TimeSlot[]> {
        // const startOfDay = new Date(startDate);
        // startOfDay.setHours(0, 0, 0, 0);

        // const endOfDay = new Date(endDate);
        // endOfDay.setHours(23, 59, 59, 999);

        return this.wrapLiveQuery(() =>
            db.timeSlots
                .where('endTime')
                .between(startDate, endDate)
                // .between(startOfDay, endOfDay)
                .toArray()
        )
    }

    getStatistic(startDate: Date, endDate: Date): Observable<StatisticSlot[]> {
        return this.getTimeSlotsForPeriod(startDate, endDate).pipe(
            switchMap(slots => this.enrichSlotsWithActivities(slots, startDate, endDate))
        );
    }

    private enrichSlotsWithActivities(slots: TimeSlot[], periodStart: Date, periodEnd: Date): Observable<StatisticSlot[]> {
        // Группируем запросы по активности для оптимизации
        const activityRequests = new Map<number, Observable<Activity>>();

        const slotRequests = slots.map(slot => {
            if (!activityRequests.has(slot.activityId)) {
                activityRequests.set(slot.activityId, this.getActivityById(slot.activityId));
            }

            return activityRequests.get(slot.activityId)!.pipe(
                // getActivityById() возвращает Observable который не завершается автоматически после первого значения
                // forkJoin ждет завершения ВСЕХ Observable'ов в массиве.
                // Добавьте take(1) - это гарантирует, что каждый Observable эмитнет значение и завершится
                take(1),
                map(activity => {
                    const trimmedSlot = this.trimSlotToPeriod(slot, periodStart, periodEnd)

                    return {
                        timeSlotId: slot.id!,
                        activityId: slot.activityId,
                        activityName: activity?.name || 'Unknown',
                        clusterId: activity?.clusterId || -1,
                        // startTime: slot.startTime,
                        // endTime: slot.endTime,
                        startTime: trimmedSlot.startTime,
                        endTime: trimmedSlot.endTime,
                        duration: trimmedSlot.duration
                        // duration: this.calculateSlotDuration(slot)
                    }
                })
            );
        });

        // return forkJoin(slotRequests).pipe(
        //     map(slots => slots.filter(slot => slot.duration > 0))
        // )
        return forkJoin(slotRequests)
    }

    calculateSlotDuration(slot: TimeSlot): number {
        return slot.endTime
            ? new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()
            : 0;
    }
    calculateDuration(startTime: Date, endTime: Date): number {
        return new Date(endTime).getTime() - new Date(startTime).getTime()
    }

    private trimSlotToPeriod(slot: TimeSlot, periodStart: Date, periodEnd: Date): {
        startTime: Date; endTime: Date; duration: number
    } {
        const slotEnd = slot.endTime || new Date();

        // Если таймслот не пересекается с периодом - возвращаем нулевую длительность
        // if (slotEnd <= periodStart || slot.startTime >= periodEnd) {
        //     return {
        //         startTime: slot.startTime,
        //         endTime: slotEnd,
        //         duration: 0
        //     };
        // }

        // Обрезаем границы
        const trimmedStart = slot.startTime < periodStart ? periodStart : slot.startTime;
        const trimmedEnd = slotEnd > periodEnd ? periodEnd : slotEnd;

        // const trimmedDuration = trimmedEnd.getTime() - trimmedStart.getTime();
        const trimmedDuration = this.calculateDuration(trimmedStart, trimmedEnd)

        return {
            // startTime: slot.startTime,
            startTime: trimmedStart,
            endTime: slot.endTime!,
            duration: this.calculateDuration(slot.startTime, slot.endTime!)
            // endTime: trimmedEnd,
            // duration: trimmedDuration
        };
    }
}