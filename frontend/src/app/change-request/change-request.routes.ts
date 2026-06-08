import { Routes } from '@angular/router';

export const changeRequestRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./change-request-list/change-request-list').then(m => m.ChangeRequestList),
  },
];
