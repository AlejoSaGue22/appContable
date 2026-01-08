import { ErrorAuthResponse } from "src/app/auth/interfaces/auth-response.interface";

export interface Options {
    limit?: number;
    offset?: number;
}

export type ResponseResult =  | { success: true, data?: any, message?: string } | { success: false; error: ErrorAuthResponse };

export type modalOpen = { open: boolean, id: string };
