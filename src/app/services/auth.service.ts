import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile as updateAuthProfile, User,
} from '@angular/fire/auth';
import { Firestore, doc, docData, setDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { Customer } from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authRef = inject(Auth);
  private readonly fs = inject(Firestore);

  private readonly firebaseUser = toSignal(authState(this.authRef), {
    initialValue: undefined as User | null | undefined,
  });
  private readonly _profile = signal<Customer | null>(null);
  private readyPromise: Promise<void>;

  readonly current = computed(() => {
    const u = this.firebaseUser();
    if (!u) return null;
    return { uid: u.uid, name: u.displayName ?? '', email: u.email ?? '' };
  });

  readonly isLoggedIn = computed(() => !!this.firebaseUser());

  constructor() {
    let resolveReady!: () => void;
    this.readyPromise = new Promise((res) => (resolveReady = res));
    authState(this.authRef).subscribe(async (user) => {
      if (user) {
        await this.loadProfile(user.uid);
      } else {
        this._profile.set(null);
      }
      resolveReady();
    });
  }

  async waitForReady(): Promise<void> {
    return this.readyPromise;
  }

  private customerRef(uid: string) {
    return doc(this.fs, 'customers', uid);
  }

  private async loadProfile(uid: string): Promise<void> {
    const snap = await firstValueFrom(docData(this.customerRef(uid)) as Observable<Customer | undefined>);
    this._profile.set(snap ?? null);
  }

  getStoredUser(): Customer | null {
    return this._profile();
  }

  async signup(name: string, email: string, password: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const cred = await createUserWithEmailAndPassword(this.authRef, email.trim(), password);
      await updateAuthProfile(cred.user, { displayName: name.trim() });

      const newCustomer: Customer = {
        id: cred.user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: '',
        joinedAt: new Date().toISOString(),
        ordersCount: 0,
        totalSpent: 0,
        status: 'active',
      };

      await setDoc(this.customerRef(cred.user.uid), newCustomer);

      // Verification: confirm the write actually persisted before reporting success
      const verifySnap = await getDoc(this.customerRef(cred.user.uid));
      if (!verifySnap.exists()) {
        throw new Error('Firestore write did not persist.');
      }

      this._profile.set(newCustomer);
      return { ok: true };
    } catch (err: any) {
      console.error('[AuthService.signup] Failed:', err);
      return { ok: false, message: this.mapError(err) };
    }
  }

  async login(email: string, password: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const cred = await signInWithEmailAndPassword(this.authRef, email.trim(), password);
      await this.loadProfile(cred.user.uid);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: this.mapError(err) };
    }
  }

  async logout(): Promise<void> {
    await signOut(this.authRef);
    this._profile.set(null);
  }

  async updateProfile(patch: Partial<Pick<Customer, 'name' | 'phone' | 'zip' | 'address' | 'billing'>>): Promise<void> {
    const uid = this.firebaseUser()?.uid;
    if (!uid) return;
    await updateDoc(this.customerRef(uid), { ...patch });
    const current = this._profile();
    if (current) this._profile.set({ ...current, ...patch });
  }

  private mapError(err: any): string {
    switch (err?.code) {
      case 'auth/email-already-in-use': return 'An account with that email already exists.';
      case 'auth/invalid-email': return 'Please enter a valid email.';
      case 'auth/weak-password': return 'Password should be at least 6 characters.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found': return 'Email or password is incorrect.';
      default: return 'Something went wrong. Please try again.';
    }
  }
}
