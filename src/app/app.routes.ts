import { Routes } from '@angular/router';
import { MonitoringComponent } from './pages/monitoring/monitoring';
import { StatisticsComponent } from './pages/statistics/statistics';
import { EditComponent } from './pages/edit/edit';

export const routes: Routes = [
  { path: '', redirectTo: '/monitoring', pathMatch: 'full' },
  { path: 'monitoring', component: MonitoringComponent },
  { path: 'statistics', component: StatisticsComponent },
  { path: 'edit', component: EditComponent },
  { path: '**', redirectTo: '/monitoring' }
];
