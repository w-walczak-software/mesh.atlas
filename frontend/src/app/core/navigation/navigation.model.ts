export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  roles: string[];
  children?: NavItem[];
}

export interface NavigationConfig {
  items: NavItem[];
}
