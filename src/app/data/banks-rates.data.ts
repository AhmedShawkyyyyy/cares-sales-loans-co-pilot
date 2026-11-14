import {
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
} from '../models/loan.models';

export const MIN_DOWN_PAYMENT_PERCENT = 25;

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

export function usesAutomaticRate(bankId: BankId, vehicleType: VehicleType): boolean {
  return bankId === 'ebank' && vehicleType === 'passenger';
}

function formatFeeValue(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
}
