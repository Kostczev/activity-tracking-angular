import { Component, EventEmitter, Output } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cluster-form-component',
  imports: [FormsModule],
  templateUrl: './cluster-form.component.html',
  styleUrl: './cluster-form.component.scss'
})
export class ClusterFormComponent {
  @Output() success = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  clusterName = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(private dataService: DataService) { }

  async createCluster() {
    this.successMessage = '';
    if (!this.clusterName.trim()) {
      this.errorMessage = 'Пустое значение';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Проверка на уникальность
      const isUnique = await this.dataService.isClusterNameUnique(this.clusterName.trim());

      if (!isUnique) {
        this.errorMessage = 'Кластер с таким названием уже существует';
        this.isLoading = false;
        return;
      }

      // Создание кластера
      await this.dataService.addCluster({
        name: this.clusterName.trim(),
        isActive: 1
      });

      this.clusterName = '';
      this.successMessage = 'Успешное создание';
      this.success.emit();

    } catch (error) {
      this.errorMessage = 'Ошибка при создании кластера';
      console.error('Create cluster error:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
