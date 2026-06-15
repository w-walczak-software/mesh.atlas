import { Routes } from '@angular/router';

export const integrationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pipelines/pipeline-list').then(m => m.PipelineList),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pipelines/pipeline-form').then(m => m.PipelineForm),
  },
  {
    path: 'datasources',
    loadComponent: () =>
      import('./datasources/datasource-list').then(m => m.DatasourceList),
  },
  {
    path: 'datasources/new',
    loadComponent: () =>
      import('./datasources/datasource-form').then(m => m.DatasourceForm),
  },
  {
    path: 'datasources/:id',
    loadComponent: () =>
      import('./datasources/datasource-form').then(m => m.DatasourceForm),
  },
  {
    path: 'sync-registry',
    loadComponent: () =>
      import('./sync-registry/sync-registry-list').then(m => m.SyncRegistryList),
  },
  {
    path: 'sync-registry/:id',
    loadComponent: () =>
      import('./sync-registry/sync-registry-detail').then(m => m.SyncRegistryDetail),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pipelines/pipeline-form').then(m => m.PipelineForm),
  },
];
