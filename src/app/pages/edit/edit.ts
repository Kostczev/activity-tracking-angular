import { Component, OnInit } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { ClusterFormComponent } from "./cluster-form.component/cluster-form.component";
import { ActivityFormComponent } from "./activity-form.component/activity-form.component";

@Component({
  selector: 'app-edit',
  imports: [ClusterFormComponent, ActivityFormComponent],
  templateUrl: './edit.html',
  styleUrl: './edit.scss'
})
export class EditComponent {
  showClusterForm = false;
  showActivityForm = false;

  // clusters$ = 

  constructor(private dataService: DataService) { }

  // ngOnInit(): void {
  //   clusters$ = this.dataService.getAllClusters();
  // }

  toggleClusterForm() {
    this.showClusterForm = !this.showClusterForm;
  }

  toggleActivityForm() {
    this.showActivityForm = !this.showActivityForm;
  }

  onFormSuccess(formType: 'cluster' | 'activity') {
    // Можно показать уведомление
    console.log(`${formType} created successfully`);
  }
}
