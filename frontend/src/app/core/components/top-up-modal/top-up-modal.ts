import { Component, EventEmitter, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-top-up-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './top-up-modal.html'
})
export class TopUpModalComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  @Output() close = new EventEmitter<void>();

  isLoading = signal(false);
  amount = signal(25);
  cardNumber = signal('');
  cardExpiry = signal('');
  cardCvv = signal('');

  isFormValid = computed(() => {
    const num = this.cardNumber().replace(/\s/g, '');
    const exp = this.cardExpiry();
    const cvv = this.cardCvv();
    const amt = this.amount();

    const isCardValid = /^\d{16}$/.test(num);
    const isCvvValid = /^\d{3}$/.test(cvv);
    const isAmountValid = amt >= 1 && amt <= 10000;

    let isExpiryValid = false;
    if (/^\d{2}\/\d{2}$/.test(exp)) {
      const [mStr, yStr] = exp.split('/');
      const month = parseInt(mStr, 10);
      const year = parseInt('20' + yStr, 10);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const isMonthPossible = month >= 1 && month <= 12;
      const isFutureYear = year > currentYear;
      const isCurrentYearValidMonth = year === currentYear && month >= currentMonth;

      isExpiryValid = isMonthPossible && (isFutureYear || isCurrentYearValidMonth);
    }

    return isCardValid && isExpiryValid && isCvvValid && isAmountValid;
  });

  showErrors = signal(false);

  currentUser = this.auth.currentUser;

  restrictNumeric(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 
      'ArrowLeft', 'ArrowRight', 'Home', 'End'
    ];

    if (allowedKeys.includes(event.key)) return;

    if (event.ctrlKey || event.metaKey) return;

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  formatCardNumber(value: string) {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    const groups = digitsOnly.match(/.{1,4}/g);
    this.cardNumber.set(groups ? groups.join(' ') : digitsOnly);
  }

  formatExpiry(value: string) {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    let result = digitsOnly;
    if (digitsOnly.length >= 2) {
      result = digitsOnly.substring(0, 2) + '/' + digitsOnly.substring(2, 4);
    }
    this.cardExpiry.set(result);
  }

  isMonthValid = computed(() => {
    const exp = this.cardExpiry();
    if (exp.length < 2) return true;
    const month = parseInt(exp.substring(0, 2), 10);
    return month >= 1 && month <= 12;
  });

  isYearValid = computed(() => {
    const exp = this.cardExpiry();
    if (exp.length < 5) return true;
    
    const [mStr, yStr] = exp.split('/');
    const month = parseInt(mStr, 10);
    const year = parseInt('20' + yStr, 10);
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear) return false;
    if (year === currentYear && month < currentMonth) return false;
    
    return true;
  });

  onCvvInput(event: any) {
    const input = event.target;
    let value = this.getDigits(input.value);
    
    if (value.length > 3) value = value.substring(0, 3);
    
    input.value = value;
    this.cardCvv.set(value);
  }

  onAmountChange(value: any) {
    const stringVal = String(value).replace(/[^0-9]/g, '');
    this.amount.set(Number(stringVal));
  }

  onAmountInput(event: any) {
    const input = event.target;
    let value = this.getDigits(input.value);
    
    if (Number(value) > 10000) value = '10000';
    
    input.value = value;
    this.amount.set(Number(value));
  }

  private getDigits(value: string): string {
    return value.replace(/\D/g, '');
  }

  confirm() {
    if (!this.isFormValid()) {
      this.showErrors.set(true);
      this.toast.show('Please fix the errors in the form', 'error');
      return;
    }

    const val = this.amount();
    
    if (!val || val < 1) {
      this.toast.show('Please enter at least $1', 'error');
      return;
    }

    if (val > 10000) {
      this.toast.show('Maximum top-up is $10,000', 'error');
      return;
    }

    this.isLoading.set(true);
    
    setTimeout(() => {
      this.auth.topUp(val).subscribe({
        next: () => {
          this.toast.show(`Success! $${val} added to wallet`, 'success');
          this.isLoading.set(false);
          this.close.emit();
        },
        error: (err) => {
          this.toast.show(err.error?.message || 'Payment rejected', 'error');
          this.isLoading.set(false);
        }
      });
    }, 1500);
  }

  onCardInput(event: any) {
    const input = event.target;
    let value = this.getDigits(input.value);
    
    if (value.length > 16) value = value.substring(0, 16);
    
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    
    input.value = formatted;
    this.cardNumber.set(formatted);
  }

  onExpiryInput(event: any) {
    const input = event.target;
    let value = this.getDigits(input.value);
    
    if (value.length > 4) value = value.substring(0, 4);
    
    let formatted = value;
    if (value.length >= 2) {
      formatted = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    
    input.value = formatted;
    this.cardExpiry.set(formatted);
  }

  onCancel() {
    this.close.emit();
  }
}