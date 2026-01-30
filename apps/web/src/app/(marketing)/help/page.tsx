'use client';

import {
  HelpCircle,
  Search,
  Bitcoin,
  Shield,
  RefreshCw,
  Clock,
  MessageCircle,
  Package,
  ShieldCheck,
  Heart,
  Mail,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Key,
  FileText,
  ExternalLink,
  ChevronRight,
  LifeBuoy,
  BookOpen,
  ArrowRight,
  AlertCircle,
  Gamepad2,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Button } from '@/design-system/primitives/button';
import { Input } from '@/design-system/primitives/input';
import { Badge } from '@/design-system/primitives/badge';
import { Separator } from '@/design-system/primitives/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/design-system/primitives/accordion';

// Last updated date
const LAST_UPDATED = 'January 30, 2026';

// ============================================================================
// SECTION COMPONENT
// ============================================================================

function Section({
  id,
  icon: Icon,
  title,
  description,
  children,
  iconColor = 'text-green-success',
  bgColor = 'bg-green-success/10',
  borderColor = 'border-green-success/30',
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  iconColor?: string;
  bgColor?: string;
  borderColor?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="scroll-mt-24"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bgColor} ${borderColor} border shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-text-primary">{title}</h2>
          {description != null && description !== '' && (
            <p className="text-text-secondary mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

// ============================================================================
// FAQ ITEM COMPONENT
// ============================================================================

interface FAQItemData {
  id: string;
  question: string;
  answer: string;
  category: string;
}

function FAQAccordion({ items, defaultOpen }: { items: FAQItemData[]; defaultOpen?: string[] }) {
  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="space-y-3">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="group border rounded-xl overflow-hidden transition-all duration-300 bg-bg-secondary/40 border-border-subtle hover:border-border-accent hover:bg-bg-secondary/60 data-[state=open]:bg-bg-secondary/80 data-[state=open]:border-green-success/40"
        >
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <span className="text-left font-medium text-text-primary group-hover:text-green-success group-data-[state=open]:text-green-success transition-colors">
              {item.question}
            </span>
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <p className="text-text-secondary leading-relaxed">{item.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// ============================================================================
// QUICK LINK CARD
// ============================================================================

function QuickLinkCard({
  icon: Icon,
  title,
  description,
  href,
  color = 'cyan',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color?: 'cyan' | 'purple' | 'orange' | 'green' | 'pink';
}) {
  const colorClasses = {
    cyan: 'border-cyan-glow/20 hover:border-cyan-glow/50 bg-cyan-glow/5 hover:bg-cyan-glow/10 text-cyan-glow',
    purple: 'border-purple-neon/20 hover:border-purple-neon/50 bg-purple-neon/5 hover:bg-purple-neon/10 text-purple-neon',
    orange: 'border-orange-warning/20 hover:border-orange-warning/50 bg-orange-warning/5 hover:bg-orange-warning/10 text-orange-warning',
    green: 'border-green-success/20 hover:border-green-success/50 bg-green-success/5 hover:bg-green-success/10 text-green-success',
    pink: 'border-pink-featured/20 hover:border-pink-featured/50 bg-pink-featured/5 hover:bg-pink-featured/10 text-pink-featured',
  };

  return (
    <Link href={href}>
      <Card className={`glass transition-all duration-300 group cursor-pointer ${colorClasses[color]}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl bg-bg-secondary/50 group-hover:scale-110 transition-transform`}>
              <Icon className={`h-6 w-6 ${colorClasses[color].split(' ').pop()}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary group-hover:text-current transition-colors flex items-center gap-2">
                {title}
                <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-sm text-text-secondary mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// ALL FAQ DATA - COMPREHENSIVE
// ============================================================================

const ALL_FAQS: FAQItemData[] = [
  // Getting Started
  {
    id: 'what-is-bitloot',
    question: 'What is BitLoot?',
    answer: 'BitLoot is a cryptocurrency-only digital marketplace for game keys, software licenses, gift cards, and subscriptions. We offer instant delivery, secure encrypted key storage, and support for 300+ cryptocurrencies. All transactions are secure, and keys are delivered within minutes of payment confirmation.',
    category: 'getting-started',
  },
  {
    id: 'how-to-buy',
    question: 'How do I buy a game key?',
    answer: 'Simply browse our catalog, add products to your cart, and proceed to checkout. Enter your email address (or log in if you have an account), select your preferred cryptocurrency, and complete the payment. Your keys will be delivered instantly to your email and account dashboard once payment is confirmed.',
    category: 'getting-started',
  },
  {
    id: 'guest-checkout',
    question: 'Can I buy without creating an account?',
    answer: 'Yes! We offer guest checkout for quick purchases. Simply enter your email, complete payment, and receive your key directly. However, creating a free account gives you benefits like purchase history, faster checkouts, wishlists, and easy key retrieval anytime.',
    category: 'getting-started',
  },
  {
    id: 'account-benefits',
    question: 'What are the benefits of creating an account?',
    answer: 'With a free BitLoot account, you get: permanent access to all your purchased keys, order history and status tracking, a watchlist to save products for later, faster checkout with saved preferences, and email notifications for price drops on watchlisted items. Your keys are always safely stored and accessible anytime.',
    category: 'getting-started',
  },
  
  // Payments & Crypto
  {
    id: 'crypto-payment',
    question: 'What cryptocurrencies do you accept?',
    answer: 'We accept over 300+ cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), USDT, USDC, Litecoin (LTC), Dogecoin (DOGE), Solana (SOL), and many more. All payments are processed securely through NOWPayments with competitive real-time exchange rates.',
    category: 'payments',
  },
  {
    id: 'payment-confirmation',
    question: 'How long do crypto payments take to confirm?',
    answer: 'Confirmation times vary by cryptocurrency. Bitcoin typically requires 1-3 confirmations (10-30 minutes), while faster networks like Litecoin or stablecoins (USDT, USDC) confirm in under 5 minutes. Our system automatically detects payments and processes your order instantly upon confirmation.',
    category: 'payments',
  },
  {
    id: 'underpayment',
    question: 'What happens if I underpay for my order?',
    answer: 'If you send less cryptocurrency than required, your payment is marked as "underpaid" and the order fails. These funds are non-refundable. Network fees must be accounted for by the sender. We recommend adding a small buffer (1-2%) to ensure full payment is received after network fees.',
    category: 'payments',
  },
  {
    id: 'wrong-crypto',
    question: 'What if I send the wrong cryptocurrency or use the wrong network?',
    answer: 'Sending the wrong cryptocurrency or using the wrong network (e.g., sending BTC to an ETH address, or using BEP20 instead of ERC20) results in permanently lost funds. BitLoot cannot recover these transactions. Always double-check the payment details, including the correct network and token, before sending.',
    category: 'payments',
  },
  {
    id: 'overpayment',
    question: 'What happens if I overpay?',
    answer: 'Overpayments cannot be refunded due to the irreversible nature of cryptocurrency transactions and the costs associated with processing refunds. Always verify the exact amount before sending. If you accidentally overpay by a small amount, please contact support and we may be able to provide account credit for future purchases.',
    category: 'payments',
  },
  {
    id: 'payment-expired',
    question: 'My payment window expired. What should I do?',
    answer: 'Payment windows typically expire after 20-60 minutes. If your payment expired, you\'ll need to create a new order. If you sent payment after expiration, contact our support team with your transaction hash (TXID) and order ID - we may be able to manually process your order.',
    category: 'payments',
  },
  
  // Orders & Delivery
  {
    id: 'delivery-time',
    question: 'How fast will I receive my game key?',
    answer: 'Most orders are delivered instantly within 1-5 minutes after payment confirmation. Our fully automated system ensures lightning-fast delivery directly to your email and account dashboard. For crypto payments, delivery begins once the transaction receives sufficient network confirmations.',
    category: 'orders',
  },
  {
    id: 'key-access',
    question: 'How do I access my purchased keys?',
    answer: 'After successful payment, your keys are instantly available in your account\'s Purchases tab. Click on any order to expand it and reveal your product keys. You can copy them individually to redeem on your platform. Keys are also sent to your email address for backup access.',
    category: 'orders',
  },
  {
    id: 'key-not-visible',
    question: 'My payment was successful but I can\'t see my keys. What should I do?',
    answer: 'If your order shows as "paid" but keys are not visible, use the "Recover Keys" button on the order in your Purchases tab. This will re-trigger the key delivery process. If the issue persists, contact support with your order ID and we\'ll resolve it immediately.',
    category: 'orders',
  },
  {
    id: 'order-history',
    question: 'Can I see my order history?',
    answer: 'Yes! All your past orders are visible in your account\'s Purchases tab. You can view order details, payment status, and re-access keys for fulfilled orders anytime. Your keys are permanently stored in your account and never expire.',
    category: 'orders',
  },
  {
    id: 'key-activation',
    question: 'How do I redeem my game key?',
    answer: 'Each key includes instructions for the specific platform (Steam, Epic, GOG, PlayStation, Xbox, etc.). Generally, open the platform client, navigate to "Activate a Product" or "Redeem Code", enter your key, and confirm. The game will be added to your library immediately.',
    category: 'orders',
  },
  
  // Keys & Products
  {
    id: 'key-security',
    question: 'Are the game keys legitimate and secure?',
    answer: 'Absolutely! All our keys are sourced from authorized distributors and verified before delivery. Each key is encrypted using AES-256-GCM and securely stored in our cloud infrastructure until you reveal it. We guarantee 100% authentic, region-appropriate keys with full activation support.',
    category: 'products',
  },
  {
    id: 'region-restrictions',
    question: 'Are there regional restrictions on game keys?',
    answer: 'Some keys may have regional restrictions set by publishers. Each product listing clearly indicates the region (Global, EU, US, etc.). Make sure to check the region before purchasing. If you purchase a key for a different region, it may not activate on your account.',
    category: 'products',
  },
  {
    id: 'account-products',
    question: 'What are account products and how do they work?',
    answer: 'Some products are sold as full game accounts rather than activation keys. With account products, we create a new account for you with the purchased game already activated. You\'ll receive login credentials in your inventory. IMPORTANT: Do not add payment methods, change the region, or make purchases on the account—doing so may result in a ban with no refund. Use the account only for the purchased game.',
    category: 'products',
  },
  {
    id: 'key-already-used',
    question: 'My key shows as already redeemed. What should I do?',
    answer: 'If you receive a key that\'s already been redeemed and you haven\'t used it yourself, contact our support team immediately with your order ID and a screenshot of the error message. We\'ll investigate and provide a replacement key or full refund.',
    category: 'products',
  },
  
  // Account & Security
  {
    id: 'account-security',
    question: 'How do you protect my account and purchases?',
    answer: 'Your security is our priority. We use industry-standard encryption for all transactions, secure OTP (one-time password) authentication for account access, and AES-256-GCM encrypted key storage. Purchase history and keys are safely stored and can be accessed anytime. We never store payment card details - all payments are crypto-only.',
    category: 'security',
  },
  {
    id: 'email-change',
    question: 'How do I change my email address?',
    answer: 'Go to your Profile > Security tab, enter your new email address, and click "Change Email". For maximum security, you\'ll receive verification codes on BOTH your old and new email addresses (dual-OTP). Enter both codes to confirm the change.',
    category: 'security',
  },
  {
    id: 'active-sessions',
    question: 'How do I manage my active sessions?',
    answer: 'In your Profile > Security tab, you can view all devices currently logged into your account. Each session shows the device type, IP address, and last activity time. You can revoke any session individually or sign out all devices at once for security.',
    category: 'security',
  },
  {
    id: 'account-deletion',
    question: 'How do I delete my account?',
    answer: 'You can request account deletion in Profile > Security tab. Your account enters a 30-day grace period during which you can still log in and cancel the deletion. After 30 days, all your data is permanently deleted including purchase history, keys, and personal information. This action cannot be undone.',
    category: 'security',
  },
  {
    id: 'password-security',
    question: 'Why don\'t I have a password?',
    answer: 'BitLoot uses passwordless authentication via OTP (one-time password). When you log in, we send a 6-digit code to your email that expires in 5 minutes. This is more secure than traditional passwords as there\'s nothing to remember, steal, or reuse across sites.',
    category: 'security',
  },
  
  // Watchlist
  {
    id: 'watchlist-add',
    question: 'How do I add products to my watchlist?',
    answer: 'While browsing products, click the heart icon on any product card to add it to your watchlist. View all your saved products in your Profile > Watchlist tab. You can easily add items to cart or remove them from the watchlist at any time.',
    category: 'watchlist',
  },
  {
    id: 'price-alerts',
    question: 'Will I be notified about price changes?',
    answer: 'Price drop notifications for watchlist items are coming soon! You\'ll receive email alerts when products on your watchlist go on sale or drop below your target price. Stay tuned for this feature update.',
    category: 'watchlist',
  },
  
  // Refunds
  {
    id: 'refund-policy',
    question: 'What is your refund policy?',
    answer: 'Due to the digital nature of our products, all sales are generally final and non-refundable once a key has been revealed or delivered. However, if you receive an invalid or already-used key that we can verify was not redeemed by you, we\'ll provide a replacement or full refund. Our support team is available 24/7 to assist with any issues.',
    category: 'refunds',
  },
  {
    id: 'refund-eligible',
    question: 'When am I eligible for a refund?',
    answer: 'You may be eligible for a refund or replacement if: the key is invalid or non-working (verified as not previously redeemed), you accidentally purchased the same product twice, the product is significantly different from its description, or there was a technical failure on our end preventing delivery.',
    category: 'refunds',
  },
  {
    id: 'refund-not-eligible',
    question: 'When am I NOT eligible for a refund?',
    answer: 'Refunds are NOT available for: change of mind after purchase, keys already revealed or redeemed, underpayments (sent less crypto than required), wrong cryptocurrency or network used, price drops after purchase, compatibility issues with your system, or regional restrictions (your responsibility to check).',
    category: 'refunds',
  },
  {
    id: 'refund-process',
    question: 'How do I request a refund?',
    answer: 'Contact our support team via live chat or email with your order ID, a description of the issue, and any relevant screenshots (e.g., error messages). We\'ll investigate within 24-48 hours and process eligible refunds within 3-7 business days. Crypto refunds are sent to the original wallet address.',
    category: 'refunds',
  },
  {
    id: 'refund-wrong-purchase',
    question: 'I accidentally bought the wrong product. Can I exchange it?',
    answer: 'Unfortunately, we cannot exchange or replace products purchased by mistake, even if the key has not been revealed. Once a purchase is made, the order is processed and keys are reserved. Please carefully review your cart and product details before completing checkout.',
    category: 'refunds',
  },
  {
    id: 'refund-account-products',
    question: 'What is the refund policy for account products?',
    answer: 'Account products (full game accounts rather than keys) follow stricter refund policies. Once account credentials are delivered, the product is considered used and non-refundable. If you modify the account (adding payment methods, changing region, making purchases), it may be banned - this is not covered by our refund policy.',
    category: 'refunds',
  },
  
  // Support
  {
    id: 'support',
    question: 'How can I contact customer support?',
    answer: 'Our support team is available 24/7 via live chat on the website (click the chat icon in the bottom-right corner) or email at support@bitloot.com. For order-related issues, please have your order ID ready. Most inquiries are resolved within a few hours.',
    category: 'support',
  },
  {
    id: 'response-time',
    question: 'How quickly will support respond?',
    answer: 'Live chat: Usually instant during peak hours. Email: Within 24 hours, often much faster. For urgent order issues, we recommend using live chat. Our support team operates 24/7 across multiple time zones.',
    category: 'support',
  },
];

// ============================================================================
// CATEGORY DATA
// ============================================================================

const CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen, color: 'text-green-success' },
  { id: 'payments', label: 'Payments & Crypto', icon: Bitcoin, color: 'text-purple-neon' },
  { id: 'orders', label: 'Orders & Delivery', icon: Package, color: 'text-cyan-glow' },
  { id: 'products', label: 'Keys & Products', icon: Gamepad2, color: 'text-orange-warning' },
  { id: 'security', label: 'Account & Security', icon: Shield, color: 'text-pink-featured' },
  { id: 'watchlist', label: 'Watchlist', icon: Heart, color: 'text-pink-500' },
  { id: 'refunds', label: 'Refunds', icon: RefreshCw, color: 'text-orange-warning' },
  { id: 'support', label: 'Support', icon: LifeBuoy, color: 'text-cyan-glow' },
];

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function HelpCenterPage(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Filter FAQs based on search and category
  const filteredFAQs = useMemo(() => {
    let results = ALL_FAQS;

    if (activeCategory !== null) {
      results = results.filter((faq) => faq.category === activeCategory);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query)
      );
    }

    return results;
  }, [searchQuery, activeCategory]);

  // Group FAQs by category for display
  const faqsByCategory = useMemo(() => {
    const grouped: Record<string, FAQItemData[]> = {};
    for (const category of CATEGORIES) {
      grouped[category.id] = ALL_FAQS.filter((faq) => faq.category === category.id);
    }
    return grouped;
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-b from-bg-secondary/50 to-transparent border-b border-border-subtle">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-green-success/5 via-transparent to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-success/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-glow/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-success/10 border border-green-success/30 mb-6">
              <HelpCircle className="w-4 h-4 text-green-success" />
              <span className="text-sm text-green-success font-medium">Help Center</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-4">
              How can we <span className="text-gradient-primary">help you?</span>
            </h1>

            <p className="text-lg text-text-secondary mb-8">
              Find answers to common questions, learn how to use BitLoot, or get in touch with our support team.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveCategory(null); // Clear category filter when searching
                }}
                className="pl-12 pr-4 py-6 text-lg bg-bg-secondary/80 border-border-subtle focus:border-green-success/50 rounded-xl"
              />
              {searchQuery !== '' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>{ALL_FAQS.length}+ FAQ answers</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Updated: {LAST_UPDATED}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-success" />
                <span>24/7 Live Support</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="bg-bg-secondary/30 border-b border-border-subtle">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="grid gap-4 md:grid-cols-4">
            <QuickLinkCard
              icon={MessageCircle}
              title="Live Chat"
              description="Get instant help from our team"
              href="#support"
              color="green"
            />
            <QuickLinkCard
              icon={Package}
              title="Track Order"
              description="Check your order status"
              href="/profile?tab=purchases"
              color="cyan"
            />
            <QuickLinkCard
              icon={RefreshCw}
              title="Refund Policy"
              description="Understand our return policy"
              href="/refund"
              color="orange"
            />
            <QuickLinkCard
              icon={Key}
              title="Recover Keys"
              description="Re-download your game keys"
              href="/profile?tab=purchases"
              color="purple"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Table of Contents */}
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <h3 className="font-semibold text-text-primary mb-4">Browse by Topic</h3>

              {/* Category Filters */}
              <nav className="space-y-1">
                <Button
                  variant={activeCategory === null && searchQuery === '' ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveCategory(null);
                    setSearchQuery('');
                  }}
                >
                  All Topics
                </Button>
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={activeCategory === category.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveCategory(category.id);
                        setSearchQuery('');
                      }}
                    >
                      <Icon className={`h-4 w-4 mr-2 ${category.color}`} />
                      {category.label}
                      <Badge variant="outline" className="ml-auto text-xs">
                        {faqsByCategory[category.id]?.length ?? 0}
                      </Badge>
                    </Button>
                  );
                })}
              </nav>

              <Separator className="my-4" />

              {/* Legal Links */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-text-muted">Legal & Policies</h4>
                <nav className="space-y-1">
                  <Link
                    href="/terms"
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-cyan-glow transition-colors py-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    Terms of Service
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Link>
                  <Link
                    href="/privacy"
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-purple-neon transition-colors py-1.5"
                  >
                    <Shield className="h-4 w-4" />
                    Privacy Policy
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Link>
                  <Link
                    href="/refund"
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-orange-warning transition-colors py-1.5"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refund Policy
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Link>
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 space-y-12">
            {/* Search Results Mode */}
            {(searchQuery !== '' || activeCategory !== null) ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">
                      {searchQuery !== ''
                        ? `Search results for "${searchQuery}"`
                        : activeCategory !== null
                        ? CATEGORIES.find((c) => c.id === activeCategory)?.label
                        : 'All FAQs'}
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">
                      {filteredFAQs.length} {filteredFAQs.length === 1 ? 'result' : 'results'} found
                    </p>
                  </div>
                  {(searchQuery !== '' || activeCategory !== null) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory(null);
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>

                {filteredFAQs.length > 0 ? (
                  <FAQAccordion items={filteredFAQs} />
                ) : (
                  <Card className="glass border-border-subtle">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Search className="h-12 w-12 text-text-muted mb-4" />
                      <h3 className="text-lg font-semibold text-text-primary mb-2">No results found</h3>
                      <p className="text-text-secondary mb-4">
                        Try a different search term or browse our topics
                      </p>
                      <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              /* Full Help Center Content */
              <>
                {/* Getting Started */}
                <Section
                  id="getting-started"
                  icon={BookOpen}
                  title="Getting Started"
                  description="New to BitLoot? Start here!"
                  iconColor="text-green-success"
                  bgColor="bg-green-success/10"
                  borderColor="border-green-success/30"
                >
                  <FAQAccordion items={faqsByCategory['getting-started'] ?? []} defaultOpen={['what-is-bitloot']} />
                </Section>

                <Separator className="bg-border-subtle" />

                {/* Payments & Crypto */}
                <Section
                  id="payments"
                  icon={Bitcoin}
                  title="Payments & Cryptocurrency"
                  description="Everything about crypto payments, confirmations, and common issues"
                  iconColor="text-purple-neon"
                  bgColor="bg-purple-neon/10"
                  borderColor="border-purple-neon/30"
                >
                  {/* Important Warning */}
                  <Card className="border-orange-warning/30 bg-orange-warning/5 mb-6">
                    <CardContent className="flex items-start gap-4 p-5">
                      <AlertTriangle className="h-6 w-6 text-orange-warning shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-orange-warning mb-1">Important Payment Information</h4>
                        <p className="text-sm text-text-secondary">
                          Cryptocurrency transactions are <strong>irreversible</strong>. Underpayments, wrong networks, or wrong tokens
                          result in lost funds that cannot be recovered. Always double-check payment details before sending.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <FAQAccordion items={faqsByCategory['payments'] ?? []} />
                </Section>

                <Separator className="bg-border-subtle" />

                {/* Orders & Delivery */}
                <Section
                  id="orders"
                  icon={Package}
                  title="Orders & Delivery"
                  description="Track orders, access keys, and resolve delivery issues"
                  iconColor="text-cyan-glow"
                  bgColor="bg-cyan-glow/10"
                  borderColor="border-cyan-glow/30"
                >
                  <FAQAccordion items={faqsByCategory['orders'] ?? []} />
                </Section>

                <Separator className="bg-border-subtle" />

                {/* Keys & Products */}
                <Section
                  id="products"
                  icon={Gamepad2}
                  title="Keys & Products"
                  description="About game keys, activation, and product types"
                  iconColor="text-orange-warning"
                  bgColor="bg-orange-warning/10"
                  borderColor="border-orange-warning/30"
                >
                  {/* Account Products Warning */}
                  <Card className="border-orange-warning/30 bg-linear-to-r from-orange-warning/10 via-orange-warning/5 to-orange-warning/10 mb-6">
                    <CardContent className="flex items-start gap-4 p-5">
                      <AlertCircle className="h-6 w-6 text-orange-warning shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-orange-warning mb-1">Account Products Warning</h4>
                        <p className="text-sm text-text-secondary">
                          Some products are sold as full game <strong>accounts</strong>, not keys. Do NOT add payment methods,
                          change region, or make purchases on account products - this may result in a permanent ban with no refund.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <FAQAccordion items={faqsByCategory['products'] ?? []} />
                </Section>

                <Separator className="bg-border-subtle" />

                {/* Account & Security */}
                <Section
                  id="security"
                  icon={Shield}
                  title="Account & Security"
                  description="Manage your account, sessions, and security settings"
                  iconColor="text-pink-featured"
                  bgColor="bg-pink-featured/10"
                  borderColor="border-pink-featured/30"
                >
                  <FAQAccordion items={faqsByCategory['security'] ?? []} />
                </Section>

                <Separator className="bg-border-subtle" />

                {/* Watchlist */}
                <Section
                  id="watchlist"
                  icon={Heart}
                  title="Watchlist"
                  description="Save products and get notified about price drops"
                  iconColor="text-pink-500"
                  bgColor="bg-pink-500/10"
                  borderColor="border-pink-500/30"
                >
                  <FAQAccordion items={faqsByCategory['watchlist'] ?? []} />
                </Section>

                <Separator className="bg-border-subtle" />

                {/* Refunds */}
                <Section
                  id="refunds"
                  icon={RefreshCw}
                  title="Refunds & Returns"
                  description="Understand our refund policy and how to request a refund"
                  iconColor="text-orange-warning"
                  bgColor="bg-orange-warning/10"
                  borderColor="border-orange-warning/30"
                >
                  {/* Refund Summary */}
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Card className="border-green-success/30 bg-green-success/5">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <CheckCircle2 className="h-5 w-5 text-green-success" />
                          <h4 className="font-semibold text-green-success">May Qualify</h4>
                        </div>
                        <ul className="space-y-2 text-sm text-text-secondary">
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-success shrink-0 mt-0.5" />
                            Invalid or non-working key
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-success shrink-0 mt-0.5" />
                            Duplicate purchase
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-success shrink-0 mt-0.5" />
                            Product different from description
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-success shrink-0 mt-0.5" />
                            Technical failure on our end
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card className="border-orange-warning/30 bg-orange-warning/5">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <XCircle className="h-5 w-5 text-orange-warning" />
                          <h4 className="font-semibold text-orange-warning">NOT Eligible</h4>
                        </div>
                        <ul className="space-y-2 text-sm text-text-secondary">
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-orange-warning shrink-0 mt-0.5" />
                            Change of mind
                          </li>
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-orange-warning shrink-0 mt-0.5" />
                            Key already revealed
                          </li>
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-orange-warning shrink-0 mt-0.5" />
                            Underpayment or wrong crypto
                          </li>
                          <li className="flex items-start gap-2">
                            <XCircle className="h-4 w-4 text-orange-warning shrink-0 mt-0.5" />
                            Price drops after purchase
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                  <FAQAccordion items={faqsByCategory['refunds'] ?? []} />
                  <div className="mt-4">
                    <Button asChild variant="outline" className="border-orange-warning/30 text-orange-warning hover:bg-orange-warning/10">
                      <Link href="/refund">
                        <FileText className="h-4 w-4 mr-2" />
                        Read Full Refund Policy
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </Section>

                <Separator className="bg-border-subtle" />

                {/* Contact Support */}
                <Section
                  id="support"
                  icon={LifeBuoy}
                  title="Contact Support"
                  description="Get in touch with our 24/7 support team"
                  iconColor="text-cyan-glow"
                  bgColor="bg-cyan-glow/10"
                  borderColor="border-cyan-glow/30"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="glass border-cyan-glow/20 hover:border-cyan-glow/50 transition-all group">
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-cyan-glow/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-cyan-glow/20 transition-colors">
                          <MessageCircle className="h-7 w-7 text-cyan-glow" />
                        </div>
                        <h3 className="font-semibold text-text-primary mb-2">Live Chat</h3>
                        <p className="text-sm text-text-secondary mb-4">
                          Get instant help from our support team. Available 24/7.
                        </p>
                        <Button className="w-full bg-cyan-glow/10 text-cyan-glow hover:bg-cyan-glow/20 border border-cyan-glow/30">
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Start Chat
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="glass border-purple-neon/20 hover:border-purple-neon/50 transition-all group">
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 rounded-full bg-purple-neon/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-neon/20 transition-colors">
                          <Mail className="h-7 w-7 text-purple-neon" />
                        </div>
                        <h3 className="font-semibold text-text-primary mb-2">Email Support</h3>
                        <p className="text-sm text-text-secondary mb-4">
                          Send us an email and we&apos;ll respond within 24 hours.
                        </p>
                        <Button
                          className="w-full bg-purple-neon/10 text-purple-neon hover:bg-purple-neon/20 border border-purple-neon/30"
                          onClick={() => (window.location.href = 'mailto:support@bitloot.com')}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          support@bitloot.com
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Support Info */}
                  <div className="grid gap-4 md:grid-cols-3 mt-6">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-bg-secondary/50 border border-border-subtle">
                      <Clock className="h-5 w-5 text-green-success" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">Response Time</p>
                        <p className="text-xs text-text-secondary">Live chat: Instant • Email: &lt;24h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-bg-secondary/50 border border-border-subtle">
                      <Globe className="h-5 w-5 text-purple-neon" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">Availability</p>
                        <p className="text-xs text-text-secondary">24/7 • Multiple languages</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-bg-secondary/50 border border-border-subtle">
                      <ShieldCheck className="h-5 w-5 text-orange-warning" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">Have Order ID Ready</p>
                        <p className="text-xs text-text-secondary">For faster resolution</p>
                      </div>
                    </div>
                  </div>

                  <FAQAccordion items={faqsByCategory['support'] ?? []} />
                </Section>

                <Separator className="bg-border-subtle" />

                {/* Legal & Policies */}
                <Section
                  id="policies"
                  icon={FileText}
                  title="Legal & Policies"
                  description="Our terms, privacy policy, and legal information"
                  iconColor="text-text-muted"
                  bgColor="bg-bg-tertiary"
                  borderColor="border-border-subtle"
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <Link href="/terms">
                      <Card className="glass border-cyan-glow/20 hover:border-cyan-glow/50 transition-all group h-full">
                        <CardContent className="p-5">
                          <FileText className="h-8 w-8 text-cyan-glow mb-3 group-hover:scale-110 transition-transform" />
                          <h3 className="font-semibold text-text-primary mb-1 group-hover:text-cyan-glow transition-colors">
                            Terms of Service
                          </h3>
                          <p className="text-sm text-text-secondary">
                            Rules and guidelines for using BitLoot
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                    <Link href="/privacy">
                      <Card className="glass border-purple-neon/20 hover:border-purple-neon/50 transition-all group h-full">
                        <CardContent className="p-5">
                          <Shield className="h-8 w-8 text-purple-neon mb-3 group-hover:scale-110 transition-transform" />
                          <h3 className="font-semibold text-text-primary mb-1 group-hover:text-purple-neon transition-colors">
                            Privacy Policy
                          </h3>
                          <p className="text-sm text-text-secondary">
                            How we collect, use, and protect your data
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                    <Link href="/refund">
                      <Card className="glass border-orange-warning/20 hover:border-orange-warning/50 transition-all group h-full">
                        <CardContent className="p-5">
                          <RefreshCw className="h-8 w-8 text-orange-warning mb-3 group-hover:scale-110 transition-transform" />
                          <h3 className="font-semibold text-text-primary mb-1 group-hover:text-orange-warning transition-colors">
                            Refund Policy
                          </h3>
                          <p className="text-sm text-text-secondary">
                            Our policy for returns and refunds
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </Section>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Still Need Help Footer */}
      <div className="bg-bg-secondary/50 border-t border-border-subtle">
        <div className="container mx-auto px-4 md:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-success/10 flex items-center justify-center mx-auto mb-4">
              <LifeBuoy className="h-8 w-8 text-green-success" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Still have questions?</h2>
            <p className="text-text-secondary mb-6">
              Can&apos;t find what you&apos;re looking for? Our support team is ready to help you 24/7.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="bg-green-success hover:bg-green-success/90 text-black">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Live Chat
              </Button>
              <Button variant="outline" className="border-border-subtle hover:border-green-success/50" onClick={() => (window.location.href = 'mailto:support@bitloot.com')}>
                <Mail className="h-4 w-4 mr-2" />
                Email Us
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
