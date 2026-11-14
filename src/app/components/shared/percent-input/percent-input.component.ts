import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { parseNumericInput } from '../../../utils/format.utils';

/**
 * Decimal percentage input with a free-text draft so values like
 * "13.75" can be typed naturally while results update live.
 */
@Component({
  selector: 'app-percent-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <input
        [id]="inputId()"
        type="text"
        inputmode="decimal"
        autocomplete="off"
        class="control control-with-unit num text-start"
        [class.control-invalid]="invalid()"
        [value]="draft()"
        [placeholder]="placeholder()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        (focus)="onFocus()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
      <span class="unit">%</span>
    </div>
  `,
})
export class PercentInputComponent {
  readonly value = input<number | null>(null);
  readonly inputId = input<string>('');
  readonly placeholder = input<string>('0');
  readonly invalid = input<boolean>(false);
  readonly valueChange = output<number | null>();

  private focused = false;
  protected readonly draft = signal<string>('');

  constructor() {
    effect(() => {
      const nextValue = this.value();

      if (!this.focused) {
        this.draft.set(this.toDisplayValue(nextValue));
      }
    });
  }

  protected onFocus(): void {
    this.focused = true;
  }

  protected onInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    const rawValue = element.value;
    this.draft.set(rawValue);

    if (rawValue.trim() === '') {
      this.valueChange.emit(null);
      return;
    }

    this.valueChange.emit(parseNumericInput(rawValue));
  }

  protected onBlur(): void {
    this.focused = false;
    this.draft.set(this.toDisplayValue(this.value()));
  }

  private toDisplayValue(value: number | null): string {
    if (value === null || !Number.isFinite(value)) {
      return '';
    }

    return String(Number(value.toFixed(2)));
  }
}
