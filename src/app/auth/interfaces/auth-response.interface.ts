import { Permission, UserRole } from "@dashboard/interfaces/permission-interface";
import { UserAuth } from "./user-auth.interface";

export interface LoginResponse {
  user: UserAuth;
  token: string;
  menu?: any[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
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