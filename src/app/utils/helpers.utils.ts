import { environment } from 'src/app/environments/environment';
import QRCode from 'qrcode';

export class HelpersUtils {

    static readonly nameApp = 'ALVA';
    static readonly logoApp = 'assets/images/logo_app.png';
    static readonly slogan = 'Software Contable, Nómina y Comercial';

    /** Origen del backend sin el prefijo /api/v1. Dev: http://localhost:3000, Prod (proxy): '' */
    static backendOrigin(): string {
        try {
            return (environment.baseUrl || '').replace(/\/api\/v1\/?$/, '');
        } catch {
            return '';
        }
    }

    /**
     * Resuelve el logoUrl guardado en BD (relativo /uploads/...) a URL absoluta
     * usable en <img src> y documentos imprimibles.
     * - data: / http(s) absolutas se devuelven tal cual
     * - '/uploads/...' => origin + logoUrl
     * - null/undefined => fallback /assets/images/logo_app.png
     */
    static resolveLogoUrl(logoUrl?: string | null): string {
        if (!logoUrl) {
            return `/${HelpersUtils.logoApp}`;
        }
        const v = logoUrl.trim();
        if (!v) {
            return `/${HelpersUtils.logoApp}`;
        }
        if (v.startsWith('data:')) {
            return v;
        }
        if (/^https?:\/\//i.test(v)) {
            return v;
        }
        if (v.startsWith('/')) {
            return `${HelpersUtils.backendOrigin()}${v}`;
        }
        return `${HelpersUtils.backendOrigin()}/${v}`;
    }

    /** Carga una imagen remota como base64 (para jsPDF addImage). Retorna null si falla. */
    static async logoToBase64(url: string): Promise<string | null> {
        try {
            if (!url || url.startsWith('data:')) {
                return url || null;
            }
            const res = await fetch(url, { mode: 'cors' });
            if (!res.ok) {
                return null;
            }
            const blob = await res.blob();
            return await new Promise<string | null>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    }

    static getMessageError(error: string[]): string {

        if (typeof error === 'string') {
            return error;
        }

        if (error.length > 0) {
            return error.join(', ');
        }
        return 'Error desconocido';
    }

    private static qrCache = new Map<string, string>();

    /** Extrae el texto crudo del QR: qrCode plano o links.qr (nuevo formato Factus). */
    static resolveQrText(doc: any): string | null {
        if (!doc || typeof doc !== 'object') {
            return null;
        }
        const raw = doc.qrCode ?? doc.qr ?? doc.links?.qr ?? null;
        if (typeof raw !== 'string') {
            return null;
        }
        const v = raw.trim();
        return v ? v : null;
    }

    /**
     * Convierte el texto del QR a dataURL PNG escaneable (generación 100% local).
     * - data:image/... se devuelve tal cual (compatibilidad).
     * - URL DIAN / cualquier texto => QR generado con lib `qrcode`.
     * - null/vacío => null.
     */
    static async toQrDataUrl(text?: string | null): Promise<string | null> {
        if (!text) {
            return null;
        }
        const v = text.trim();
        if (!v) {
            return null;
        }
        if (v.startsWith('data:image')) {
            return v;
        }
        const cached = HelpersUtils.qrCache.get(v);
        if (cached) {
            return cached;
        }
        try {
            const dataUrl = await QRCode.toDataURL(v, {
                width: 220,
                margin: 1,
                errorCorrectionLevel: 'M',
            });
            HelpersUtils.qrCache.set(v, dataUrl);
            return dataUrl;
        } catch {
            return null;
        }
    }
} 