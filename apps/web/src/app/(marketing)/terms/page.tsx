'use client';

import { 
  FileText, 
  Shield, 
  CreditCard, 
  Package, 
  AlertTriangle, 
  Scale, 
  Users, 
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
  Zap,
  Globe,
  Lock,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Separator } from '@/design-system/primitives/separator';

// Last updated date
const LAST_UPDATED = 'January 30, 2026';
const EFFECTIVE_DATE = 'January 30, 2026';

// Table of Contents items
const tableOfContents = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'eligibility', title: '2. Eligibility' },
  { id: 'account', title: '3. Account Registration' },
  { id: 'products', title: '4. Products & Digital Goods' },
  { id: 'orders', title: '5. Orders & Payments' },
  { id: 'crypto-payments', title: '6. Cryptocurrency Payments' },
  { id: 'delivery', title: '7. Delivery & Fulfillment' },
  { id: 'refunds', title: '8. Refunds & Cancellations' },
  { id: 'user-conduct', title: '9. User Conduct' },
  { id: 'intellectual-property', title: '10. Intellectual Property' },
  { id: 'disclaimers', title: '11. Disclaimers & Limitations' },
  { id: 'indemnification', title: '12. Indemnification' },
  { id: 'termination', title: '13. Termination' },
  { id: 'governing-law', title: '14. Governing Law' },
  { id: 'changes', title: '15. Changes to Terms' },
  { id: 'contact', title: '16. Contact Information' },
];

// Section Component
function Section({ 
  id, 
  icon: Icon, 
  title, 
  children 
}: { 
  id: string; 
  icon: React.ElementType; 
  title: string; 
  children: React.ReactNode;
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
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30">
          <Icon className="w-5 h-5 text-cyan-glow" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">{title}</h2>
      </div>
      <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed space-y-4">
        {children}
      </div>
    </motion.section>
  );
}

// Important Notice Box
function ImportantNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-lg bg-orange-warning/10 border border-orange-warning/30">
      <AlertTriangle className="w-5 h-5 text-orange-warning shrink-0 mt-0.5" />
      <div className="text-sm text-orange-warning">{children}</div>
    </div>
  );
}

// Info Box
function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30">
      <Info className="w-5 h-5 text-cyan-glow shrink-0 mt-0.5" />
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
}

export default function TermsOfServicePage(): React.ReactElement {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-b from-bg-secondary/50 to-transparent border-b border-border-subtle">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-cyan-glow/5 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-glow/10 border border-cyan-glow/30 mb-6">
              <FileText className="w-4 h-4 text-cyan-glow" />
              <span className="text-sm text-cyan-glow font-medium">Legal Document</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-4">
              Terms of Service
            </h1>
            
            <p className="text-lg text-text-secondary mb-6">
              Please read these terms carefully before using BitLoot. By accessing or using our platform, 
              you agree to be bound by these terms and conditions.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Last Updated: {LAST_UPDATED}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-success" />
                <span>Effective: {EFFECTIVE_DATE}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
          {/* Table of Contents - Sticky Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="sticky top-24">
              <Card className="bg-bg-secondary/50 border-border-subtle">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-glow" />
                    Table of Contents
                  </h3>
                  <nav className="space-y-1">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block text-sm text-text-secondary hover:text-cyan-glow transition-colors py-1.5 pl-3 border-l-2 border-border-subtle hover:border-cyan-glow"
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </div>
          </motion.aside>

          {/* Content */}
          <div className="space-y-12">
            {/* Introduction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="prose prose-invert max-w-none"
            >
              <p className="text-lg text-text-secondary leading-relaxed">
                Welcome to BitLoot! These Terms of Service (&quot;Terms&quot;) govern your access to and use of the BitLoot 
                website, services, and applications (collectively, the &quot;Platform&quot;). BitLoot is a cryptocurrency-only 
                digital marketplace that provides instant delivery of game keys, software licenses, and 
                digital subscriptions.
              </p>
            </motion.div>

            <Separator className="bg-border-subtle" />

            {/* Section 1: Acceptance of Terms */}
            <Section id="acceptance" icon={CheckCircle2} title="1. Acceptance of Terms">
              <p>
                By accessing, browsing, or using the BitLoot Platform, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms of Service and our <Link href="/privacy" className="text-cyan-glow hover:underline">Privacy Policy</Link>. 
                If you do not agree to these Terms, you must not access or use the Platform.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and BitLoot 
                (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By using our services, you represent that you have the legal capacity to 
                enter into this agreement.
              </p>
              <ImportantNotice>
                By completing a purchase on BitLoot, you explicitly agree to these Terms, including our 
                cryptocurrency payment policies and refund limitations.
              </ImportantNotice>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 2: Eligibility */}
            <Section id="eligibility" icon={Users} title="2. Eligibility">
              <p>To use the BitLoot Platform, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Be at least 18 years of age, or the age of legal majority in your jurisdiction</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using the Platform under applicable laws</li>
                <li>Comply with all applicable local, state, national, and international laws and regulations</li>
              </ul>
              <p>
                If you are using the Platform on behalf of a business or legal entity, you represent that you have 
                the authority to bind that entity to these Terms.
              </p>
              <InfoBox>
                Some products may have additional age restrictions based on content ratings (e.g., PEGI, ESRB). 
                You are responsible for ensuring compliance with such restrictions.
              </InfoBox>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 3: Account Registration */}
            <Section id="account" icon={Lock} title="3. Account Registration">
              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">3.1 Account Creation</h3>
              <p>
                While guest checkout is available, creating an account provides benefits including order history, 
                key re-download access, and faster checkout. When registering, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Verify your email address through our OTP (one-time password) verification system</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update your information if it changes</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">3.2 Account Security</h3>
              <p>
                You are solely responsible for maintaining the confidentiality of your account credentials. 
                You agree to immediately notify us of any unauthorized access to your account. We are not 
                liable for any losses arising from unauthorized use of your account.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">3.3 Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate your account at any time for violations of these Terms, 
                fraudulent activity, or any other reason at our sole discretion. You may request account deletion 
                through your account settings, subject to a 30-day grace period.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 4: Products & Digital Goods */}
            <Section id="products" icon={Package} title="4. Products & Digital Goods">
              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">4.1 Product Descriptions</h3>
              <p>
                BitLoot offers digital products including but not limited to game keys, software licenses, 
                and subscription codes. All products are sourced from authorized distributors 
                and verified suppliers. We strive to provide accurate product descriptions, but we do not 
                warrant that descriptions are error-free.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">4.2 Digital Product Nature</h3>
              <p>
                All products sold on BitLoot are digital goods delivered electronically. By purchasing, you 
                acknowledge that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Products are license keys or activation codes, not physical goods</li>
                <li>Activation may require additional platforms (Steam, Epic, Xbox, etc.)</li>
                <li>Products may have regional restrictions or platform requirements</li>
                <li>System requirements and compatibility should be verified before purchase</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">4.3 Availability & Pricing</h3>
              <p>
                Product availability and pricing are subject to change without notice. Prices are displayed 
                in EUR (Euro) and converted to cryptocurrency at the time of checkout. We reserve the right to 
                limit quantities, discontinue products, or refuse orders at our discretion.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 5: Orders & Payments */}
            <Section id="orders" icon={CreditCard} title="5. Orders & Payments">
              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">5.1 Order Process</h3>
              <p>
                To complete a purchase, you must provide a valid email address (for guest checkout) or 
                log into your account. After selecting products and initiating checkout, you will be 
                provided with cryptocurrency payment instructions.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">5.2 Order Confirmation</h3>
              <p>
                An order is confirmed only after we receive full payment verification on the blockchain. 
                Order confirmation emails will be sent to your provided email address containing order 
                details and delivery instructions.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">5.3 Order Cancellation</h3>
              <p>
                Due to the nature of cryptocurrency transactions and instant digital delivery, orders 
                cannot be cancelled once payment has been initiated. Please verify your order details 
                carefully before completing payment.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 6: Cryptocurrency Payments */}
            <Section id="crypto-payments" icon={Zap} title="6. Cryptocurrency Payments">
              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">6.1 Accepted Cryptocurrencies</h3>
              <p>
                BitLoot accepts over 300 cryptocurrencies including but not limited to Bitcoin (BTC), 
                Ethereum (ETH), USDT, USDC, BNB, SOL, and many others. The full list of supported 
                cryptocurrencies is displayed at checkout.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">6.2 Payment Processing</h3>
              <p>
                Cryptocurrency payments are processed through NOWPayments, a third-party payment processor. 
                Payment is considered complete when the required number of blockchain confirmations is received.
              </p>

              <ImportantNotice>
                <strong>CRITICAL: Underpayment Policy</strong><br />
                If you send less cryptocurrency than the required amount, your payment will be marked as 
                &quot;underpaid&quot; and will NOT be refunded. Always verify the exact amount before sending. 
                Network fees must be accounted for by the sender.
              </ImportantNotice>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">6.3 Exchange Rate & Volatility</h3>
              <p>
                Cryptocurrency exchange rates are determined at the time of checkout and are valid for a 
                limited time (typically 15-30 minutes). If payment is not received within this window, 
                the order may be cancelled and you will need to initiate a new checkout.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">6.4 Wrong Network/Token</h3>
              <p>
                Sending cryptocurrency on the wrong network or sending the wrong token will result in 
                loss of funds. BitLoot is not responsible for funds sent incorrectly. Always verify 
                the network and token before sending.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 7: Delivery & Fulfillment */}
            <Section id="delivery" icon={RefreshCw} title="7. Delivery & Fulfillment">
              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">7.1 Instant Delivery</h3>
              <p>
                Upon successful payment confirmation, your digital product(s) will be delivered instantly. 
                You will receive:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>An email notification with a secure link to reveal your key(s)</li>
                <li>Access to your key(s) through your account dashboard (if registered)</li>
                <li>Time-limited secure download links for your product keys</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">7.2 Key Delivery Security</h3>
              <p>
                Product keys are encrypted and stored securely. Keys are never sent via email in plaintext. 
                Instead, you receive a secure link that allows you to reveal your key(s). These links 
                expire after a short period (typically 15 minutes) for security purposes.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">7.3 Delivery Issues</h3>
              <p>
                If you do not receive your product within a reasonable time after payment confirmation, 
                please contact our support team. We will investigate and resolve the issue promptly.
              </p>

              <InfoBox>
                Registered users can always access and re-reveal their keys through the account dashboard, 
                even after the initial link expires.
              </InfoBox>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 8: Refunds & Cancellations */}
            <Section id="refunds" icon={XCircle} title="8. Refunds & Cancellations">
              <p>
                Due to the instant and irreversible nature of digital product delivery, our refund policy is limited. 
                Please review our complete <Link href="/refunds" className="text-cyan-glow hover:underline">Refund Policy</Link> for 
                detailed information.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">8.1 No General Refunds</h3>
              <p>
                Once a digital product key has been delivered or revealed, the transaction is considered 
                final and non-refundable. This is industry standard for digital goods.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">8.2 Exceptions</h3>
              <p>Refunds may be considered in the following exceptional circumstances:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Duplicate purchases (same product purchased multiple times in error)</li>
                <li>Invalid or non-working keys that cannot be resolved</li>
                <li>Products significantly not as described</li>
                <li>Technical issues on our end preventing delivery</li>
              </ul>

              <ImportantNotice>
                Underpayments, wrong network transfers, and wrong token transfers are NOT eligible for 
                refunds under any circumstances. Please verify all payment details before sending.
              </ImportantNotice>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 9: User Conduct */}
            <Section id="user-conduct" icon={Scale} title="9. User Conduct">
              <p>By using the BitLoot Platform, you agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Use the Platform for fraudulent or illegal purposes</li>
                <li>Attempt to resell products purchased from BitLoot commercially</li>
                <li>Create multiple accounts to abuse promotions or circumvent restrictions</li>
                <li>Use automated systems (bots, scrapers) without authorization</li>
                <li>Interfere with or disrupt the Platform&apos;s security or functionality</li>
                <li>Harass, abuse, or harm other users or our staff</li>
                <li>Submit false or misleading information</li>
                <li>Attempt to reverse engineer or hack our systems</li>
                <li>Use VPNs or proxies to circumvent regional restrictions</li>
              </ul>
              <p>
                Violation of these conduct rules may result in immediate account termination and 
                potential legal action.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 10: Intellectual Property */}
            <Section id="intellectual-property" icon={Shield} title="10. Intellectual Property">
              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">10.1 BitLoot Property</h3>
              <p>
                The BitLoot name, logo, website design, and all related trademarks, service marks, 
                and trade dress are the property of BitLoot. You may not use our intellectual 
                property without prior written consent.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">10.2 Third-Party Content</h3>
              <p>
                Product names, logos, and brands displayed on the Platform are trademarks of their 
                respective owners. BitLoot is not affiliated with game publishers or software 
                developers unless explicitly stated.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">10.3 User Content</h3>
              <p>
                By submitting reviews, feedback, or other content, you grant BitLoot a non-exclusive, 
                royalty-free license to use, display, and distribute such content on the Platform.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 11: Disclaimers & Limitations */}
            <Section id="disclaimers" icon={AlertTriangle} title="11. Disclaimers & Limitations">
              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">11.1 &quot;As Is&quot; Basis</h3>
              <p>
                THE PLATFORM AND ALL PRODUCTS ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT 
                WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND 
                NON-INFRINGEMENT.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">11.2 Limitation of Liability</h3>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, BITLOOT SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO 
                LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE OF THE PLATFORM.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">11.3 Maximum Liability</h3>
              <p>
                In no event shall BitLoot&apos;s total liability exceed the amount you paid for the 
                specific product or service giving rise to the claim.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">11.4 Third-Party Services</h3>
              <p>
                We are not responsible for the actions, content, or policies of third-party services, 
                including payment processors, game platforms, or software publishers.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 12: Indemnification */}
            <Section id="indemnification" icon={Shield} title="12. Indemnification">
              <p>
                You agree to indemnify, defend, and hold harmless BitLoot, its officers, directors, 
                employees, agents, and affiliates from and against any claims, liabilities, damages, 
                losses, and expenses (including reasonable attorney&apos;s fees) arising out of or in any 
                way connected with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your access to or use of the Platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Your violation of any applicable laws or regulations</li>
                <li>Any content you submit to the Platform</li>
              </ul>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 13: Termination */}
            <Section id="termination" icon={XCircle} title="13. Termination">
              <p>
                We may terminate or suspend your access to the Platform immediately, without prior 
                notice or liability, for any reason, including breach of these Terms. Upon termination:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your right to use the Platform ceases immediately</li>
                <li>Previously purchased and delivered products remain yours to keep</li>
                <li>Pending orders may be cancelled and refunded at our discretion</li>
                <li>Account data may be retained as required by law</li>
              </ul>
              <p>
                All provisions of these Terms which by their nature should survive termination shall 
                survive, including ownership provisions, warranty disclaimers, and limitations of liability.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 14: Governing Law */}
            <Section id="governing-law" icon={Globe} title="14. Governing Law">
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the 
                jurisdiction in which BitLoot operates, without regard to conflict of law principles.
              </p>
              <p>
                Any disputes arising from or relating to these Terms or your use of the Platform shall 
                be resolved through binding arbitration or in the courts of competent jurisdiction, 
                as determined by BitLoot.
              </p>
              <p>
                You agree that regardless of any statute or law to the contrary, any claim or cause 
                of action arising out of or related to use of the Platform or these Terms must be 
                filed within one (1) month after such claim or cause of action arose.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 15: Changes to Terms */}
            <Section id="changes" icon={RefreshCw} title="15. Changes to Terms">
              <p>
                BitLoot reserves the right to modify these Terms at any time. We will notify users of 
                material changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Posting the updated Terms on the Platform with a new &quot;Last Updated&quot; date</li>
                <li>Sending email notification to registered users (for significant changes)</li>
                <li>Displaying a prominent notice on the Platform</li>
              </ul>
              <p>
                Your continued use of the Platform after changes become effective constitutes your 
                acceptance of the revised Terms. We encourage you to review the Terms periodically.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 16: Contact Information */}
            <Section id="contact" icon={Mail} title="16. Contact Information">
              <p>
                If you have any questions, concerns, or feedback regarding these Terms of Service, 
                please contact us:
              </p>
              <Card className="bg-bg-secondary/50 border-border-subtle mt-4">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-cyan-glow" />
                      <span className="text-text-primary">support@bitloot.io</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-cyan-glow" />
                      <Link href="/contact" className="text-cyan-glow hover:underline">
                        Contact Form
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <p className="mt-4">
                We aim to respond to all inquiries within 24-48 hours during business days.
              </p>
            </Section>

            {/* Final Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-12 p-6 rounded-xl bg-linear-to-r from-cyan-glow/10 via-purple-neon/10 to-cyan-glow/10 border border-cyan-glow/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-glow/20 border border-cyan-glow/30 shrink-0">
                  <Zap className="w-6 h-6 text-cyan-glow" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Thank You for Using BitLoot
                  </h3>
                  <p className="text-text-secondary">
                    We appreciate your trust in our platform. By following these Terms, you help us 
                    maintain a safe and reliable marketplace for everyone. If you have any questions, 
                    our support team is always here to help.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Related Links */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link 
                href="/privacy" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/50 transition-all"
              >
                <Shield className="w-4 h-4" />
                Privacy Policy
              </Link>
              <Link 
                href="/refunds" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/50 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Refund Policy
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/50 transition-all"
              >
                <Mail className="w-4 h-4" />
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
