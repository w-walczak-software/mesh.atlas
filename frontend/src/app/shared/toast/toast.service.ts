import { Injectable, signal } from '@angular/core';

export type ToastType = 'message' | 'success' | 'info' | 'warn' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  message(title: string, message?: string, duration = 4000): void {
    this.add({ type: 'message', title, message, duration });
  }

  success(title: string, message?: string, duration = 4000): void {
    this.add({ type: 'success', title, message, duration });
  }

  info(title: string, message?: string, duration = 4000): void {
    this.add({ type: 'info', title, message, duration });
  }

  warn(title: string, message?: string, duration = 5000): void {
    this.add({ type: 'warn', title, message, duration });
  }

  error(title: string, message?: string, duration = 6000): void {
    this.add({ type: 'error', title, message, duration });
  }

  remove(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(toast: Omit<Toast, 'id'>): void {
    const id = crypto.randomUUID();
    this._toasts.update(list => [...list, { ...toast, id }]);
    setTimeout(() => this.remove(id), toast.duration);
  }
}
