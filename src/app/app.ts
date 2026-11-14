import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LoanCalculatorComponent } from './components/loan-calculator/loan-calculator';

@Component({
  selector: 'app-root',
  imports: [LoanCalculatorComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
