import { Permission, UserRole } from "@dashboard/interfaces/permission-interface";
import { User } from "./user.interface";

export interface LoginResponse {
    user:  User;
    token: string;
    menu?: any[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  exp: number;
}

export interface ErrorAuthResponse {
    message: string;
    error: string;
    statusCode: number;
}

export interface registerResponse {

}