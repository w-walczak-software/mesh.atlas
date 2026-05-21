import { Routes } from '@angular/router';
import { atlasAdminGuard } from '@core/auth/auth.guard';

export const dictionaryRoutes: Routes = [
  {
    path: '',
    redirectTo: 'types',
    pathMatch: 'full',
  },
  {
    path: 'types',
    canActivate: [atlasAdminGuard],
    loadComponent: () =>
      import('./dictionary-types/dictionary-types').then(m => m.DictionaryTypes),
  },
  {
    path: 'types/:id/entries',
    canActivate: [atlasAdminGuard],
    loadComponent: () =>
      import('./dictionary-entries/dictionary-entries').then(m => m.DictionaryEntries),
  },
];
