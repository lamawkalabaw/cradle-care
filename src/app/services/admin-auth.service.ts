import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

export interface AdminUser {
  uid: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  private readonly _admin = signal<AdminUser | null>(null);
  readonly admin = this._admin.asReadonly();
  readonly isAdmin = computed(() => this._admin()?.role === 'admin');

  private ready = false;
  private readyResolvers: Array<() => void> = [];

  constructor() {
    onAuthStateChanged(this.auth, async (user: User | null) => {
      if (user) {
        await this.loadRole(user);
      } else {
        this._admin.set(null);
      }
      this.ready = true;
      this.readyResolvers.forEach((r) => r());
      this.readyResolvers = [];
    });
  }

  private async loadRole(user: User): Promise<void> {
    const snap = await getDoc(doc(this.firestore, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data() as { email: string; role: string };
      this._admin.set({ uid: user.uid, email: data.email, role: data.role });
    } else {
      this._admin.set(null);
    }
  }

  async waitForReady(): Promise<void> {
    if (this.ready) return;
    return new Promise((resolve) => this.readyResolvers.push(resolve));
  }

  async login(email: string, password: string): Promise<{ ok: boolean; message?: string }> {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email.trim(), password);
      await this.loadRole(cred.user);
      if (this._admin()?.role !== 'admin') {
        await signOut(this.auth);
        this._admin.set(null);
        return { ok: false, message: 'This account does not have admin access.' };
      }
      return { ok: true };
    } catch {
      return { ok: false, message: 'Incorrect email or password.' };
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this._admin.set(null);
  }
}
