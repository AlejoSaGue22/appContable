export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  users?: any[];
}

export interface CreateRoleDto {
  name: string;
  description: string;
  permissions: string[];
  isActive?: boolean;
}

export interface UpdateRoleDto extends Partial<CreateRoleDto> {}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
