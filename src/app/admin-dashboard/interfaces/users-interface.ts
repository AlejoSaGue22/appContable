

export interface UsersResponse {
    success: boolean;
    data: User[];
    message?: string;
    meta?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: Role;
    roleId: string;
    phone?: string;
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    isActive: boolean;
    isSystem: boolean;
    createdAt: string;
    updatedAt: string;
}


export interface CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
}

export interface UpdateUserDto {
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    phone?: string;
    isActive?: boolean;
}