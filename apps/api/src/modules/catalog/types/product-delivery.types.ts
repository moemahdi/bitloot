/**
 * Product Delivery Type System
 *
 * Defines the different types of digital products that can be delivered
 * through the BitLoot platform. Each type has its own data structure
 * and delivery format.
 */

/**
 * Enum for product delivery types
 * Determines what kind of digital item the product delivers
 */
export enum ProductDeliveryType {
  /** Single activation key (e.g., Steam key, Origin key, GOG key) */
  KEY = 'key',

  /** Username + Password credentials (full game accounts) */
  ACCOUNT = 'account',

  /** Redeemable code (gift cards, subscriptions like Xbox Game Pass, PS Plus) */
  CODE = 'code',

  /** Software license with optional seats/expiry */
  LICENSE = 'license',

  /** Multiple items bundled together */
  BUNDLE = 'bundle',

  /** Flexible JSON structure defined by admin */
  CUSTOM = 'custom',
}

/**
 * Inventory item status
 */
export enum InventoryItemStatus {
  /** Available for purchase */
  AVAILABLE = 'available',

  /** Reserved during payment processing */
  RESERVED = 'reserved',

  /** Successfully sold and delivered */
  SOLD = 'sold',

  /** Item has expired (time-limited items) */
  EXPIRED = 'expired',

  /** Marked as invalid by admin or customer report */
  INVALID = 'invalid',
}

// ============================================
// ITEM DATA STRUCTURES (Encrypted JSON)
// ============================================

/**
 * Key item data - for single activation keys
 */
export interface KeyItemData {
  type: 'key';
  key: string; // e.g., "XXXXX-XXXXX-XXXXX-XXXXX"
}

/**
 * Account item data - for credential-based products
 */
export interface AccountItemData {
  type: 'account';
  username: string;
  password: string;
  email?: string;
  recoveryEmail?: string;
  securityAnswers?: Record<string, string>;
  notes?: string; // "Don't change password" etc.
}

/**
 * Code item data - for gift cards, subscriptions
 */
export interface CodeItemData {
  type: 'code';
  code: string;
  pin?: string; // Some gift cards have PIN
  value?: number; // Face value (for gift cards)
  currency?: string;
}

/**
 * License item data - for software licenses
 */
export interface LicenseItemData {
  type: 'license';
  licenseKey: string;
  licensedTo?: string;
  seats?: number; // Number of allowed activations
  expiresAt?: string; // ISO date
  activationUrl?: string;
  downloadUrl?: string;
}

/**
 * Bundle item - a single item within a bundle
 */
export interface BundleItem {
  type: 'key' | 'account' | 'code' | 'license';
  label?: string;
  value: string;
  // Additional fields based on type
  username?: string;
  password?: string;
  pin?: string;
}

/**
 * Bundle item data - for product bundles containing multiple items
 */
export interface BundleItemData {
  type: 'bundle';
  items: BundleItem[];
}

/**
 * Custom field within a custom item
 */
export interface CustomField {
  label: string;
  value: string;
  sensitive?: boolean;
}

/**
 * Custom item data - for flexible admin-defined structures
 */
export interface CustomItemData {
  type: 'custom';
  fields: CustomField[];
}

/**
 * Union type for all item data structures
 */
export type ItemData =
  | KeyItemData
  | AccountItemData
  | CodeItemData
  | LicenseItemData
  | BundleItemData
  | CustomItemData;

// ============================================
// CUSTOM FIELD DEFINITIONS (for 'custom' type products)
// ============================================

/**
 * Definition for a custom field in a product
 * Used when deliveryType = 'custom'
 */
export interface CustomFieldDefinition {
  name: string; // Field identifier (snake_case)
  label: string; // Display label
  type: 'text' | 'password' | 'url' | 'date' | 'textarea';
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

// ============================================
// DELIVERY CONTENT (Customer-facing)
// ============================================

/**
 * A single item in the delivery content
 * Displayed to customer after purchase
 */
export interface DeliveryContentItem {
  type: 'key' | 'credential' | 'code' | 'license' | 'info' | 'custom';
  label: string;
  value: string;
  sensitive?: boolean; // Should be masked by default in UI
}

/**
 * Complete delivery content for an order item
 * Stored in R2 and retrieved by customer
 */
export interface DeliveryContent {
  productTitle: string;
  deliveryType: ProductDeliveryType;
  deliveryInstructions?: string;
  deliveredAt: string; // ISO date
  items: DeliveryContentItem[];
  notes?: string;
  faceValue?: number;
  currency?: string;
  activationUrl?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a masked preview of item data for display in admin UI
 * e.g., "XXXX-****-****-XXXX" for keys
 */
export function createMaskedPreview(itemData: ItemData): string {
  switch (itemData.type) {
    case 'key': {
      const key = itemData.key;
      if (key.length <= 8) return '****';
      return `${key.slice(0, 4)}****${key.slice(-4)}`;
    }

    case 'account': {
      const username = itemData.username;
      if (username.length <= 4) return '****';
      return `${username.slice(0, 2)}***@***`;
    }

    case 'code': {
      const code = itemData.code;
      if (code.length <= 6) return '****';
      return `${code.slice(0, 3)}***${code.slice(-3)}`;
    }

    case 'license': {
      const licenseKey = itemData.licenseKey;
      if (licenseKey.length <= 8) return '****';
      return `${licenseKey.slice(0, 4)}****${licenseKey.slice(-4)}`;
    }

    case 'bundle': {
      return `Bundle (${itemData.items.length} items)`;
    }

    case 'custom': {
      return `Custom (${itemData.fields.length} fields)`;
    }

    default:
      return '****';
  }
}

/**
 * Validate item data structure matches the expected type
 */
export function validateItemData(
  deliveryType: ProductDeliveryType,
  itemData: ItemData,
): { valid: boolean; error?: string } {
  if (itemData.type !== (deliveryType as string)) {
    return {
      valid: false,
      error: `Item data type '${itemData.type}' does not match product delivery type '${deliveryType}'`,
    };
  }

  switch (deliveryType) {
    case ProductDeliveryType.KEY:
      if (!('key' in itemData) || typeof itemData.key !== 'string' || itemData.key.length === 0) {
        return { valid: false, error: 'Key item requires a non-empty key field' };
      }
      break;

    case ProductDeliveryType.ACCOUNT:
      if (
        !('username' in itemData) ||
        !('password' in itemData) ||
        typeof itemData.username !== 'string' ||
        typeof itemData.password !== 'string' ||
        itemData.username.length === 0 ||
        itemData.password.length === 0
      ) {
        return { valid: false, error: 'Account item requires username and password' };
      }
      break;

    case ProductDeliveryType.CODE:
      if (!('code' in itemData) || typeof itemData.code !== 'string' || itemData.code.length === 0) {
        return { valid: false, error: 'Code item requires a non-empty code field' };
      }
      break;

    case ProductDeliveryType.LICENSE:
      if (
        !('licenseKey' in itemData) ||
        typeof itemData.licenseKey !== 'string' ||
        itemData.licenseKey.length === 0
      ) {
        return { valid: false, error: 'License item requires a non-empty licenseKey field' };
      }
      break;

    case ProductDeliveryType.BUNDLE:
      if (!('items' in itemData) || !Array.isArray(itemData.items) || itemData.items.length === 0) {
        return { valid: false, error: 'Bundle item requires at least one item in the items array' };
      }
      break;

    case ProductDeliveryType.CUSTOM:
      if (
        !('fields' in itemData) ||
        !Array.isArray(itemData.fields) ||
        itemData.fields.length === 0
      ) {
        return {
          valid: false,
          error: 'Custom item requires at least one field in the fields array',
        };
      }
      break;
  }

  return { valid: true };
}
