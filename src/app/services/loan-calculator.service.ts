import { Injectable, computed, signal } from '@angular/core';
import {
  ApplicantType,
  BankId,
  DownPaymentTier,
  LoanCalculation,
  LoanTermYears,
  VehicleType,
} from '../models/loan.models';
import {
  MIN_DOWN_PAYMENT_PERCENT,
  getApplicantTypeOption,
  getBankOption,
  getDefaultFees,
  getEbankRate,
  getFeePolicyNote,
  getTierOption,
  getVehicleTypeOption,
  resolveDownPaymentTier,
  usesAutomaticRate,
} from '../data/banks-rates.data';
import {
  clamp,
  formatAmount,
  formatPercent,
  formatThousandsInput,
  roundPercent,
} from '../utils/format.utils';

const INITIAL_CAR_PRICE = 1_500_000;
const INITIAL_DOWN_PAYMENT = 375_000;
const INITIAL_YEARS: LoanTermYears = 5;
const MAX_PERCENT = 100;

const INITIAL_FEES = getDefaultFees('ebank', 'passenger', 'tier25');

@Injectable({ providedIn: 'root' })
export class LoanCalculatorService {
  readonly vehicleType = signal<VehicleType>('passenger');
  readonly bankId = signal<BankId>('ebank');
  readonly applicantType = signal<ApplicantType>('employee');
  readonly carPrice = signal<number>(INITIAL_CAR_PRICE);
  readonly downPayment = signal<number>(INITIAL_DOWN_PAYMENT);
  readonly years = signal<LoanTermYears>(INITIAL_YEARS);

  private readonly _manualRate = signal<number | null>(null);
  private readonly _adminFeePercent = signal<number>(INITIAL_FEES.adminFeePercent);
  private readonly _insurancePercent = signal<number>(INITIAL_FEES.insurancePercent);

  readonly manualRate = this._manualRate.asReadonly();
  readonly adminFeePercent = this._adminFeePercent.asReadonly();
  readonly insurancePercent = this._insurancePercent.asReadonly();

  readonly adminFeeIsManual = signal<boolean>(false);
  readonly insuranceFeeIsManual = signal<boolean>(false);

  readonly downPaymentPercent = computed<number>(() => {
    const price = this.carPrice();
    if (price <= 0) {
      return 0;
    }

    return (this.downPayment() / price) * 100;
  });

  /** Detected pricing tier, or null when the down payment is below 25%. */
  readonly tier = computed<DownPaymentTier | null>(() =>
    resolveDownPaymentTier(this.downPaymentPercent()),
  );

  /** Tier used for lookups while the minimum-payment warning is displayed. */
  readonly effectiveTier = computed<DownPaymentTier>(() => this.tier() ?? 'tier25');

  readonly tierLabel = computed<string>(() => getTierOption(this.effectiveTier()).label);

  readonly belowMinimum = computed<boolean>(
    () => this.carPrice() <= 0 || this.downPaymentPercent() < MIN_DOWN_PAYMENT_PERCENT,
  );

  readonly defaultFees = computed(() =>
    getDefaultFees(this.bankId(), this.vehicleType(), this.effectiveTier()),
  );

  readonly feesOverridden = computed<boolean>(
    () => this.adminFeeIsManual() || this.insuranceFeeIsManual(),
  );

  readonly isAutomaticRate = computed<boolean>(() =>
    usesAutomaticRate(this.bankId(), this.vehicleType()),
  );

  /** Rate coming from the E-Bank table, when the current context supports it. */
  readonly tableRate = computed<number | null>(() => {
    if (!this.isAutomaticRate()) {
      return null;
    }

    return getEbankRate(this.effectiveTier(), this.years(), this.applicantType());
  });

  readonly annualRate = computed<number>(() => this.tableRate() ?? this._manualRate() ?? 0);

  readonly rateMissing = computed<boolean>(
    () => !this.isAutomaticRate() && this._manualRate() === null,
  );

  /** True when the quote has everything needed for a meaningful result. */
  readonly ready = computed<boolean>(() => this.carPrice() > 0 && !this.rateMissing());

  readonly feePolicyNote = computed<string>(() => {
    if (this.feesOverridden()) {
      return `نسب معدّلة يدوياً: مصاريف إدارية ${formatPercent(
        this.adminFeePercent(),
      )}% • تأمين ${formatPercent(this.insurancePercent())}%`;
    }

    return getFeePolicyNote(this.bankId(), this.vehicleType(), this.effectiveTier());
  });

  readonly calculation = computed<LoanCalculation>(() => {
    const carPrice = Math.max(0, this.carPrice());
    const downPayment = clamp(this.downPayment(), 0, carPrice);
    const loanPrincipal = Math.max(0, carPrice - downPayment);
    const annualRate = Math.max(0, this.annualRate());
    const years = this.years();
    const totalInstallments = years * 12;
    const adminFeePercent = clamp(this._adminFeePercent(), 0, MAX_PERCENT);
    const insurancePercent = clamp(this._insurancePercent(), 0, MAX_PERCENT);

    const totalInterest = loanPrincipal * (annualRate / MAX_PERCENT) * years;
    const totalPayable = loanPrincipal + totalInterest;
    const monthlyInstallment = totalInstallments > 0 ? totalPayable / totalInstallments : 0;
    const adminFeeAmount = loanPrincipal * (adminFeePercent / MAX_PERCENT);
    const insuranceAmount = carPrice * (insurancePercent / MAX_PERCENT);
    const totalCashOnDelivery = downPayment + adminFeeAmount + insuranceAmount;

    return {
      carPrice,
      downPayment,
      downPaymentPercent: carPrice > 0 ? (downPayment / carPrice) * 100 : 0,
      loanPrincipal,
      annualRate,
      years,
      totalInstallments,
      adminFeePercent,
      adminFeeAmount,
      insurancePercent,
      insuranceAmount,
      totalCashOnDelivery,
      totalInterest,
      totalPayable,
      monthlyInstallment,
    };
  });

  setVehicleType(vehicleType: VehicleType): void {
    if (vehicleType === this.vehicleType()) {
      return;
    }

    this.vehicleType.set(vehicleType);
    this.applyFeeDefaults();

    if (!this.isAutomaticRate()) {
      this._manualRate.set(null);
    }
  }

  setBank(bankId: BankId): void {
    if (bankId === this.bankId()) {
      return;
    }

    this.bankId.set(bankId);
    this.applyFeeDefaults();

    if (!this.isAutomaticRate()) {
      this._manualRate.set(null);
    }
  }

  setApplicantType(applicantType: ApplicantType): void {
    this.applicantType.set(applicantType);
  }

  setCarPrice(value: number): void {
    if (!Number.isFinite(value)) {
      return;
    }

    const previousTier = this.tier();
    const nextPrice = Math.max(0, Math.round(value));

    this.carPrice.set(nextPrice);

    if (this.downPayment() > nextPrice) {
      this.downPayment.set(nextPrice);
    }

    if (this.tier() !== previousTier) {
      this.applyFeeDefaults();
    }
  }

  setDownPayment(value: number): void {
    if (!Number.isFinite(value)) {
      return;
    }

    const previousTier = this.tier();
    const nextDownPayment = clamp(Math.round(value), 0, this.carPrice());

    this.downPayment.set(nextDownPayment);

    if (this.tier() !== previousTier) {
      this.applyFeeDefaults();
    }
  }

  setDownPaymentPercent(percent: number): void {
    if (!Number.isFinite(percent) || this.carPrice() <= 0) {
      return;
    }

    const safePercent = clamp(percent, 0, MAX_PERCENT);
    const amount = Math.ceil((this.carPrice() * safePercent) / MAX_PERCENT);

    this.setDownPayment(amount);
  }

  setYears(years: LoanTermYears): void {
    this.years.set(years);
  }

  setManualRate(value: number | null): void {
    if (value === null) {
      this._manualRate.set(null);
      return;
    }

    if (!Number.isFinite(value)) {
      return;
    }

    this._manualRate.set(roundPercent(clamp(value, 0, MAX_PERCENT)));
  }

  setAdminFeePercent(value: number): void {
    if (!Number.isFinite(value)) {
      return;
    }

    this._adminFeePercent.set(roundPercent(clamp(value, 0, MAX_PERCENT)));
    this.adminFeeIsManual.set(true);
  }

  setInsurancePercent(value: number): void {
    if (!Number.isFinite(value)) {
      return;
    }

    this._insurancePercent.set(roundPercent(clamp(value, 0, MAX_PERCENT)));
    this.insuranceFeeIsManual.set(true);
  }

  resetAdminFee(): void {
    this._adminFeePercent.set(this.defaultFees().adminFeePercent);
    this.adminFeeIsManual.set(false);
  }

  resetInsuranceFee(): void {
    this._insurancePercent.set(this.defaultFees().insurancePercent);
    this.insuranceFeeIsManual.set(false);
  }

  resetAll(): void {
    this.vehicleType.set('passenger');
    this.bankId.set('ebank');
    this.applicantType.set('employee');
    this.carPrice.set(INITIAL_CAR_PRICE);
    this.downPayment.set(INITIAL_DOWN_PAYMENT);
    this.years.set(INITIAL_YEARS);
    this._manualRate.set(null);
    this.adminFeeIsManual.set(false);
    this.insuranceFeeIsManual.set(false);
    this.applyFeeDefaults();
  }

  /** Builds a clean Arabic WhatsApp-ready quote summary. */
  buildQuote(): string {
    const calc = this.calculation();
    const bank = getBankOption(this.bankId());
    const vehicle = getVehicleTypeOption(this.vehicleType());
    const applicant = getApplicantTypeOption(this.applicantType());
    const tier = getTierOption(this.effectiveTier());

    const lines: string[] = [
      '*عرض تمويل سيارة*',
      `البنك: ${bank.name}`,
      `نوع السيارة: ${vehicle.label}`,
      `نوع العميل: ${applicant.label}`,
      `فئة المقدم: ${tier.label}`,
      '',
      `سعر السيارة: ${formatAmount(calc.carPrice)} ج.م`,
      `المقدم: ${formatAmount(calc.downPayment)} ج.م (${formatPercent(calc.downPaymentPercent)}%)`,
      `مبلغ التمويل: ${formatAmount(calc.loanPrincipal)} ج.م`,
      `مدة القرض: ${calc.years} سنوات (${calc.totalInstallments} قسط)`,
      `سعر الفائدة السنوية: ${formatPercent(calc.annualRate)}%`,
      '',
      `*القسط الشهري: ${formatAmount(calc.monthlyInstallment)} ج.م*`,
      `المصاريف الإدارية: ${formatAmount(
        calc.adminFeeAmount,
      )} ج.م (${formatPercent(calc.adminFeePercent)}%)`,
      `مصاريف التأمين: ${formatAmount(
        calc.insuranceAmount,
      )} ج.م (${formatPercent(calc.insurancePercent)}%)`,
      `*إجمالي المطلوب كاش عند الاستلام: ${formatAmount(calc.totalCashOnDelivery)} ج.م*`,
      '',
      `إجمالي الفوائد: ${formatAmount(calc.totalInterest)} ج.م`,
      `إجمالي المبلغ المسدد: ${formatAmount(calc.totalPayable)} ج.م`,
    ];

    if (this.belowMinimum()) {
      lines.push('', 'تنبيه: قيمة المقدم أقل من الحد الأدنى 25%، الحساب المعروض تقديري.');
    }

    lines.push('', '_الحساب تقديري ويخضع لموافقة البنك النهائية._');

    return lines.join('\n');
  }

  /** Formatted car price for the masked currency input. */
  carPriceInputValue(): string {
    return formatThousandsInput(this.carPrice());
  }

  downPaymentInputValue(): string {
    return formatThousandsInput(this.downPayment());
  }

  private applyFeeDefaults(): void {
    const defaults = this.defaultFees();
    this._adminFeePercent.set(defaults.adminFeePercent);
    this._insurancePercent.set(defaults.insurancePercent);
    this.adminFeeIsManual.set(false);
    this.insuranceFeeIsManual.set(false);
  }
}
