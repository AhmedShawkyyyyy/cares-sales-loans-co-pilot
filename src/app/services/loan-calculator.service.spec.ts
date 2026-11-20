import { LoanCalculatorService } from './loan-calculator.service';

describe('LoanCalculatorService', () => {
  let service: LoanCalculatorService;

  const seedEbankQuote = (): void => {
    service.setCarPrice(1_500_000);
    service.setDownPayment(375_000);
  };

  beforeEach(() => {
    service = new LoanCalculatorService();
  });

  it('starts with empty car price and down payment inputs', () => {
    expect(service.carPrice()).toBe(0);
    expect(service.downPayment()).toBe(0);
    expect(service.downPaymentPercent()).toBe(0);
    expect(service.belowMinimum()).toBe(false);
    expect(service.ready()).toBe(false);

    const calc = service.calculation();
    expect(calc.carPrice).toBe(0);
    expect(calc.downPayment).toBe(0);
    expect(calc.loanPrincipal).toBe(0);
    expect(calc.monthlyInstallment).toBe(0);
    expect(calc.totalPayable).toBe(0);
    expect(Number.isFinite(calc.monthlyInstallment)).toBe(true);
  });

  it('calculates the default E-Bank passenger quote correctly', () => {
    seedEbankQuote();

    const calc = service.calculation();

    expect(calc.carPrice).toBe(1_500_000);
    expect(calc.downPayment).toBe(375_000);
    expect(calc.downPaymentPercent).toBeCloseTo(25, 6);
    expect(service.tier()).toBe('tier25');
    expect(service.annualRate()).toBe(14.5);
    expect(calc.loanPrincipal).toBe(1_125_000);
    expect(calc.adminFeePercent).toBe(0);
    expect(calc.adminFeeAmount).toBe(0);
    expect(calc.insurancePercent).toBe(2);
    expect(calc.insuranceAmount).toBe(30_000);
    expect(calc.totalCashOnDelivery).toBe(405_000);
    expect(calc.totalInterest).toBe(815_625);
    expect(calc.totalPayable).toBe(1_940_625);
    expect(calc.monthlyInstallment).toBeCloseTo(32_343.75, 2);
  });

  it('classifies down payment tiers at their exact boundaries', () => {
    service.setCarPrice(1_500_000);

    service.setDownPayment(374_999);
    expect(service.tier()).toBeNull();
    expect(service.belowMinimum()).toBe(true);

    service.setDownPayment(375_000);
    expect(service.tier()).toBe('tier25');

    service.setDownPayment(524_999);
    expect(service.tier()).toBe('tier25');

    service.setDownPayment(525_000);
    expect(service.tier()).toBe('tier35');

    service.setDownPayment(600_000);
    expect(service.tier()).toBe('tier40');

    service.setDownPayment(749_999);
    expect(service.tier()).toBe('tier40');

    service.setDownPayment(750_000);
    expect(service.tier()).toBe('tier50');
    expect(service.belowMinimum()).toBe(false);
  });

  it('applies the E-Bank passenger fee rules per tier', () => {
    seedEbankQuote();

    expect(service.adminFeePercent()).toBe(0);
    expect(service.insurancePercent()).toBe(2);

    service.setDownPayment(525_000);
    expect(service.adminFeePercent()).toBe(0);
    expect(service.insurancePercent()).toBe(0);

    service.setDownPayment(600_000);
    expect(service.insurancePercent()).toBe(0);

    service.setDownPayment(750_000);
    expect(service.insurancePercent()).toBe(0);
  });

  it('looks up E-Bank employee and self-employed rates from the table', () => {
    seedEbankQuote();

    service.setDownPayment(750_000);
    service.setYears(8);
    service.setApplicantType('selfEmployed');
    expect(service.annualRate()).toBe(14.55);

    service.setApplicantType('employee');
    expect(service.annualRate()).toBe(13.8);

    service.setDownPayment(375_000);
    service.setYears(5);
    expect(service.annualRate()).toBe(14.5);

    service.setApplicantType('selfEmployed');
    expect(service.annualRate()).toBe(15.6);
  });

  it('allows overriding the automatic E-Bank rate and restoring the table value', () => {
    seedEbankQuote();

    expect(service.rateOverridden()).toBe(false);
    expect(service.annualRate()).toBe(14.5);

    service.setManualRate(12.25);
    expect(service.rateOverridden()).toBe(true);
    expect(service.annualRate()).toBe(12.25);
    expect(service.calculation().annualRate).toBe(12.25);
    expect(service.rateMissing()).toBe(false);

    service.setYears(8);
    expect(service.annualRate()).toBe(12.25);

    service.resetRate();
    expect(service.rateOverridden()).toBe(false);
    expect(service.annualRate()).toBe(16.1);
  });

  it('clears a rate override when the bank or vehicle type changes', () => {
    seedEbankQuote();

    service.setManualRate(12.25);
    expect(service.rateOverridden()).toBe(true);

    service.setBank('adib');
    expect(service.manualRate()).toBeNull();
    expect(service.rateOverridden()).toBe(false);
    expect(service.annualRate()).toBe(15.12);

    service.setManualRate(15.5);
    expect(service.rateOverridden()).toBe(true);

    service.setBank('ebank');
    expect(service.manualRate()).toBeNull();
    expect(service.annualRate()).toBe(14.5);
  });

  it('requires a manual rate for banks without an automatic table', () => {
    seedEbankQuote();
    service.setBank('nbk');

    expect(service.isAutomaticRate()).toBe(false);
    expect(service.manualRate()).toBeNull();
    expect(service.adminFeePercent()).toBe(1.5);
    expect(service.insurancePercent()).toBe(2);
    expect(service.rateMissing()).toBe(true);
    expect(service.ready()).toBe(false);

    service.setManualRate(15.5);
    expect(service.rateMissing()).toBe(false);
    expect(service.ready()).toBe(true);
    expect(service.annualRate()).toBe(15.5);

    service.setBank('abe');
    expect(service.manualRate()).toBeNull();
    expect(service.rateMissing()).toBe(true);
  });

  it('applies ADIB passenger mandatory-insurance rates from the exact table', () => {
    seedEbankQuote();
    service.setBank('adib');

    expect(service.isAdibPassenger()).toBe(true);
    expect(service.minimumDownPaymentPercent()).toBe(20);
    expect(service.adibInsured()).toBe(true);
    expect(service.adminFeePercent()).toBe(1.5);
    expect(service.insurancePercent()).toBe(2);

    service.setDownPayment(300_000);
    service.setYears(5);
    expect(service.adibPassengerTier()).toBe(20);
    expect(service.annualRate()).toBe(15.12);

    service.setDownPayment(450_000);
    service.setYears(1);
    expect(service.adibPassengerTier()).toBe(30);
    expect(service.annualRate()).toBe(15.39);
    service.setAdibInsured(false);
    expect(service.annualRate()).toBe(16.07);

    service.setDownPayment(525_000);
    service.setYears(3);
    expect(service.adibPassengerTier()).toBe(35);
    expect(service.annualRate()).toBe(15.22);
    service.setAdibInsured(true);
    expect(service.annualRate()).toBe(14.55);

    service.setDownPayment(600_000);
    service.setYears(6);
    expect(service.adibPassengerTier()).toBe(40);
    expect(service.annualRate()).toBe(14.76);
    service.setAdibInsured(false);
    expect(service.annualRate()).toBe(15.52);

    service.setDownPayment(675_000);
    service.setYears(8);
    expect(service.adibPassengerTier()).toBe(45);
    expect(service.annualRate()).toBe(16.37);
    service.setAdibInsured(true);
    expect(service.annualRate()).toBe(15.55);

    service.setDownPayment(750_000);
    service.setYears(2);
    expect(service.adibPassengerTier()).toBe(50);
    expect(service.annualRate()).toBe(13.99);
    service.setAdibInsured(false);
    expect(service.annualRate()).toBe(14.65);

    service.setDownPayment(825_000);
    service.setYears(5);
    expect(service.adibPassengerTier()).toBe(55);
    expect(service.annualRate()).toBe(13.23);
    service.setAdibInsured(true);
    expect(service.annualRate()).toBe(12.58);

    service.setDownPayment(900_000);
    service.setYears(5);
    expect(service.adibPassengerTier()).toBe(60);
    expect(service.rateMissing()).toBe(true);
    expect(service.tableRate()).toBeNull();
    service.setAdibInsured(false);
    expect(service.annualRate()).toBe(12.84);
    expect(service.ready()).toBe(true);
  });

  it('keeps the ADIB passenger rate editable when a table combination is null', () => {
    seedEbankQuote();
    service.setBank('adib');
    service.setDownPayment(300_000);
    service.setYears(5);

    service.setAdibInsured(false);
    expect(service.tableRate()).toBeNull();
    expect(service.rateMissing()).toBe(true);
    expect(service.ready()).toBe(false);
    expect(service.rateTableNote()).toContain('أدخل سعر الفائدة يدوياً');

    service.setManualRate(16.25);
    expect(service.rateMissing()).toBe(false);
    expect(service.ready()).toBe(true);
    expect(service.annualRate()).toBe(16.25);

    service.setAdibInsured(true);
    expect(service.manualRate()).toBeNull();
    expect(service.annualRate()).toBe(15.12);
  });

  it('restores the table rate when a previously unavailable combination becomes available', () => {
    seedEbankQuote();
    service.setBank('adib');
    service.setDownPayment(300_000);
    service.setAdibInsured(false);
    service.setManualRate(16.25);

    expect(service.tableRate()).toBeNull();
    expect(service.annualRate()).toBe(16.25);

    service.setDownPayment(450_000);
    expect(service.manualRate()).toBeNull();
    expect(service.tableRate()).toBe(15.63);
    expect(service.annualRate()).toBe(15.63);
  });

  it('allows ADIB passenger down payments from 20 percent without a minimum warning', () => {
    seedEbankQuote();
    service.setBank('adib');
    service.setDownPayment(300_000);

    expect(service.downPaymentPercent()).toBeCloseTo(20, 6);
    expect(service.belowMinimum()).toBe(false);

    service.setDownPayment(299_999);
    expect(service.belowMinimum()).toBe(true);
    expect(service.adibPassengerTier()).toBeNull();
  });

  it('applies ADIB commercial rates from 20 percent for 5 and 7 years', () => {
    seedEbankQuote();
    service.setBank('adib');
    service.setVehicleType('quarterTruck');

    expect(service.isAdibPassenger()).toBe(false);
    expect(service.minimumDownPaymentPercent()).toBe(20);
    expect(service.isAutomaticRate()).toBe(true);
    expect(service.adminFeePercent()).toBe(1.5);
    expect(service.insurancePercent()).toBe(2);

    service.setDownPayment(300_000);
    expect(service.belowMinimum()).toBe(false);
    service.setYears(5);
    expect(service.annualRate()).toBe(14.79);
    service.setYears(7);
    expect(service.annualRate()).toBe(14.96);

    service.setYears(6);
    expect(service.tableRate()).toBeNull();
    expect(service.rateMissing()).toBe(true);
    service.setManualRate(15);
    expect(service.ready()).toBe(true);

    service.setYears(5);
    expect(service.manualRate()).toBeNull();
    expect(service.annualRate()).toBe(14.79);

    service.setDownPayment(750_000);
    service.setYears(5);
    expect(service.annualRate()).toBe(14.28);
    service.setYears(7);
    expect(service.annualRate()).toBe(14.45);

    service.setApplicantType('selfEmployed');
    expect(service.annualRate()).toBe(14.45);

    service.setDownPayment(299_999);
    expect(service.belowMinimum()).toBe(true);
    expect(service.tableRate()).toBeNull();
  });

  it('applies ABE commercial rates by loan year from 1 to 7', () => {
    seedEbankQuote();
    service.setBank('abe');
    service.setVehicleType('jumbo');

    expect(service.isAutomaticRate()).toBe(true);
    expect(service.adminFeePercent()).toBe(2);
    expect(service.insurancePercent()).toBe(2);

    const expectedRates = [15.22, 15.26, 15.66, 16.14, 16.64, 17.15, 17.64];

    expectedRates.forEach((rate, index) => {
      const years = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
      service.setYears(years);
      expect(service.annualRate()).toBe(rate);
    });

    service.setApplicantType('selfEmployed');
    service.setYears(4);
    expect(service.annualRate()).toBe(16.14);

    service.setYears(8);
    expect(service.tableRate()).toBeNull();
    expect(service.rateMissing()).toBe(true);

    service.setManualRate(18);
    service.setYears(7);
    expect(service.manualRate()).toBeNull();
    expect(service.annualRate()).toBe(17.64);
  });

  it('applies commercial vehicle fee policies for every bank', () => {
    service.setVehicleType('quarterTruck');
    expect(service.isAutomaticRate()).toBe(false);
    expect(service.manualRate()).toBeNull();
    expect(service.rateMissing()).toBe(true);
    expect(service.adminFeePercent()).toBe(1.5);
    expect(service.insurancePercent()).toBe(2);

    service.setBank('abe');
    expect(service.adminFeePercent()).toBe(2);
    expect(service.insurancePercent()).toBe(2);

    service.setVehicleType('jumbo');
    service.setBank('nbk');
    expect(service.adminFeePercent()).toBe(1.5);
    expect(service.insurancePercent()).toBe(2);
  });

  it('computes insurance on the car price and admin fees on the principal', () => {
    seedEbankQuote();
    service.setDownPayment(525_000);
    service.setAdminFeePercent(2);
    service.setInsurancePercent(1.5);

    const calc = service.calculation();
    expect(calc.adminFeeAmount).toBeCloseTo(975_000 * 0.02, 6);
    expect(calc.insuranceAmount).toBeCloseTo(1_500_000 * 0.015, 6);
    expect(calc.totalCashOnDelivery).toBeCloseTo(525_000 + 19_500 + 22_500, 6);
  });

  it('tracks manual fee overrides and restores bank defaults', () => {
    seedEbankQuote();

    service.setAdminFeePercent(3);
    expect(service.adminFeeIsManual()).toBe(true);
    expect(service.adminFeePercent()).toBe(3);

    service.resetAdminFee();
    expect(service.adminFeeIsManual()).toBe(false);
    expect(service.adminFeePercent()).toBe(0);

    service.setInsurancePercent(4);
    expect(service.insuranceFeeIsManual()).toBe(true);
    expect(service.feePolicyNote()).toContain('نسب معدّلة يدوياً');
    expect(service.feePolicyNote()).toContain('تأمين 4%');
    service.resetInsuranceFee();
    expect(service.insurancePercent()).toBe(2);
  });

  it('clears manual fee overrides when the fee context changes', () => {
    seedEbankQuote();
    service.setAdminFeePercent(5);
    service.setInsurancePercent(5);
    expect(service.feesOverridden()).toBe(true);

    service.setDownPayment(525_000);
    expect(service.feesOverridden()).toBe(false);
    expect(service.adminFeePercent()).toBe(0);
    expect(service.insurancePercent()).toBe(0);
  });

  it('recalculates defaults when the car price changes the tier', () => {
    seedEbankQuote();
    expect(service.tier()).toBe('tier25');

    service.setCarPrice(750_000);
    expect(service.downPayment()).toBe(375_000);
    expect(service.tier()).toBe('tier50');
    expect(service.insurancePercent()).toBe(0);
  });

  it('adjusts the down payment when the car price drops below it', () => {
    seedEbankQuote();
    service.setCarPrice(300_000);
    expect(service.downPayment()).toBe(300_000);
    expect(service.calculation().loanPrincipal).toBe(0);
  });

  it('ignores quick percentages until a car price is entered', () => {
    service.setDownPaymentPercent(50);
    expect(service.downPayment()).toBe(0);
    expect(service.downPaymentPercent()).toBe(0);
  });

  it('builds an Arabic WhatsApp quote with the key figures', () => {
    seedEbankQuote();
    const quote = service.buildQuote();

    expect(quote).toContain('عرض تمويل سيارة');
    expect(quote).toContain('تنمية الصادرات (E-Bank)');
    expect(quote).toContain('القسط الشهري: 32,343.75 ج.م');
    expect(quote).toContain('إجمالي المطلوب كاش عند الاستلام: 405,000 ج.م');
    expect(quote).toContain('إجمالي المبلغ المسدد: 1,940,625 ج.م');
  });

  it('adds the ADIB mandatory insurance choice to the quote', () => {
    seedEbankQuote();
    service.setBank('adib');
    service.setAdibInsured(false);

    const quote = service.buildQuote();
    expect(quote).toContain('التأمين الإجباري: لا');
  });

  it('resets every field back to the initial empty quote', () => {
    service.setBank('abe');
    service.setVehicleType('jumbo');
    service.setCarPrice(1_500_000);
    service.setDownPayment(800_000);
    service.setYears(8);
    service.setAdminFeePercent(4);
    service.setAdibInsured(false);

    service.resetAll();

    expect(service.bankId()).toBe('ebank');
    expect(service.vehicleType()).toBe('passenger');
    expect(service.carPrice()).toBe(0);
    expect(service.downPayment()).toBe(0);
    expect(service.years()).toBe(5);
    expect(service.adminFeePercent()).toBe(0);
    expect(service.insurancePercent()).toBe(2);
    expect(service.manualRate()).toBeNull();
    expect(service.annualRate()).toBe(14.5);
    expect(service.adibInsured()).toBe(true);
    expect(service.ready()).toBe(false);
  });
});
