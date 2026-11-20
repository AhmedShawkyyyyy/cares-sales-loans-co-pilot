export type VehicleType = 'passenger' | 'quarterTruck' | 'jumbo';

export type BankId = 'ebank' | 'adib' | 'abe' | 'nbk';

export type ApplicantType = 'employee' | 'selfEmployed';

export type DownPaymentTier = 'tier25' | 'tier35' | 'tier40' | 'tier50';

export type LoanTermYears = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** ADIB passenger-car down payment tiers, expressed as percentage points. */
export type AdibPassengerTier = 20 | 30 | 35 | 40 | 45 | 50 | 55 | 60;

/** ADIB passenger-car tenure buckets used by the insurance rate matrix. */
export type AdibTermBucket = '1-2' | '3-5' | '6-7' | '8-10';

export interface InsuranceRatePair {
  readonly insured: number | null;
  readonly uninsured: number | null;
}

export type AdibPassengerRateTable = Record<
  AdibPassengerTier,
  Record<AdibTermBucket, InsuranceRatePair>
>;

export type YearlyRateTable = Record<LoanTermYears, number | null>;

export interface VehicleTypeOption {
  readonly id: VehicleType;
  readonly label: string;
  readonly description: string;
}

export interface BankOption {
  readonly id: BankId;
  readonly name: string;
  readonly shortName: string;
  readonly englishName: string;
}

export interface ApplicantTypeOption {
  readonly id: ApplicantType;
  readonly label: string;
  readonly description: string;
}

export interface DownPaymentTierOption {
  readonly id: DownPaymentTier;
  readonly label: string;
  readonly rangeLabel: string;
  readonly minInclusive: number;
  readonly maxExclusive: number | null;
}

export interface FeeDefaults {
  readonly adminFeePercent: number;
  readonly insurancePercent: number;
}

export interface RateRow {
  readonly employee: number;
  readonly selfEmployed: number;
}

export type EbankRateTable = Record<DownPaymentTier, Record<LoanTermYears, RateRow>>;

export interface LoanCalculation {
  readonly carPrice: number;
  readonly downPayment: number;
  readonly downPaymentPercent: number;
  readonly loanPrincipal: number;
  readonly annualRate: number;
  readonly years: LoanTermYears;
  readonly totalInstallments: number;
  readonly adminFeePercent: number;
  readonly adminFeeAmount: number;
  readonly insurancePercent: number;
  readonly insuranceAmount: number;
  readonly totalCashOnDelivery: number;
  readonly totalInterest: number;
  readonly totalPayable: number;
  readonly monthlyInstallment: number;
}

export type CopyState = 'idle' | 'copied' | 'error';
