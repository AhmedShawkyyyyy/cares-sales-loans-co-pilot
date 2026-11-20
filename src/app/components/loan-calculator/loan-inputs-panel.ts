import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import {
  APPLICANT_TYPES,
  BANKS,
  LOAN_TERMS,
  VEHICLE_TYPES,
  getQuickPercentOptions,
} from '../../data/banks-rates.data';
import { ApplicantType, BankId, LoanTermYears, VehicleType } from '../../models/loan.models';
import { LoanCalculatorService } from '../../services/loan-calculator.service';
import { formatAmount, formatPercent } from '../../utils/format.utils';
import { CurrencyInputComponent } from '../shared/currency-input/currency-input.component';
import { PercentInputComponent } from '../shared/percent-input/percent-input.component';

@Component({
  selector: 'app-loan-inputs-panel',
  imports: [CurrencyInputComponent, PercentInputComponent],
  templateUrl: './loan-inputs-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanInputsPanelComponent {
  protected readonly store = inject(LoanCalculatorService);

  protected readonly vehicleTypes = VEHICLE_TYPES;
  protected readonly banks = BANKS;
  protected readonly applicantTypes = APPLICANT_TYPES;
  protected readonly loanTerms = LOAN_TERMS;

  protected readonly quickPercents = computed<readonly number[]>(() =>
    getQuickPercentOptions(this.store.bankId(), this.store.vehicleType()),
  );

  protected readonly formatAmount = formatAmount;
  protected readonly formatPercent = formatPercent;

  protected selectVehicle(vehicleType: VehicleType): void {
    this.store.setVehicleType(vehicleType);
  }

  protected selectApplicant(applicantType: ApplicantType): void {
    this.store.setApplicantType(applicantType);
  }

  protected selectBank(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.store.setBank(select.value as BankId);
  }

  protected selectTerm(years: LoanTermYears): void {
    this.store.setYears(years);
  }

  protected isQuickPercentActive(percent: number): boolean {
    return Math.abs(this.store.downPaymentPercent() - percent) < 0.01;
  }

  protected resetBothFees(): void {
    this.store.resetAdminFee();
    this.store.resetInsuranceFee();
  }
}
