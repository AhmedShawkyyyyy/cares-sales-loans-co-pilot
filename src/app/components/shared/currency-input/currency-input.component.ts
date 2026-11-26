import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
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
        #inputEl
        [id]="inputId()"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        class="control num text-start"
        [class.control-with-unit]="!hasValue()"
        [class.control-with-clear]="hasValue()"
        [class.control-invalid]="invalid()"
        [value]="draft()"
        [placeholder]="placeholder()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        (focus)="onFocus()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
      <div class="pointer-events-none absolute inset-y-0 end-2.5 flex items-center gap-1.5">
        <span class="text-[11px] font-medium text-slate-500">ج.م</span>
        @if (hasValue()) {
          <button
            type="button"
            class="pointer-events-auto flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            aria-label="مسح القيمة"
            title="مسح القيمة"
            (click)="clear()"
          >
            <svg
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        }
      </div>
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
  protected readonly hasValue = computed<boolean>(() => this.draft().trim() !== '');
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

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

  protected clear(): void {
    this.draft.set('');
    this.valueChange.emit(null);
    this.inputEl()?.nativeElement.focus();
  }
}
