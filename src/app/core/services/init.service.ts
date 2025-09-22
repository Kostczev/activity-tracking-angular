import { db } from '../db';
import { DataService } from './data.service';
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class InitService {
    constructor(private dataService: DataService) { }

    async initializeApp(): Promise<boolean> {
        const hasData = await this.checkDbHasData()

        if (hasData) return false

        await this.createDefaultData()
        return true
    }

    private async checkDbHasData(): Promise<boolean> {
        const clustersCount = await db.clusters.count()
        return clustersCount > 0
    }

    private async createDefaultData(): Promise<void> {
        // Создаем кластеры и сразу получаем их ID
        const workId = await this.dataService.addCluster({ name: 'Работа', isActive: 1 });
        const restId = await this.dataService.addCluster({ name: 'Отдых', isActive: 1 });
        const physicalId = await this.dataService.addCluster({ name: 'ФизАктивность', isActive: 1 });
        const healthId = await this.dataService.addCluster({ name: 'Здоровье', isActive: 1 });
        const learnId = await this.dataService.addCluster({ name: 'Обучение', isActive: 1 });
        const lifeId = await this.dataService.addCluster({ name: 'Быт', isActive: 1 });

        // Массив активностей для массового добавления
        const activitiesToAdd = [
            // Работа
            { name: 'Планирование', clusterId: workId, isActive: 1 },
            { name: 'Совещание', clusterId: workId, isActive: 1 },
            { name: 'Кодинг', clusterId: workId, isActive: 1 },
            { name: 'Дизайн', clusterId: workId, isActive: 1 },

            // Отдых
            { name: 'Сон', clusterId: restId, isActive: 1 },
            { name: 'Просмотр контента', clusterId: restId, isActive: 1 },
            { name: 'Соцсети', clusterId: restId, isActive: 1 },
            { name: 'Ничегонеделание', clusterId: restId, isActive: 1 },

            // ФизАктивность
            { name: 'Зарядка', clusterId: physicalId, isActive: 1 },
            { name: 'Тренировка', clusterId: physicalId, isActive: 1 },
            { name: 'Прогулка', clusterId: physicalId, isActive: 1 },

            // Здоровье
            { name: 'Стоматолог', clusterId: healthId, isActive: 1 },
            { name: 'Аптека', clusterId: healthId, isActive: 1 },

            // Обучение
            { name: 'Чтение', clusterId: learnId, isActive: 1 },
            { name: 'Курсы', clusterId: learnId, isActive: 1 },
            { name: 'Английский', clusterId: learnId, isActive: 1 },
            { name: 'Пет-проект', clusterId: learnId, isActive: 1 },

            // Быт
            { name: 'Покупки', clusterId: lifeId, isActive: 1 },
            { name: 'Уборка', clusterId: lifeId, isActive: 1 },
            { name: 'Стирка', clusterId: lifeId, isActive: 1 },
            { name: 'Готовка', clusterId: lifeId, isActive: 1 },
        ];

        // Добавляем все активности в базу
        for (const activity of activitiesToAdd) {
            await this.dataService.addActivity(activity)
        }
    }
}