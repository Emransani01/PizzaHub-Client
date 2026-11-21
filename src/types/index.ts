export type UserRole = "customer" | "vendor" | "admin";

export type SubscriptionPlan = "free" | "premium";

export type MenuItemStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "inactive";

export type OrderStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type TransactionStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "expired";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  businessName: string | null;
  isBlocked: boolean;
  roleOnboarded: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null;
  createdAt: string | null;
  favoritesCount: number;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorBusinessName: string | null;
  isPremiumVendor: boolean;
  itemName: string;
  category: string;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: MenuItemStatus;
  isAvailable: boolean;
  rejectionReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OrderStatusEntry {
  status: OrderStatus;
  changedBy: string;
  changedByRole: UserRole;
  changedAt: string;
  note: string | null;
}

export interface Order {
  id: string;
  itemId: string;
  itemName: string;
  itemImage: string | null;
  itemPrice: number;
  /** Number of this menu item in the checkout line that produced the order. */
  quantity: number;
  /** `itemPrice × quantity` for this single order line. */
  lineTotal: number;
  /** Stable id shared by every order created by one checkout submission. */
  checkoutGroupId: string | null;
  vendorId: string;
  vendorName: string;
  customerId: string;
  customerName: string;
  deliveryDate: string;
  deliveryAddress: string;
  message: string | null;
  status: OrderStatus;
  statusHistory: OrderStatusEntry[];
  createdAt: string | null;
  updatedAt: string | null;
}

/** A single line stored in the browser cart, keyed by menu item id. */
export interface CartItem {
  itemId: string;
  quantity: number;
  itemName: string;
  category: string;
  vendorId: string;
  vendorName: string;
  /** Unit price captured when the item was added; used as the quote's expected price. */
  unitPrice: number;
  image: string | null;
}

/** The versioned payload persisted under `pizzahub:cart:v1:<userId>`. */
export interface CartSnapshot {
  version: 1;
  items: CartItem[];
  updatedAt: string;
}

export type CartQuoteIssueCode =
  | "MISSING"
  | "UNAVAILABLE"
  | "OWN_ITEM"
  | "PRICE_CHANGED";

export interface CartQuoteIssue {
  itemId: string;
  code: CartQuoteIssueCode;
  message: string;
  expectedUnitPrice?: number;
  currentUnitPrice?: number;
}

export interface CartQuoteLine {
  itemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  itemName?: string;
  vendorId?: string;
}

export interface CartQuoteResult {
  items: CartQuoteLine[];
  subtotal: number;
  total: number;
  canCheckout: boolean;
  issues: CartQuoteIssue[];
  /** Present only when `canCheckout` is true and there are no issues. */
  quoteToken: string | null;
  quoteExpiresAt: string | null;
}

export interface CheckoutInput {
  checkoutGroupId: string;
  items: { itemId: string; quantity: number }[];
  quoteToken: string;
  deliveryDate: string;
  deliveryAddress: string;
  message?: string;
}

export interface CheckoutSummary {
  orderCount?: number;
  subtotal?: number;
  total?: number;
  [key: string]: unknown;
}

export interface CheckoutResult {
  checkoutGroupId: string;
  orders: Order[];
  summary: CheckoutSummary;
  replayed: boolean;
}

export interface Transaction {
  id: string;
  vendorId: string;
  vendorName: string;
  plan: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  stripeSessionId: string;
  stripeSubscriptionId: string | null;
  paidAt: string | null;
  createdAt: string | null;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface CategoryConfig {
  name: string;
  slug: string;
  description: string;
}

export interface PublicConfig {
  googleEnabled: boolean;
  stripeEnabled: boolean;
  imgbbEnabled: boolean;
  freePlanActiveItemLimit: number;
  categories: CategoryConfig[];
}

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  premiumActive: boolean;
  expiresAt: string | null;
  freePlanActiveItemLimit: number;
  stripeConfigured: boolean;
  priceConfigured: boolean;
}

export interface CheckoutStatus {
  sessionId: string;
  status: TransactionStatus;
  plan: string;
  amount: number;
  currency: string;
  paidAt: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VendorStats {
  totalItems: number;
  approvedItems: number;
  pendingItems: number;
  rejectedItems: number;
  activeItems: number;
  inactiveItems: number;
  activeItemLimit: number;
  totalOrders: number;
  orders: Record<OrderStatus, number>;
  subscriptionPlan: SubscriptionPlan;
  premiumActive: boolean;
  subscriptionExpiresAt: string | null;
}

export interface CustomerStats {
  totalOrders: number;
  orders: Record<OrderStatus, number>;
  favoritesCount: number;
}

export interface AdminStats {
  totalUsers: number;
  vendors: number;
  customers: number;
  admins: number;
  blockedUsers: number;
  totalItems: number;
  pendingItems: number;
  approvedItems: number;
  rejectedItems: number;
  inactiveItems: number;
  totalOrders: number;
  orders: Record<OrderStatus, number>;
  paidTransactions: number;
  revenue: number;
}

export interface DashboardOverview {
  role: UserRole;
  stats: VendorStats | CustomerStats | AdminStats;
  series: { date: string; count: number }[];
  recentOrders: Order[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  businessName: string | null;
  isBlocked: boolean;
  roleOnboarded: boolean;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null;
  createdAt: string | null;
}
