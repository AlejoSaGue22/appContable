import { Component, input } from '@angular/core';

@Component({
 selector: 'app-skeleton',
 template: `
 @switch (variant()) {
 @case ('card') {
 <div class="bg-white p-6 rounded-3xl border border-gray-100 animate-pulse">
 <div class="flex justify-between items-start mb-4">
 <div class="p-3 bg-gray-200 rounded-2xl w-12 h-12"></div>
 <div class="bg-gray-200 rounded-full w-16 h-6"></div>
 </div>
 <div class="bg-gray-200 rounded w-20 h-4 mb-2"></div>
 <div class="bg-gray-200 rounded w-36 h-8 mb-6"></div>
 <div class="bg-gray-100 rounded w-48 h-3"></div>
 </div>
 }
 @case ('chart') {
 <div class="bg-white p-7 rounded-2xl border border-gray-100 animate-pulse">
 <div class="flex items-center justify-between mb-8">
 <div class="space-y-2">
 <div class="bg-gray-200 rounded w-32 h-5"></div>
 <div class="bg-gray-100 rounded w-48 h-3"></div>
 </div>
 <div class="flex gap-4">
 <div class="bg-gray-200 rounded w-16 h-3"></div>
 <div class="bg-gray-200 rounded w-16 h-3"></div>
 </div>
 </div>
 <div class="flex items-end gap-3 h-52">
 @for (_ of [1,2,3,4,5,6]; track $index) {
 <div class="flex-1 flex flex-col items-center gap-2 h-full justify-end">
 <div class="w-full bg-gray-100 rounded-t-lg" [style.height]="(30 + $index * 10) + '%'"></div>
 <div class="bg-gray-200 rounded w-8 h-3"></div>
 </div>
 }
 </div>
 </div>
 }
 @case ('table') {
 <div class="bg-white rounded-2xl border border-gray-100 animate-pulse overflow-hidden">
 <div class="p-5 border-b border-gray-100">
 <div class="flex items-center justify-between">
 <div class="bg-gray-200 rounded w-40 h-5"></div>
 <div class="bg-gray-100 rounded w-24 h-8"></div>
 </div>
 </div>
 <div class="divide-y divide-gray-50">
 @for (_ of [1,2,3,4,5]; track $index) {
 <div class="px-5 py-4 flex items-center gap-4">
 <div class="bg-gray-100 rounded w-24 h-4"></div>
 <div class="bg-gray-100 rounded w-16 h-4"></div>
 <div class="bg-gray-100 rounded w-20 h-4 ml-auto"></div>
 </div>
 }
 </div>
 </div>
 }
 @default {
 <div class="animate-pulse space-y-2">
 <div class="bg-gray-200 rounded w-full h-4"></div>
 <div class="bg-gray-100 rounded w-5/6 h-4"></div>
 <div class="bg-gray-100 rounded w-2/3 h-4"></div>
 </div>
 }
 }
 `
})
export class SkeletonComponent {
 variant = input<'card' | 'chart' | 'table' | 'text'>('text');
}
