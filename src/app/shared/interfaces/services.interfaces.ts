import { ErrorAuthResponse } from "src/app/auth/interfaces/auth-response.interface";

export interface Options {
    limit?: number;
    offset?: number;
    page?: number;
    venta_compra?: 'venta' | 'compra';
    search?: string;
}

export type ResponseResult = { success: true, data?: any, message?: string } | { success: false, error: ErrorAuthResponse, message: string[] };

export type modalOpen = { open: boolean, id: string };
