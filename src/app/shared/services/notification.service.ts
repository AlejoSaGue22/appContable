import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  duration?: number; // Duración en milisegundos, null para permanente
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notifications: Notification[] = [];
  private nextId = 1;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  /**
   * Muestra una notificación
   */
  show(notification: Omit<Notification, 'id'>) {
    if (!this.isBrowser) return;

    const newNotification: Notification = {
      id: this.nextId++,
      ...notification,
      duration: notification.duration || 5000 // 5 segundos por defecto
    };

    this.notifications.push(newNotification);

    // Auto-remover si tiene duración
    if (newNotification.duration! > 0) {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, newNotification.duration);
    }

    return newNotification.id;
  }

  /**
   * Métodos rápidos para tipos comunes
   */
  success(message: string, title?: string, duration?: number) {
    return this.show({
      message,
      title: title || '¡Éxito!',
      type: 'success',
      duration
    });
  }

  error(message: string, title?: string, duration?: number) {
    return this.show({
      message,
      title: title || 'Error',
      type: 'error',
      duration
    });
  }

  warning(message: string, title?: string, duration?: number) {
    return this.show({
      message,
      title: title || 'Advertencia',
      type: 'warning',
      duration
    });
  }

  info(message: string, title?: string, duration?: number) {
    return this.show({
      message,
      title: title || 'Información',
      type: 'info',
      duration
    });
  }

  /**
   * Remueve una notificación por ID
   */
  remove(id: number) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      this.notifications.splice(index, 1);
    }
  }

  /**
   * Limpia todas las notificaciones
   */
  clear() {
    this.notifications = [];
  }

  /**
   * Obtiene todas las notificaciones activas
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

}
