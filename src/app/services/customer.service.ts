import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Firestore, collection, collectionData, doc,
  updateDoc, deleteDoc, writeBatch,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Customer, CustomerStatus } from '../models/customer.model';
import { SEED_CUSTOMERS } from '../data/customers';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly fs = inject(Firestore);
  private readonly col = collection(this.fs, 'customers');

  readonly customers = toSignal(
    collectionData(this.col) as Observable<Customer[]>,
    { initialValue: [] as Customer[] }
  );

  readonly activeCount = computed(
    () => this.customers().filter((c) => c.status === 'active').length
  );

  readonly totalCustomers = computed(() => this.customers().length);

  private ref(id: string) {
    return doc(this.fs, 'customers', id);
  }

  search(query: string): Customer[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.customers();
    return this.customers().filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }

  setStatus(id: string, status: CustomerStatus): void {
    updateDoc(this.ref(id), { status });
  }

  remove(id: string): void {
    deleteDoc(this.ref(id));
  }

  /* One-time: uploads SEED_CUSTOMERS to Firestore */
  async seed(): Promise<void> {
    const batch = writeBatch(this.fs);
    SEED_CUSTOMERS.forEach((c) => batch.set(this.ref(c.id), c));
    await batch.commit();
  }
}