export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  externalUrl?: string;
  requiredPermission?: string;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  other: string;
  parentId?: string;
  metadata?: any;
  createdAt: Date; 
  updatedAt: Date;
  
  children?: MenuItem[];
}

export interface CreateMenuDto {
  title?: string;
  icon: string;
  route?: string;
  externalUrl?: string;
  requiredPermission?: string;
  parentId?: string;
  order?: number;
  isActive?: boolean;
  isVisible?: boolean;
}

export interface UpdateMenuDto extends Partial<CreateMenuDto> {}

export interface MenuReorderDto {
  orderedIds: string[];
}
