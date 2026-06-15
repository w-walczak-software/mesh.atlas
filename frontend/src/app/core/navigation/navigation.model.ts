export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  roles: string[];
  children?: NavItem[];
  exactMatch?: boolean;
}

export interface NavigationConfig {
  items: NavItem[];
}
