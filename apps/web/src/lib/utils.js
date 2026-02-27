import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatDate(date) {
    return new Date(date).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}
export function formatDateTime(date) {
    return new Date(date).toLocaleString('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
export function getStatusColor(status) {
    const colors = {
        NEW: 'bg-blue-100 text-blue-800',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
        WAITING_MATERIAL: 'bg-orange-100 text-orange-800',
        DONE: 'bg-green-100 text-green-800',
        SHIPPED: 'bg-purple-100 text-purple-800',
        CANCELED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}
export function getStatusLabel(status) {
    const labels = {
        NEW: 'Neu',
        IN_PROGRESS: 'In Bearbeitung',
        WAITING_MATERIAL: 'Wartet auf Material',
        DONE: 'Fertig',
        SHIPPED: 'Versendet',
        CANCELED: 'Storniert',
    };
    return labels[status] || status;
}
