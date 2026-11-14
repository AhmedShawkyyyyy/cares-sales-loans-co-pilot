import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { formatThousandsInput, parseNumericInput } from '../../../utils/format.utils';

/**
 * Currency mask input that keeps a friendly draft while typing and
 * emits a normalized numeric value on every change.
 */
@Component({
  selector: 'app-currency-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <input
        [id]="inputId()"
        type="text"
        inputmode="numeric"
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
      <span class="unit">ج.م</span>
    </div>
  `,
})
export class CurrencyInputComponent {
  readonly value = input<number>(0);
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
        this.draft.set(formatThousandsInput(nextValue));
      }
    });
  }

  protected onFocus(): void {
    this.focused = true;
  }

  protected onInput(event: Event): void {
    const element = event.target as HTMLInputElement;
    this.draft.set(element.value);
    this.valueChange.emit(parseNumericInput(element.value));
  }

  protected onBlur(): void {
    this.focused = false;
    this.draft.set(formatThousandsInput(this.value()));
  }
}
