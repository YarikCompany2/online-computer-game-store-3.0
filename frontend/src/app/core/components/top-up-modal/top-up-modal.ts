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

  formatCardNumber(value: string) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = v.match(/.{1,4}/g);
    this.cardNumber.set(parts ? parts.join(' ') : v);
  }

  formatExpiry(value: string) {
    let v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      v = v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    this.cardExpiry.set(v);
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

  onCancel() {
    this.close.emit();
  }
}