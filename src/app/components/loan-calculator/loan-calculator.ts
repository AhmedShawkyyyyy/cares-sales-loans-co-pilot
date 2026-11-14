import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoanCalculatorService } from '../../services/loan-calculator.service';
import { LoanInputsPanelComponent } from './loan-inputs-panel';
import { LoanResultsPanelComponent } from './loan-results-panel';

@Component({
  selector: 'app-loan-calculator',
  imports: [LoanInputsPanelComponent, LoanResultsPanelComponent],
  templateUrl: './loan-calculator.html',
  styleUrl: './loan-calculator.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanCalculatorComponent {
  protected readonly store = inject(LoanCalculatorService);
}
