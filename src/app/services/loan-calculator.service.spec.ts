import { LoanCalculatorService } from './loan-calculator.service';

describe('LoanCalculatorService', () => {
  let service: LoanCalculatorService;

  beforeEach(() => {
    service = new LoanCalculatorService();
  });

  it('calculates the default E-Bank passenger quote correctly', () => {
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
    service.setManualRate(12.25);
    expect(service.rateOverridden()).toBe(true);

    service.setBank('adib');
    expect(service.manualRate()).toBeNull();
    expect(service.rateOverridden()).toBe(false);

    service.setManualRate(15.5);
    expect(service.rateOverridden()).toBe(false);

    service.setBank('ebank');
    expect(service.manualRate()).toBeNull();
    expect(service.annualRate()).toBe(14.5);
  });

  it('requires a manual rate for banks without an automatic table', () => {
    service.setBank('adib');

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

    service.setBank('nbk');
    expect(service.manualRate()).toBeNull();
    expect(service.rateMissing()).toBe(true);
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
    service.setDownPayment(525_000);
    service.setAdminFeePercent(2);
    service.setInsurancePercent(1.5);

    const calc = service.calculation();
    expect(calc.adminFeeAmount).toBeCloseTo(975_000 * 0.02, 6);
    expect(calc.insuranceAmount).toBeCloseTo(1_500_000 * 0.015, 6);
    expect(calc.totalCashOnDelivery).toBeCloseTo(525_000 + 19_500 + 22_500, 6);
  });

  it('tracks manual overrides and restores bank defaults', () => {
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
    service.setAdminFeePercent(5);
    service.setInsurancePercent(5);
    expect(service.feesOverridden()).toBe(true);

    service.setDownPayment(525_000);
    expect(service.feesOverridden()).toBe(false);
    expect(service.adminFeePercent()).toBe(0);
    expect(service.insurancePercent()).toBe(0);
  });

  it('recalculates defaults when the car price changes the tier', () => {
    service.setDownPayment(375_000);
    expect(service.tier()).toBe('tier25');

    service.setCarPrice(750_000);
    expect(service.downPayment()).toBe(375_000);
    expect(service.tier()).toBe('tier50');
    expect(service.insurancePercent()).toBe(0);
  });

  it('adjusts the down payment when the car price drops below it', () => {
    service.setCarPrice(300_000);
    expect(service.downPayment()).toBe(300_000);
    expect(service.calculation().loanPrincipal).toBe(0);
  });

  it('builds an Arabic WhatsApp quote with the key figures', () => {
    const quote = service.buildQuote();

    expect(quote).toContain('عرض تمويل سيارة');
    expect(quote).toContain('تنمية الصادرات (E-Bank)');
    expect(quote).toContain('القسط الشهري: 32,343.75 ج.م');
    expect(quote).toContain('إجمالي المطلوب كاش عند الاستلام: 405,000 ج.م');
    expect(quote).toContain('إجمالي المبلغ المسدد: 1,940,625 ج.م');
  });

  it('resets every field back to the initial quote', () => {
    service.setBank('abe');
    service.setVehicleType('jumbo');
    service.setDownPayment(800_000);
    service.setYears(8);
    service.setAdminFeePercent(4);

    service.resetAll();

    expect(service.bankId()).toBe('ebank');
    expect(service.vehicleType()).toBe('passenger');
    expect(service.carPrice()).toBe(1_500_000);
    expect(service.downPayment()).toBe(375_000);
    expect(service.years()).toBe(5);
    expect(service.adminFeePercent()).toBe(0);
    expect(service.insurancePercent()).toBe(2);
    expect(service.manualRate()).toBeNull();
    expect(service.annualRate()).toBe(14.5);
  });
});
