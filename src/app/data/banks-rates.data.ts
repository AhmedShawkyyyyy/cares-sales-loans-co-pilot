import {
  AdibPassengerRateTable,
  AdibPassengerTier,
  AdibTermBucket,
  ApplicantType,
  ApplicantTypeOption,
  BankId,
  BankOption,
  DownPaymentTier,
  DownPaymentTierOption,
  EbankRateTable,
  FeeDefaults,
  LoanTermYears,
  RateRow,
  VehicleType,
  VehicleTypeOption,
  YearlyRateTable,
} from '../models/loan.models';

export const MIN_DOWN_PAYMENT_PERCENT = 25;
export const ADIB_MIN_DOWN_PAYMENT_PERCENT = 20;

export const VEHICLE_TYPES: readonly VehicleTypeOption[] = [
  { id: 'passenger', label: 'ملاكي', description: 'سيارة ركوب خاصة' },
  { id: 'quarterTruck', label: 'ربع نقل', description: 'شاحنة ربع نقل تجارية' },
  { id: 'jumbo', label: 'جامبو', description: 'شاحنة جامبو تجارية' },
];

export const BANKS: readonly BankOption[] = [
  {
    id: 'ebank',
    name: 'تنمية الصادرات (E-Bank)',
    shortName: 'تنمية الصادرات',
    englishName: 'E-Bank',
  },
  {
    id: 'adib',
    name: 'مصرف أبوظبي الإسلامي (ADIB)',
    shortName: 'أبوظبي الإسلامي',
    englishName: 'ADIB',
  },
  {
    id: 'abe',
    name: 'البنك الزراعي المصري (ABE)',
    shortName: 'البنك الزراعي',
    englishName: 'ABE',
  },
  {
    id: 'nbk',
    name: 'بنك الكويت الوطني (NBK)',
    shortName: 'الكويت الوطني',
    englishName: 'NBK',
  },
];

export const APPLICANT_TYPES: readonly ApplicantTypeOption[] = [
  { id: 'employee', label: 'موظف', description: 'راتب ثابت / تحويل بنكي' },
  { id: 'selfEmployed', label: 'صاحب عمل', description: 'نشاط تجاري / حر' },
];

export const DOWN_PAYMENT_TIERS: readonly DownPaymentTierOption[] = [
  {
    id: 'tier25',
    label: 'فئة 25%',
    rangeLabel: 'من 25% إلى أقل من 35%',
    minInclusive: 25,
    maxExclusive: 35,
  },
  {
    id: 'tier35',
    label: 'فئة 35%',
    rangeLabel: 'من 35% إلى أقل من 40%',
    minInclusive: 35,
    maxExclusive: 40,
  },
  {
    id: 'tier40',
    label: 'فئة 40%',
    rangeLabel: 'من 40% إلى أقل من 50%',
    minInclusive: 40,
    maxExclusive: 50,
  },
  {
    id: 'tier50',
    label: 'فئة 50%',
    rangeLabel: '50% أو أكثر',
    minInclusive: 50,
    maxExclusive: null,
  },
];

export const LOAN_TERMS: readonly LoanTermYears[] = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * E-Bank interest matrix for passenger cars (ملاكي).
 * Rows are loan terms in years; values are annual percentages.
 */
export const EBANK_PASSENGER_RATES: EbankRateTable = {
  tier25: {
    1: { employee: 13.5, selfEmployed: 14.35 },
    2: { employee: 13.5, selfEmployed: 14.35 },
    3: { employee: 13.75, selfEmployed: 14.7 },
    4: { employee: 14.15, selfEmployed: 15.1 },
    5: { employee: 14.5, selfEmployed: 15.6 },
    6: { employee: 15.3, selfEmployed: 16.4 },
    7: { employee: 15.7, selfEmployed: 16.85 },
    8: { employee: 16.1, selfEmployed: 17.3 },
  },
  tier35: {
    1: { employee: 12.8, selfEmployed: 13.4 },
    2: { employee: 12.8, selfEmployed: 13.4 },
    3: { employee: 13.0, selfEmployed: 13.7 },
    4: { employee: 13.4, selfEmployed: 14.0 },
    5: { employee: 13.8, selfEmployed: 14.5 },
    6: { employee: 14.5, selfEmployed: 15.2 },
    7: { employee: 14.9, selfEmployed: 15.7 },
    8: { employee: 15.3, selfEmployed: 16.0 },
  },
  tier40: {
    1: { employee: 12.3, selfEmployed: 12.9 },
    2: { employee: 12.3, selfEmployed: 12.85 },
    3: { employee: 12.5, selfEmployed: 13.1 },
    4: { employee: 12.8, selfEmployed: 13.5 },
    5: { employee: 13.14, selfEmployed: 13.8 },
    6: { employee: 13.85, selfEmployed: 14.55 },
    7: { employee: 14.2, selfEmployed: 14.9 },
    8: { employee: 14.55, selfEmployed: 15.3 },
  },
  tier50: {
    1: { employee: 11.75, selfEmployed: 12.3 },
    2: { employee: 11.66, selfEmployed: 12.3 },
    3: { employee: 11.9, selfEmployed: 12.5 },
    4: { employee: 12.15, selfEmployed: 12.8 },
    5: { employee: 12.5, selfEmployed: 13.14 },
    6: { employee: 13.15, selfEmployed: 13.85 },
    7: { employee: 13.5, selfEmployed: 14.2 },
    8: { employee: 13.8, selfEmployed: 14.55 },
  },
};

/** ADIB passenger-car down payment tiers. */
export const ADIB_PASSENGER_TIERS: readonly AdibPassengerTier[] = [20, 30, 35, 40, 45, 50, 55, 60];

/**
 * ADIB passenger-car annual rate matrix (ملاكي).
 * Rows are down payment tiers; columns are tenure buckets.
 * The same values apply to employees and business owners.
 */
export const ADIB_PASSENGER_RATES: AdibPassengerRateTable = {
  20: {
    '1-2': { insured: 15.54, uninsured: null },
    '3-5': { insured: 15.12, uninsured: null },
    '6-7': { insured: 16.66, uninsured: null },
    '8-10': { insured: null, uninsured: null },
  },
  30: {
    '1-2': { insured: 15.39, uninsured: 16.07 },
    '3-5': { insured: 14.96, uninsured: 15.63 },
    '6-7': { insured: 16.47, uninsured: 17.25 },
    '8-10': { insured: 17.94, uninsured: 18.79 },
  },
  35: {
    '1-2': { insured: 15.03, uninsured: 15.7 },
    '3-5': { insured: 14.55, uninsured: 15.22 },
    '6-7': { insured: 16.01, uninsured: 16.78 },
    '8-10': { insured: 17.43, uninsured: 18.28 },
  },
  40: {
    '1-2': { insured: 14.49, uninsured: 15.16 },
    '3-5': { insured: 13.46, uninsured: 14.13 },
    '6-7': { insured: 14.76, uninsured: 15.52 },
    '8-10': { insured: 16.04, uninsured: 16.88 },
  },
  45: {
    '1-2': { insured: 14.12, uninsured: 14.79 },
    '3-5': { insured: 13.07, uninsured: 13.72 },
    '6-7': { insured: 14.31, uninsured: 15.06 },
    '8-10': { insured: 15.55, uninsured: 16.37 },
  },
  50: {
    '1-2': { insured: 13.99, uninsured: 14.65 },
    '3-5': { insured: 12.97, uninsured: 13.63 },
    '6-7': { insured: 14.2, uninsured: 14.95 },
    '8-10': { insured: 15.42, uninsured: 16.25 },
  },
  55: {
    '1-2': { insured: 13.63, uninsured: 14.29 },
    '3-5': { insured: 12.58, uninsured: 13.23 },
    '6-7': { insured: 13.75, uninsured: 14.49 },
    '8-10': { insured: 14.93, uninsured: 15.75 },
  },
  60: {
    '1-2': { insured: null, uninsured: 13.85 },
    '3-5': { insured: null, uninsured: 12.84 },
    '6-7': { insured: null, uninsured: 14.04 },
    '8-10': { insured: null, uninsured: 15.25 },
  },
};

/** ADIB commercial (ربع نقل / جامبو) rates for 5 and 7 year tenures. */
export const ADIB_COMMERCIAL_RATES = {
  standard: { 5: 14.79, 7: 14.96 },
  highDownPayment: { 5: 14.28, 7: 14.45 },
} as const;

/** Egyptian Agricultural Bank (ABE) commercial rates by loan year. */
export const ABE_COMMERCIAL_RATES: YearlyRateTable = {
  1: 15.22,
  2: 15.26,
  3: 15.66,
  4: 16.14,
  5: 16.64,
  6: 17.15,
  7: 17.64,
  8: null,
};

const COMMERCIAL_FEES: Record<BankId, FeeDefaults> = {
  ebank: { adminFeePercent: 1.5, insurancePercent: 2.0 },
  adib: { adminFeePercent: 1.5, insurancePercent: 2.0 },
  abe: { adminFeePercent: 2.0, insurancePercent: 2.0 },
  nbk: { adminFeePercent: 1.5, insurancePercent: 2.0 },
};

const PASSENGER_STANDARD_FEES: Record<Exclude<BankId, 'ebank'>, FeeDefaults> = {
  adib: { adminFeePercent: 1.5, insurancePercent: 2.0 },
  abe: { adminFeePercent: 2.0, insurancePercent: 2.0 },
  nbk: { adminFeePercent: 1.5, insurancePercent: 2.0 },
};

const EBANK_PASSENGER_FEES: Record<DownPaymentTier, FeeDefaults> = {
  tier25: { adminFeePercent: 0, insurancePercent: 2.0 },
  tier35: { adminFeePercent: 0, insurancePercent: 0 },
  tier40: { adminFeePercent: 0, insurancePercent: 0 },
  tier50: { adminFeePercent: 0, insurancePercent: 0 },
};

/**
 * Maps a down payment percentage to its pricing tier.
 * Returns null when the down payment is below the 25% minimum.
 */
export function resolveDownPaymentTier(downPaymentPercent: number): DownPaymentTier | null {
  if (!Number.isFinite(downPaymentPercent)) {
    return null;
  }

  const normalizedPercent = Math.max(0, downPaymentPercent);

  for (const tier of DOWN_PAYMENT_TIERS) {
    const withinLowerBound = normalizedPercent >= tier.minInclusive - 1e-9;
    const withinUpperBound =
      tier.maxExclusive === null || normalizedPercent < tier.maxExclusive - 1e-9;

    if (withinLowerBound && withinUpperBound) {
      return tier.id;
    }
  }

  return null;
}

export function getTierOption(tier: DownPaymentTier): DownPaymentTierOption {
  return DOWN_PAYMENT_TIERS.find((option) => option.id === tier) ?? DOWN_PAYMENT_TIERS[0];
}

export function getBankOption(bankId: BankId): BankOption {
  return BANKS.find((bank) => bank.id === bankId) ?? BANKS[0];
}

export function getVehicleTypeOption(vehicleType: VehicleType): VehicleTypeOption {
  return VEHICLE_TYPES.find((vehicle) => vehicle.id === vehicleType) ?? VEHICLE_TYPES[0];
}

export function getApplicantTypeOption(applicantType: ApplicantType): ApplicantTypeOption {
  return APPLICANT_TYPES.find((applicant) => applicant.id === applicantType) ?? APPLICANT_TYPES[0];
}

/**
 * Returns the default admin and insurance percentages for a specific
 * bank / vehicle / down payment tier combination.
 */
export function getDefaultFees(
  bankId: BankId,
  vehicleType: VehicleType,
  tier: DownPaymentTier,
): FeeDefaults {
  if (vehicleType !== 'passenger') {
    return COMMERCIAL_FEES[bankId];
  }

  if (bankId === 'ebank') {
    return EBANK_PASSENGER_FEES[tier];
  }

  return PASSENGER_STANDARD_FEES[bankId];
}

/**
 * Human readable policy note shown in the tier banner and fee section.
 */
export function getFeePolicyNote(
  bankId: BankId,
  vehicleType: VehicleType,
  tier: DownPaymentTier,
): string {
  if (vehicleType !== 'passenger') {
    const fees = COMMERCIAL_FEES[bankId];
    return `سيارات النقل التجاري: مصاريف إدارية ${formatFeeValue(
      fees.adminFeePercent,
    )}% • تأمين إجباري ${formatFeeValue(fees.insurancePercent)}%`;
  }

  if (bankId === 'ebank') {
    return tier === 'tier25'
      ? 'بدون مصاريف إدارية • تأمين إجباري 2%'
      : 'بدون مصاريف إدارية • بدون تأمين';
  }

  const fees = PASSENGER_STANDARD_FEES[bankId];
  return `مصاريف إدارية ${formatFeeValue(
    fees.adminFeePercent,
  )}% • تأمين ${formatFeeValue(fees.insurancePercent)}%`;
}

/**
 * E-Bank passenger-car annual rate lookup.
 */
export function getEbankRate(
  tier: DownPaymentTier,
  years: LoanTermYears,
  applicantType: ApplicantType,
): number {
  const row: RateRow = EBANK_PASSENGER_RATES[tier][years];
  return applicantType === 'employee' ? row.employee : row.selfEmployed;
}

/** Minimum accepted down payment for the selected bank. */
export function getMinDownPaymentPercent(bankId: BankId): number {
  if (bankId === 'adib') {
    return ADIB_MIN_DOWN_PAYMENT_PERCENT;
  }

  return MIN_DOWN_PAYMENT_PERCENT;
}

/** Maps a down payment percentage to the matching ADIB passenger tier. */
export function resolveAdibPassengerTier(downPaymentPercent: number): AdibPassengerTier | null {
  if (!Number.isFinite(downPaymentPercent)) {
    return null;
  }

  const normalizedPercent = Math.max(0, downPaymentPercent);

  for (let index = ADIB_PASSENGER_TIERS.length - 1; index >= 0; index -= 1) {
    const tier = ADIB_PASSENGER_TIERS[index];
    if (normalizedPercent >= tier - 1e-9) {
      return tier;
    }
  }

  return null;
}

/** Maps a loan tenure to an ADIB passenger tenure bucket. */
export function getAdibTermBucket(years: LoanTermYears): AdibTermBucket {
  if (years <= 2) {
    return '1-2';
  }

  if (years <= 5) {
    return '3-5';
  }

  if (years <= 7) {
    return '6-7';
  }

  return '8-10';
}

/** ADIB passenger annual rate for a tier / tenure / insurance combination. */
export function getAdibPassengerRate(
  tier: AdibPassengerTier,
  years: LoanTermYears,
  insured: boolean,
): number | null {
  const pair = ADIB_PASSENGER_RATES[tier][getAdibTermBucket(years)];
  return insured ? pair.insured : pair.uninsured;
}

/** ADIB commercial annual rate for the current down payment and tenure. */
export function getAdibCommercialRate(
  downPaymentPercent: number,
  years: LoanTermYears,
): number | null {
  if (!Number.isFinite(downPaymentPercent)) {
    return null;
  }

  if (downPaymentPercent < ADIB_MIN_DOWN_PAYMENT_PERCENT - 1e-9) {
    return null;
  }

  if (years !== 5 && years !== 7) {
    return null;
  }

  const rates =
    downPaymentPercent >= 50
      ? ADIB_COMMERCIAL_RATES.highDownPayment
      : ADIB_COMMERCIAL_RATES.standard;

  return rates[years];
}

/** ABE commercial annual rate by loan year (1–7). */
export function getAbeCommercialRate(years: LoanTermYears): number | null {
  return ABE_COMMERCIAL_RATES[years] ?? null;
}

/** Whether the current bank / vehicle combination has an automatic rate table. */
export function usesAutomaticRate(bankId: BankId, vehicleType: VehicleType): boolean {
  if (bankId === 'ebank') {
    return vehicleType === 'passenger';
  }

  if (bankId === 'adib') {
    return true;
  }

  if (bankId === 'abe') {
    return vehicleType !== 'passenger';
  }

  return false;
}

/** Quick down payment percentages relevant for the current selection. */
export function getQuickPercentOptions(
  bankId: BankId,
  vehicleType: VehicleType,
): readonly number[] {
  if (bankId === 'adib' && vehicleType === 'passenger') {
    return ADIB_PASSENGER_TIERS;
  }

  if (bankId === 'adib') {
    return [20, 30, 40, 50];
  }

  return [25, 35, 40, 50];
}

function formatFeeValue(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}
