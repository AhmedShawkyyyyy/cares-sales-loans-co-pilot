import { Routes } from '@angular/router';

export const CALCULATOR_TITLE = 'حاسبة تمويل السيارات | Car Sales Specialist Co-Pilot';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'calculator',
  },
  {
    path: 'calculator',
    loadComponent: () =>
      import('./components/loan-calculator/loan-calculator').then(
        (module) => module.LoanCalculatorComponent,
      ),
    title: CALCULATOR_TITLE,
  },
  {
    path: 'loan-calculator',
    redirectTo: 'calculator',
  },
  {
    path: '**',
    redirectTo: 'calculator',
  },
];
