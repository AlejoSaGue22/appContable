import { User } from "./user.interface";

export interface LoginResponse {
    user:  User;
    token: string;
}

export interface ErrorAuthResponse {
    message: string;
    error: string;
    statusCode: number;
}

export interface registerResponse {

}