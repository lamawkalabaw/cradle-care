import { Injectable, signal } from '@angular/core';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  setDoc
} from '@angular/fire/firestore';

import {
  Order,
  OrderItem,
  OrderStatusInfo,
  ShippingInfo
} from '../models/order.model';

import { NotificationService } from './notification.service';

const STATUS_LABELS = [
  'Order placed',
  'Processing',
  'Shipped',
  'Delivered'
];

const STATUS_DESCRIPTIONS = [
  'We received your order and payment.',
  'Your items are being packed for shipment.',
  'Your package is on the way.',
  'Your order has been delivered.'
];

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly _orders = signal<Order[]>([]);
  readonly orders = this._orders.asReadonly();

  private ordersRef;

  constructor(
    private firestore: Firestore,
    private notifications: NotificationService
  ) {

    this.ordersRef = collection(this.firestore, 'orders');

    collectionData(this.ordersRef, { idField: 'id' })
      .subscribe((orders) => {
        this._orders.set(orders as Order[]);
      });
  }

  async placeOrder(
    items: OrderItem[],
    shipping: ShippingInfo,
    payment: string
  ): Promise<Order> {

    const id =
      'CC-' + Math.floor(100000 + Math.random() * 900000);

    const tracking =
      'CCX' + Math.floor(100000000 + Math.random() * 900000000);

    const total = items.reduce(
      (sum, i) => sum + i.price * i.qty,
      0
    );

    const order: Order = {
      id,
      tracking,
      createdAt: new Date().toISOString(),
      payment,
      shipping,
      items,
      total,
      customerEmail: shipping.email
    };

    await setDoc(doc(this.ordersRef, id), order);

    this.notifications.add(
      'Order placed',
      `${order.id} is confirmed. Tracking number ${order.tracking}.`,
      true
    );

    return order;
  }

  statusInfo(order: Order): OrderStatusInfo {

    let index: number;

    if (order.manualStatusIndex !== undefined) {
      index = order.manualStatusIndex;
    } else {

      const placed = new Date(order.createdAt);
      const now = new Date();

      const ageDays =
        (now.getTime() - placed.getTime()) / 86400000;

      index = 0;

      if (ageDays >= 3) {
        index = 3;
      } else if (ageDays >= 2) {
        index = 2;
      } else if (ageDays >= 1) {
        index = 1;
      }
    }

    return {
      index,
      label: STATUS_LABELS[index],
      description: STATUS_DESCRIPTIONS[index]
    };
  }

  async setManualStatus(
    orderId: string,
    index: number
  ): Promise<void> {

    const orderRef = doc(
      this.firestore,
      'orders',
      orderId
    );

    await updateDoc(orderRef, {
      manualStatusIndex: index
    });
  }

  readonly statusLabels = STATUS_LABELS;
}