import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Firestore, collection, collectionData, doc,
  setDoc, updateDoc, deleteDoc, writeBatch,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product.model';
import { PRODUCTS } from '../data/products';

const LOW_STOCK_THRESHOLD = 10;

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly fs = inject(Firestore);
  private readonly col = collection(this.fs, 'products');

  readonly products = toSignal(
    (collectionData(this.col) as Observable<Product[]>).pipe(
      map((list) => [...list].sort((a, b) => a.id - b.id))
    ),
    { initialValue: [] as Product[] }
  );

  readonly lowStock = computed(() => this.products().filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD));
  readonly outOfStock = computed(() => this.products().filter((p) => p.stock === 0));
  readonly totalStockValue = computed(() => this.products().reduce((sum, p) => sum + p.price * p.stock, 0));

  readonly lowStockThreshold = LOW_STOCK_THRESHOLD;

  private ref(id: number) {
    return doc(this.fs, 'products', String(id));
  }

  byId(id: number): Product | undefined {
    return this.products().find((p) => p.id === id);
  }

  add(product: Omit<Product, 'id'>): Product {
    const nextId = Math.max(0, ...this.products().map((p) => p.id)) + 1;
    const created: Product = { ...product, id: nextId };
    setDoc(this.ref(nextId), created);
    return created;
  }

  update(id: number, patch: Partial<Omit<Product, 'id'>>): void {
    updateDoc(this.ref(id), { ...patch });
  }

  remove(id: number): void {
    deleteDoc(this.ref(id));
  }

  adjustStock(id: number, delta: number): void {
    const p = this.byId(id);
    if (p) this.setStock(id, p.stock + delta);
  }

  setStock(id: number, stock: number): void {
    updateDoc(this.ref(id), { stock: Math.max(0, stock) });
  }

  /* One-time: uploads the PRODUCTS array to Firestore */
  async seed(): Promise<void> {
    const batch = writeBatch(this.fs);
    PRODUCTS.forEach((p) => batch.set(this.ref(p.id), p));
    await batch.commit();
  }
}