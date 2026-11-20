import { Injectable, computed, signal } from '@angular/core';
import {
  AdibPassengerTier,
  ApplicantType,
  BankId,
  DownPaymentTier,
  LoanCalculation,
  LoanTermYears,
  VehicleType,
} from '../models/loan.models';
import {
  getAbeCommercialRate,
  getAdibCommercialRate,
  getAdibPassengerRate,
  getDefaultFees,
  getEbankRate,
  getFeePolicyNote,
  getMinDownPaymentPercent,
  getTierOption,
  resolveAdibPassengerTier,
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

const INITIAL_CAR_PRICE = 0;
const INITIAL_DOWN_PAYMENT = 0;
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

  /** ADIB passenger-car mandatory insurance choice (تأمين إجباري: نعم / لا). */
  readonly adibInsured = signal<boolean>(true);

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
    const downPayment = this.downPayment();

    if (price <= 0 || downPayment <= 0) {
      return 0;
    }

    return (downPayment / price) * 100;
  });

  /** Detected pricing tier, or null when the down payment is below 25%. */
  readonly tier = computed<DownPaymentTier | null>(() =>
    resolveDownPaymentTier(this.downPaymentPercent()),
  );

  /** Tier used for lookups while the minimum-payment warning is displayed. */
  readonly effectiveTier = computed<DownPaymentTier>(() => this.tier() ?? 'tier25');

  /** True only for ADIB passenger cars, where the insurance toggle applies. */
  readonly isAdibPassenger = computed<boolean>(
    () => this.bankId() === 'adib' && this.vehicleType() === 'passenger',
  );

  /** ADIB passenger tier derived from the current down payment percentage. */
  readonly adibPassengerTier = computed<AdibPassengerTier | null>(() =>
    this.isAdibPassenger() ? resolveAdibPassengerTier(this.downPaymentPercent()) : null,
  );

  readonly minimumDownPaymentPercent = computed<number>(() =>
    getMinDownPaymentPercent(this.bankId()),
  );

  readonly tierLabel = computed<string>(() => {
    if (this.downPayment() <= 0) {
      return 'بدون مقدم';
    }

    if (this.bankId() === 'adib') {
      if (this.vehicleType() === 'passenger') {
        const adibTier = this.adibPassengerTier();
        return adibTier === null
          ? `أقل من ${this.minimumDownPaymentPercent()}%`
          : `فئة ${adibTier}%`;
      }

      if (this.downPaymentPercent() < this.minimumDownPaymentPercent() - 1e-9) {
        return `أقل من ${this.minimumDownPaymentPercent()}%`;
      }

      return this.downPaymentPercent() >= 50 ? 'فئة 50% فأكثر' : 'فئة 20%';
    }

    return getTierOption(this.effectiveTier()).label;
  });

  readonly belowMinimum = computed<boolean>(() => {
    if (this.carPrice() <= 0 || this.downPayment() <= 0) {
      return false;
    }

    return this.downPaymentPercent() < this.minimumDownPaymentPercent() - 1e-9;
  });

  readonly defaultFees = computed(() =>
    getDefaultFees(this.bankId(), this.vehicleType(), this.effectiveTier()),
  );

  readonly feesOverridden = computed<boolean>(
    () => this.adminFeeIsManual() || this.insuranceFeeIsManual(),
  );

  readonly isAutomaticRate = computed<boolean>(() =>
    usesAutomaticRate(this.bankId(), this.vehicleType()),
  );

  /** Rate coming from the active bank table, when the current context supports it. */
  readonly tableRate = computed<number | null>(() => {
    if (!this.isAutomaticRate()) {
      return null;
    }

    const bankId = this.bankId();
    const vehicleType = this.vehicleType();
    const years = this.years();

    if (bankId === 'ebank' && vehicleType === 'passenger') {
      return getEbankRate(this.effectiveTier(), years, this.applicantType());
    }

    if (bankId === 'adib' && vehicleType === 'passenger') {
      const adibTier = this.adibPassengerTier();
      return adibTier === null ? null : getAdibPassengerRate(adibTier, years, this.adibInsured());
    }

    if (bankId === 'adib') {
      return getAdibCommercialRate(this.downPaymentPercent(), years);
    }

    if (bankId === 'abe' && vehicleType !== 'passenger') {
      return getAbeCommercialRate(years);
    }

    return null;
  });

  readonly annualRate = computed<number>(() => this._manualRate() ?? this.tableRate() ?? 0);

  /** Value bound to the interest-rate input (null renders as an empty field). */
  readonly rateInputValue = computed<number | null>(() => this._manualRate() ?? this.tableRate());

  /** True when a table rate exists and has been replaced manually. */
  readonly rateOverridden = computed<boolean>(
    () => this.tableRate() !== null && this._manualRate() !== null,
  );

  readonly rateMissing = computed<boolean>(
    () => this.tableRate() === null && this._manualRate() === null,
  );

  /** Contextual explanation shown when no table rate is available. */
  readonly rateTableNote = computed<string>(() => {
    if (!this.isAutomaticRate()) {
      return '';
    }

    const bankId = this.bankId();
    const vehicleType = this.vehicleType();

    if (bankId === 'adib' && vehicleType === 'passenger') {
      if (
        this.downPayment() <= 0 ||
        this.downPaymentPercent() < this.minimumDownPaymentPercent() - 1e-9
      ) {
        return `أدخل مقدمًا لا يقل عن ${this.minimumDownPaymentPercent()}% لتفعيل جدول أسعار ADIB.`;
      }

      return this.adibInsured()
        ? 'لا يتوفر سعر تلقائي لهذه الفئة أو المدة مع التأمين الإجباري — أدخل سعر الفائدة يدوياً.'
        : 'لا يتوفر سعر تلقائي لهذه الفئة أو المدة بدون تأمين إجباري — أدخل سعر الفائدة يدوياً.';
    }

    if (bankId === 'adib') {
      if (this.downPaymentPercent() < this.minimumDownPaymentPercent() - 1e-9) {
        return `الحد الأدنى للمقدم التجاري في ADIB هو ${this.minimumDownPaymentPercent()}%.`;
      }

      return 'أسعار ADIB التجارية متاحة لمدة 5 أو 7 سنوات فقط — أدخل سعر الفائدة يدوياً.';
    }

    if (bankId === 'abe') {
      return 'جدول البنك الزراعي يغطي من 1 إلى 7 سنوات — أدخل سعر الفائدة يدوياً.';
    }

    return 'لا يتوفر سعر تلقائي لهذه التركيبة — أدخل سعر الفائدة يدوياً.';
  });

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
    this._manualRate.set(null);
  }

  setBank(bankId: BankId): void {
    if (bankId === this.bankId()) {
      return;
    }

    this.bankId.set(bankId);
    this.applyFeeDefaults();
    this._manualRate.set(null);
  }

  setApplicantType(applicantType: ApplicantType): void {
    this.applicantType.set(applicantType);
  }

  setCarPrice(value: number): void {
    if (!Number.isFinite(value)) {
      return;
    }

    const previousTier = this.tier();
    const wasForcedManualRate = this.isForcedManualRate();
    const nextPrice = Math.max(0, Math.round(value));

    this.carPrice.set(nextPrice);

    if (this.downPayment() > nextPrice) {
      this.downPayment.set(nextPrice);
    }

    if (this.tier() !== previousTier) {
      this.applyFeeDefaults();
    }

    this.applyTableRateIfResolved(wasForcedManualRate);
  }

  setDownPayment(value: number): void {
    if (!Number.isFinite(value)) {
      return;
    }

    const previousTier = this.tier();
    const wasForcedManualRate = this.isForcedManualRate();
    const nextDownPayment = clamp(Math.round(value), 0, this.carPrice());

    this.downPayment.set(nextDownPayment);

    if (this.tier() !== previousTier) {
      this.applyFeeDefaults();
    }

    this.applyTableRateIfResolved(wasForcedManualRate);
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
    const wasForcedManualRate = this.isForcedManualRate();
    this.years.set(years);
    this.applyTableRateIfResolved(wasForcedManualRate);
  }

  setAdibInsured(insured: boolean): void {
    if (this.adibInsured() === insured) {
      return;
    }

    this.adibInsured.set(insured);
    this._manualRate.set(null);
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

  resetRate(): void {
    this._manualRate.set(null);
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
    this.adibInsured.set(true);
    this._manualRate.set(null);
    this.adminFeeIsManual.set(false);
    this.insuranceFeeIsManual.set(false);
    this.applyFeeDefaults();
  }

  /** Builds a clean, concise Arabic WhatsApp-ready quote summary. */
  buildQuote(): string {
    const calc = this.calculation();
    const purchaseType = calc.loanPrincipal > 0 ? 'قسط' : 'كاش';

    return [
      `مبلغ السيارة: ${formatAmount(calc.carPrice)} ج.م`,
      `نوع الشراء: ${purchaseType}`,
      `مبلغ القسط: ${formatAmount(calc.monthlyInstallment)} ج.م`,
      `عدد السنوات: ${calc.years}`,
      `المصاريف الإدارية على التمويل: ${formatAmount(calc.adminFeeAmount)} ج.م`,
      `التأمين على السيارة: ${formatAmount(calc.insuranceAmount)} ج.م`,
    ].join('\n');
  }

  /** Formatted car price for the masked currency input. */
  carPriceInputValue(): string {
    return formatThousandsInput(this.carPrice());
  }

  downPaymentInputValue(): string {
    return formatThousandsInput(this.downPayment());
  }

  /** Manual rate entered only because the selected combination had no table value. */
  private isForcedManualRate(): boolean {
    return this._manualRate() !== null && this.tableRate() === null;
  }

  /** Restores automatic pricing once a table value becomes available again. */
  private applyTableRateIfResolved(wasForcedManualRate: boolean): void {
    if (wasForcedManualRate && this.tableRate() !== null) {
      this._manualRate.set(null);
    }
  }

  private applyFeeDefaults(): void {
    const defaults = this.defaultFees();
    this._adminFeePercent.set(defaults.adminFeePercent);
    this._insurancePercent.set(defaults.insurancePercent);
    this.adminFeeIsManual.set(false);
    this.insuranceFeeIsManual.set(false);
  }
}
