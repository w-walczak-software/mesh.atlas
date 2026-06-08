import { Routes } from '@angular/router';

export const subscriptionRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./my-subscriptions/my-subscriptions').then(m => m.MySubscriptions),
  },
];
