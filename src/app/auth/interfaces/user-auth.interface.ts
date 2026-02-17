import { Permission, UserRole } from "@dashboard/interfaces/permission-interface";

// export interface User {
//     id:       string;
//     email:    string;
//     fullName: string;
//     isActive: boolean;
//     role:    string;
// }

export interface UserAuth {
  id: string;
  email: string;
  fullName: string;
  isActive?: boolean;
  role: UserRole;
  permissions: Permission[];
  lastLogin?: Date;
  createdAt: Date;
}