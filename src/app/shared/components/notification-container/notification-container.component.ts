import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NotificationService, NotificationType } from '@shared/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-container',
  imports: [CommonModule],
  templateUrl: './notification-container.component.html',
})
export class NotificationContainer {
   notifications: any[] = [];
  private subscription!: Subscription;

  constructor(private notificationService: NotificationService, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    // En una implementación real, podrías usar observables
    // Para simplificar, usaremos polling o eventos personalizados
    this.checkNotifications();
    
    // Revisar notificaciones cada 100ms
    setInterval(() => {
      this.checkNotifications();
    }, 100);
  }

  private checkNotifications() {
    this.notifications = this.notificationService.getNotifications();
  }

  getNotificationIcon(type: NotificationType): SafeHtml {
    let svgString: string;

    switch (type) {
      case 'success':
        svgString = `<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>
        </svg>`;
        break;
      case 'error':
        svgString = `<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>
        </svg>`;
        break;
      case 'warning':
        svgString = `<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
        </svg>`;
        break;
      case 'info':
        svgString = `<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
        </svg>`;
        break;
      default:
        svgString = `<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>
        </svg>`;
    }

    return this.sanitizer.bypassSecurityTrustHtml(svgString);
  }

  getNotificationClasses(type: NotificationType): string {
    const baseClasses = 'flex items-center w-full max-w-xl p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800';
    
    switch (type) {
      case 'success':
        return `${baseClasses} border-l-4 border-green-500`;
      case 'error':
        return `${baseClasses} border-l-4 border-red-500`;
      case 'warning':
        return `${baseClasses} border-l-4 border-yellow-500`;
      case 'info':
        return `${baseClasses} border-l-4 border-blue-500`;
      default:
        return baseClasses;
    }
  }

  closeNotification(id: number) {
    this.notificationService.remove(id);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
 }
