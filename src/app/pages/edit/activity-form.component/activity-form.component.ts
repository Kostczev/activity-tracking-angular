import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Cluster } from '../../../core/interfaces/db.interface';
import { DataService } from '../../../core/services/data.service';
import { FormsModule } from '@angular/forms';
import { SearchSelectComponent } from "../../../ui/search-select.component/search-select.component";

@Component({
  selector: 'app-activity-form-component',
  imports: [FormsModule, SearchSelectComponent],
  templateUrl: './activity-form.component.html',
  styleUrl: './activity-form.component.scss'
})
export class ActivityFormComponent {
  @Output() success = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  activityName = '';
  searchTerm = '';
  successMessage = '';
  selectedCluster: Cluster | null = null;
  filteredClusters: Cluster[] = [];
  errorMessageFromActivity = '';
  errorMessageFromCluster = '';
  errorMessage = '';
  isLoading = false;

  constructor(private dataService: DataService) { }

  searchClusters = (term: string) => {
    return this.dataService.searchClasters(term.trim());
  }

  onClusterSelected(cluster: Cluster) {
    this.selectedCluster = cluster;
  }

  filterClusters() {
    this.filteredClusters = this.dataService.searchClasters(this.searchTerm.trim())
  }

  get canCreate(): boolean {
    this.errorMessageFromActivity = '';
    this.errorMessageFromCluster = '';

    const isNotNullActivity = this.activityName.trim().length > 0
    if (!isNotNullActivity) {
      this.errorMessageFromActivity = 'Пустое значение';
    }

    const isDelectedCluster = this.selectedCluster !== null
    if (!isDelectedCluster) {
      this.errorMessageFromCluster = 'Пустое значение'
    }

    return isNotNullActivity && isDelectedCluster;
  }

  async createActivity() {
    this.successMessage = '';
    if (!this.canCreate) return;

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Проверка на уникальность названия
      const isUnique = await this.dataService.isActivityNameUnique(this.activityName.trim(), this.selectedCluster!.id!);

      if (!isUnique) {
        this.errorMessageFromActivity = 'Активность с таким названием уже существует';
        this.isLoading = false;
        return;
      }

      // Создание активности
      await this.dataService.addActivity({
        name: this.activityName.trim(),
        clusterId: this.selectedCluster!.id!,
        isActive: 1
      });

      // Сброс формы
      this.activityName = '';
      this.selectedCluster = null;
      this.searchTerm = '';
      this.successMessage = 'Успешное создание';

      this.success.emit();

    } catch (error) {
      this.errorMessage = 'Ошибка при создании активности';
      console.error('Create activity error:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
