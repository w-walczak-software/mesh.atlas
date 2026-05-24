export interface SystemIconDef {
  name: string;
  label: string;
}

export interface SystemIconCategory {
  key: string;
  icons: SystemIconDef[];
}

export const SYSTEM_ICON_CATEGORIES: SystemIconCategory[] = [
  {
    key: 'business',
    icons: [
      { name: 'business', label: 'Business' },
      { name: 'storefront', label: 'CRM / Sales' },
      { name: 'people', label: 'HR' },
      { name: 'handshake', label: 'Partners' },
      { name: 'campaign', label: 'Marketing' },
      { name: 'real_estate_agent', label: 'Sales' },
    ],
  },
  {
    key: 'finance',
    icons: [
      { name: 'payments', label: 'Payments' },
      { name: 'account_balance', label: 'Finance / Bank' },
      { name: 'receipt_long', label: 'Billing' },
      { name: 'savings', label: 'Treasury' },
      { name: 'calculate', label: 'Accounting' },
    ],
  },
  {
    key: 'data',
    icons: [
      { name: 'storage', label: 'Data Warehouse' },
      { name: 'analytics', label: 'Analytics / BI' },
      { name: 'bar_chart', label: 'Reporting' },
      { name: 'dataset', label: 'Dataset / MDM' },
      { name: 'table_chart', label: 'Master Data' },
    ],
  },
  {
    key: 'technical',
    icons: [
      { name: 'api', label: 'API / Integration' },
      { name: 'hub', label: 'Integration Hub' },
      { name: 'code', label: 'Development' },
      { name: 'terminal', label: 'DevOps / CLI' },
      { name: 'integration_instructions', label: 'Middleware' },
    ],
  },
  {
    key: 'cloud',
    icons: [
      { name: 'cloud', label: 'Cloud' },
      { name: 'dns', label: 'Infrastructure' },
      { name: 'lan', label: 'Network' },
      { name: 'memory', label: 'Hardware' },
      { name: 'router', label: 'Networking' },
    ],
  },
  {
    key: 'operations',
    icons: [
      { name: 'local_shipping', label: 'Logistics / TMS' },
      { name: 'inventory_2', label: 'Inventory / WMS' },
      { name: 'warehouse', label: 'Warehouse' },
      { name: 'precision_manufacturing', label: 'ERP / Manufacturing' },
      { name: 'factory', label: 'Production / MES' },
    ],
  },
  {
    key: 'communication',
    icons: [
      { name: 'email', label: 'Email' },
      { name: 'chat', label: 'Chat / Messaging' },
      { name: 'notifications', label: 'Notifications' },
      { name: 'phone', label: 'Telephony' },
    ],
  },
  {
    key: 'security',
    icons: [
      { name: 'security', label: 'Security' },
      { name: 'lock', label: 'Access Control' },
      { name: 'shield', label: 'Compliance' },
      { name: 'verified_user', label: 'Identity / IAM' },
    ],
  },
  {
    key: 'support',
    icons: [
      { name: 'support', label: 'Help Desk / ITSM' },
      { name: 'manage_accounts', label: 'User Management' },
      { name: 'headset_mic', label: 'Customer Support' },
      { name: 'gavel', label: 'Legal / Governance' },
    ],
  },
];
