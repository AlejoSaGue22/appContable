import { Component, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NotificationService, NotificationType } from '@shared/services/notification.service';

@Component({
 selector: 'app-notification-container',
 imports: [],
 templateUrl: './notification-container.component.html',
})
export class NotificationContainer {
 notifications = signal<any[]>([]);

 private intervalId: any;

 constructor(
 private notificationService: NotificationService,
 private sanitizer: DomSanitizer
 ) {}

 ngOnInit() {
 this.sync();
 this.intervalId = setInterval(() => this.sync(), 200);
 }

 private sync() {
 this.notifications.set(this.notificationService.getNotifications());
 }

 getNotificationIcon(type: NotificationType): string {
 switch (type) {
 case 'success':
 return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
 case 'error':
 return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
 case 'warning':
 return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>`;
 case 'info':
 return `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
 default:
 return '';
 }
 }

 getAccentClass(type: NotificationType): string {
 switch (type) {
 case 'success': return 'from-green-500 to-emerald-600';
 case 'error': return 'from-red-500 to-rose-600';
 case 'warning': return 'from-amber-500 to-yellow-600';
 case 'info': return 'from-blue-500 to-indigo-600';
 default: return 'from-gray-500 to-slate-600';
 }
 }

 getIconBgClass(type: NotificationType): string {
 switch (type) {
 case 'success': return 'bg-green-100 text-green-600';
 case 'error': return 'bg-red-100 text-red-600';
 case 'warning': return 'bg-amber-100 text-amber-600';
 case 'info': return 'bg-blue-100 text-blue-600';
 default: return 'bg-gray-100 text-gray-600';
 }
 }

 getProgressClass(type: NotificationType): string {
 switch (type) {
 case 'success': return 'bg-gradient-to-r from-green-500 to-emerald-500';
 case 'error': return 'bg-gradient-to-r from-red-500 to-rose-500';
 case 'warning': return 'bg-gradient-to-r from-amber-500 to-yellow-500';
 case 'info': return 'bg-gradient-to-r from-blue-500 to-indigo-500';
 default: return 'bg-gray-500';
 }
 }

 closeNotification(id: number) {
 this.notificationService.remove(id);
 this.sync();
 }

 ngOnDestroy() {
 if (this.intervalId) {
 clearInterval(this.intervalId);
 }
 }
}
