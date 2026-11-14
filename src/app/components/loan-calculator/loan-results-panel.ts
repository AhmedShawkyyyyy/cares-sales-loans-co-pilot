import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  getApplicantTypeOption,
  getBankOption,
  getVehicleTypeOption,
} from '../../data/banks-rates.data';
import { CopyState } from '../../models/loan.models';
import { LoanCalculatorService } from '../../services/loan-calculator.service';
import { formatAmount, formatInteger, formatPercent } from '../../utils/format.utils';

@Component({
  selector: 'app-loan-results-panel',
  templateUrl: './loan-results-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoanResultsPanelComponent implements OnDestroy {
  protected readonly store = inject(LoanCalculatorService);

  protected readonly copyState = signal<CopyState>('idle');
  protected readonly formatAmount = formatAmount;
  protected readonly formatInteger = formatInteger;
  protected readonly formatPercent = formatPercent;

  protected readonly bankName = computed<string>(() => getBankOption(this.store.bankId()).name);

  protected readonly vehicleLabel = computed<string>(
    () => getVehicleTypeOption(this.store.vehicleType()).label,
  );

  protected readonly applicantLabel = computed<string>(
    () => getApplicantTypeOption(this.store.applicantType()).label,
  );

  protected readonly rateSourceLabel = computed<string>(() =>
    this.store.isAutomaticRate() ? 'جدول E-Bank' : 'إدخال يدوي',
  );

  protected readonly blockingMessage = computed<string>(() => {
    if (this.store.carPrice() <= 0) {
      return 'أدخل سعر السيارة لعرض القسط الشهري.';
    }

    if (this.store.rateMissing()) {
      return 'أدخل سعر الفائدة السنوية لعرض القسط الشهري.';
    }

    return '';
  });

  protected readonly copyLabel = computed<string>(() => {
    switch (this.copyState()) {
      case 'copied':
        return 'تم نسخ تفاصيل العرض';
      case 'error':
        return 'تعذّر النسخ — حاول مرة أخرى';
      default:
        return 'نسخ تفاصيل العرض للعميل';
    }
  });

  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  protected async copyQuote(): Promise<void> {
    if (!this.store.ready()) {
      return;
    }

    try {
      await this.writeToClipboard(this.store.buildQuote());
      this.copyState.set('copied');
      this.scheduleReset(2600);
    } catch {
      this.copyState.set('error');
      this.scheduleReset(3200);
    }
  }

  ngOnDestroy(): void {
    if (this.resetTimer !== null) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  private async writeToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.inset = '0';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      const copied = document.execCommand('copy');
      if (!copied) {
        throw new Error('Clipboard copy was rejected.');
      }
    } finally {
      document.body.removeChild(textarea);
    }
  }

  private scheduleReset(delay: number): void {
    if (this.resetTimer !== null) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      this.copyState.set('idle');
      this.resetTimer = null;
    }, delay);
  }
}
