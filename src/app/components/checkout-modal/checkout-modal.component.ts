import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFooter,
  IonInput, IonCheckbox, ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmarkCircle } from 'ionicons/icons';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../services/toast.service';
import {
  formatCardNumber, formatExpiry, formatPhone as _formatPhone,
  isValidCard, isValidEmail, isValidExpiry, isValidPostal,
} from '../../services/validators.util';
import { Order, OrderItem } from '../../models/order.model';

function requiredLen(min: number): ValidatorFn {
  return (c): ValidationErrors | null => (c.value && String(c.value).trim().length >= min ? null : { tooShort: true });
}
function emailValidator(c: { value: string }): ValidationErrors | null {
  return isValidEmail(c.value || '') ? null : { invalidEmail: true };
}
function postalValidator(c: { value: string }): ValidationErrors | null {
  return isValidPostal(c.value || '') ? null : { invalidPostal: true };
}
function cardValidator(c: { value: string }): ValidationErrors | null {
  return isValidCard(c.value || '') ? null : { invalidCard: true };
}
function expiryValidator(c: { value: string }): ValidationErrors | null {
  return isValidExpiry(c.value || '') ? null : { invalidExpiry: true };
}
function cvvValidator(c: { value: string }): ValidationErrors | null {
  return /^\d{3,4}$/.test((c.value || '').trim()) ? null : { invalidCvv: true };
}

@Component({
  selector: 'app-checkout-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonContent, IonFooter, IonInput, IonCheckbox,
  ],
  templateUrl: './checkout-modal.component.html',
  styleUrl: './checkout-modal.component.scss',
})
export class CheckoutModalComponent {
  private modalCtrl = inject(ModalController);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private orderService = inject(OrderService);
  cart = inject(CartService);

  step = 1;
  paymentMethod: 'card' | 'paypal' = 'card';
  paypalApproved = false;
  placedOrder: Order | null = null;

  shippingForm = this.fb.nonNullable.group({
    firstName: ['', [requiredLen(2)]],
    lastName: ['', [requiredLen(2)]],
    email: ['', [emailValidator]],
    address: ['', [requiredLen(2)]],
    city: ['', [requiredLen(2)]],
    state: ['', [requiredLen(2)]],
    postal: ['', [postalValidator]],
    country: ['United States', [requiredLen(2)]],
  });

  paymentForm = this.fb.nonNullable.group({
    cardName: ['', [requiredLen(2)]],
    cardNumber: ['', [cardValidator]],
    cardExpiry: ['', [expiryValidator]],
    cardCvv: ['', [cvvValidator]],
  });

  termsAccepted = false;

  constructor() {
    addIcons({ close, checkmarkCircle });
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }

  onPostalInput(ev: CustomEvent): void {
    const value = (ev.detail as any).value ?? '';
    this.shippingForm.patchValue({ postal: value.replace(/\D/g, '').slice(0, 5) }, { emitEvent: false });
  }

  onCardNumberInput(ev: CustomEvent): void {
    const value = (ev.detail as any).value ?? '';
    this.paymentForm.patchValue({ cardNumber: formatCardNumber(value) }, { emitEvent: false });
  }

  onExpiryInput(ev: CustomEvent): void {
    const value = (ev.detail as any).value ?? '';
    this.paymentForm.patchValue({ cardExpiry: formatExpiry(value) }, { emitEvent: false });
  }

  onCvvInput(ev: CustomEvent): void {
    const value = (ev.detail as any).value ?? '';
    this.paymentForm.patchValue({ cardCvv: value.replace(/\D/g, '').slice(0, 4) }, { emitEvent: false });
  }

  selectPayment(method: 'card' | 'paypal'): void {
    this.paymentMethod = method;
    this.paypalApproved = false;
  }

  approvePaypal(): void {
    this.paypalApproved = true;
    this.toast.show('PayPal demo approved');
  }

  goToPayment(): void {
    this.shippingForm.markAllAsTouched();
    if (this.shippingForm.invalid) return;
    this.step = 2;
  }

  goToReview(): void {
    if (this.paymentMethod === 'paypal') {
      if (!this.paypalApproved) { this.toast.show('Approve the PayPal demo first'); return; }
    } else {
      this.paymentForm.markAllAsTouched();
      if (this.paymentForm.invalid) return;
    }
    this.step = 3;
  }

  backTo(step: number): void {
    this.step = step;
  }

  get reviewPaymentLabel(): string {
    if (this.paymentMethod === 'paypal') return 'PayPal sandbox — approved';
    const last4 = this.paymentForm.value.cardNumber?.replace(/\D/g, '').slice(-4) ?? '';
    return `Card ending in ${last4}`;
  }

    async placeOrder(): Promise<void> {
    if (!this.termsAccepted) { this.toast.show('Please accept the demo checkout terms'); return; }
    const items: OrderItem[] = this.cart.lines().map((l) => ({
      id: l.product.id, name: l.product.name, price: l.product.price, qty: l.qty, icon: l.product.icon,
    }));
    const s = this.shippingForm.getRawValue();
    const order = await this.orderService.placeOrder(
      items,
      { name: `${s.firstName} ${s.lastName}`, email: s.email, address: s.address, city: s.city, state: s.state, postal: s.postal, country: s.country },
      this.reviewPaymentLabel
    );
    this.placedOrder = order;
    this.cart.clear();
    setTimeout(() => this.modalCtrl.dismiss({ placed: true }), 2200);
  }
}
