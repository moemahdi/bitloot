'use client';

import { 
  Shield, 
  Eye, 
  Database, 
  Lock, 
  Globe, 
  Cookie,
  Mail,
  Clock,
  CheckCircle2,
  Info,
  UserCheck,
  Server,
  FileText,
  Settings,
  Users,
  AlertTriangle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Separator } from '@/design-system/primitives/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/design-system/primitives/table';

// Last updated date
const LAST_UPDATED = 'January 30, 2026';
const EFFECTIVE_DATE = 'January 30, 2026';

// Table of Contents items
const tableOfContents = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information-collected', title: '2. Information We Collect' },
  { id: 'how-we-use', title: '3. How We Use Your Information' },
  { id: 'legal-basis', title: '4. Legal Basis for Processing' },
  { id: 'information-sharing', title: '5. Information Sharing' },
  { id: 'data-retention', title: '6. Data Retention' },
  { id: 'data-security', title: '7. Data Security' },
  { id: 'your-rights', title: '8. Your Rights' },
  { id: 'cookies', title: '9. Cookies & Tracking' },
  { id: 'third-party', title: '10. Third-Party Services' },
  { id: 'international', title: '11. International Transfers' },
  { id: 'children', title: '12. Children\'s Privacy' },
  { id: 'changes', title: '13. Changes to This Policy' },
  { id: 'contact', title: '14. Contact Information' },
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
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-neon/10 border border-purple-neon/30">
          <Icon className="w-5 h-5 text-purple-neon" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">{title}</h2>
      </div>
      <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed space-y-4">
        {children}
      </div>
    </motion.section>
  );
}

// Info Box
function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-3 p-4 rounded-lg bg-purple-neon/10 border border-purple-neon/30">
      <Info className="w-5 h-5 text-purple-neon shrink-0 mt-0.5" />
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
}

// Privacy Highlight Box
function PrivacyHighlight({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-green-success/10 border border-green-success/30">
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="w-4 h-4 text-green-success" />
        <span className="font-medium text-green-success">{title}</span>
      </div>
      <div className="text-sm text-text-secondary">{children}</div>
    </div>
  );
}

export default function PrivacyPolicyPage(): React.ReactElement {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-b from-bg-secondary/50 to-transparent border-b border-border-subtle">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-purple-neon/5 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-neon/10 border border-purple-neon/30 mb-6">
              <Shield className="w-4 h-4 text-purple-neon" />
              <span className="text-sm text-purple-neon font-medium">Privacy & Data Protection</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-4">
              Privacy Policy
            </h1>
            
            <p className="text-lg text-text-secondary mb-6">
              Your privacy is important to us. This policy explains how BitLoot collects, uses, 
              protects, and shares your personal information when you use our platform.
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
                    <FileText className="w-4 h-4 text-purple-neon" />
                    Table of Contents
                  </h3>
                  <nav className="space-y-1">
                    {tableOfContents.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block text-sm text-text-secondary hover:text-purple-neon transition-colors py-1.5 pl-3 border-l-2 border-border-subtle hover:border-purple-neon"
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
            {/* Privacy Commitment Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid sm:grid-cols-3 gap-4"
            >
              <PrivacyHighlight title="Minimal Data Collection">
                We only collect data necessary for providing our services.
              </PrivacyHighlight>
              <PrivacyHighlight title="No Data Selling">
                We never sell your personal information to third parties.
              </PrivacyHighlight>
              <PrivacyHighlight title="Encrypted Storage">
                All sensitive data is encrypted at rest and in transit.
              </PrivacyHighlight>
            </motion.div>

            <Separator className="bg-border-subtle" />

            {/* Section 1: Introduction */}
            <Section id="introduction" icon={Eye} title="1. Introduction">
              <p>
                BitLoot (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy and personal data. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
                you use our cryptocurrency-powered digital marketplace platform (the &quot;Platform&quot;).
              </p>
              <p>
                By accessing or using BitLoot, you agree to the collection and use of information in accordance 
                with this policy. If you do not agree with our policies and practices, please do not use our Platform.
              </p>
              <InfoBox>
                This Privacy Policy applies to all users of BitLoot, including visitors, guests who make purchases 
                without an account, and registered account holders.
              </InfoBox>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 2: Information We Collect */}
            <Section id="information-collected" icon={Database} title="2. Information We Collect">
              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">2.1 Information You Provide</h3>
              <p>We collect information you voluntarily provide when using our Platform:</p>
              
              <div className="overflow-x-auto mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-text-primary">Data Type</TableHead>
                      <TableHead className="text-text-primary">Examples</TableHead>
                      <TableHead className="text-text-primary">Purpose</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Account Information</TableCell>
                      <TableCell>Email address, password (hashed)</TableCell>
                      <TableCell>Account creation, authentication, order management</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Transaction Data</TableCell>
                      <TableCell>Purchase history, order details, cryptocurrency wallet addresses</TableCell>
                      <TableCell>Order processing, payment verification, delivery</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Communication Data</TableCell>
                      <TableCell>Support inquiries, chat messages, feedback</TableCell>
                      <TableCell>Customer support, service improvement</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">User Content</TableCell>
                      <TableCell>Reviews, ratings, comments</TableCell>
                      <TableCell>Community features, product feedback</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">2.2 Information Collected Automatically</h3>
              <p>When you access our Platform, we automatically collect certain information:</p>
              
              <div className="overflow-x-auto mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-text-primary">Data Type</TableHead>
                      <TableHead className="text-text-primary">Examples</TableHead>
                      <TableHead className="text-text-primary">Purpose</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Device Information</TableCell>
                      <TableCell>Browser type, operating system, device type</TableCell>
                      <TableCell>Platform optimization, security</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">IP Address</TableCell>
                      <TableCell>IP address, approximate location</TableCell>
                      <TableCell>Fraud prevention, security, compliance</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Session Data</TableCell>
                      <TableCell>Login sessions, device fingerprint</TableCell>
                      <TableCell>Security, session management</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">2.3 Information We Do NOT Collect</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Full cryptocurrency wallet private keys</li>
                <li>Government-issued ID numbers (unless required by law)</li>
                <li>Biometric data</li>
                <li>Information from minors under 18</li>
              </ul>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 3: How We Use Your Information */}
            <Section id="how-we-use" icon={Settings} title="3. How We Use Your Information">
              <p>We use the collected information for the following purposes:</p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">3.1 Essential Services</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Processing and fulfilling your orders</li>
                <li>Verifying cryptocurrency payments</li>
                <li>Delivering digital products and keys securely</li>
                <li>Managing your account and preferences</li>
                <li>Sending order confirmations and delivery notifications</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">3.2 Security & Fraud Prevention</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Detecting and preventing fraudulent transactions</li>
                <li>Protecting against unauthorized access</li>
                <li>Monitoring for security threats</li>
                <li>Enforcing our Terms of Service</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">3.3 Communication</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Responding to your support requests</li>
                <li>Sending important service updates</li>
                <li>Providing promotional content (with your consent)</li>
                <li>Notifying you of changes to our policies</li>
              </ul>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">3.4 Improvement & Analytics</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Analyzing usage patterns to improve our Platform</li>
                <li>Developing new features and services</li>
                <li>Conducting research and analytics</li>
                <li>Personalizing your experience</li>
              </ul>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 4: Legal Basis for Processing */}
            <Section id="legal-basis" icon={FileText} title="4. Legal Basis for Processing">
              <p>We process your personal data based on the following legal grounds:</p>

              <div className="space-y-4 mt-4">
                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Contract Performance</h4>
                    <p className="text-sm text-text-secondary">
                      Processing necessary to fulfill our contract with you (e.g., processing orders, 
                      delivering products, managing your account).
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Legitimate Interests</h4>
                    <p className="text-sm text-text-secondary">
                      Processing for our legitimate business interests (e.g., fraud prevention, 
                      security, analytics) where those interests don&apos;t override your rights.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Consent</h4>
                    <p className="text-sm text-text-secondary">
                      Where you&apos;ve given explicit consent (e.g., marketing communications, 
                      newsletter subscriptions).
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Legal Compliance</h4>
                    <p className="text-sm text-text-secondary">
                      Processing required to comply with legal obligations (e.g., tax records, 
                      responding to legal requests).
                    </p>
                  </CardContent>
                </Card>
              </div>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 5: Information Sharing */}
            <Section id="information-sharing" icon={Users} title="5. Information Sharing">
              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">5.1 Service Providers</h3>
              <p>
                We work with trusted third-party service providers to operate our platform. These providers 
                only receive the minimum data necessary to perform their specific functions:
              </p>
              
              <div className="overflow-x-auto mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-text-primary">Service Category</TableHead>
                      <TableHead className="text-text-primary">Purpose</TableHead>
                      <TableHead className="text-text-primary">Data Shared</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Payment Processing</TableCell>
                      <TableCell>Cryptocurrency payment verification</TableCell>
                      <TableCell>Order amount, payment status</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Email Delivery</TableCell>
                      <TableCell>Transactional communications</TableCell>
                      <TableCell>Email address, order info</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Cloud Infrastructure</TableCell>
                      <TableCell>Secure data storage & delivery</TableCell>
                      <TableCell>Encrypted data only</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <InfoBox>
                All service providers are contractually bound to protect your data and use it only 
                for the specific purposes for which it was shared.
              </InfoBox>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">5.2 We Do NOT Sell Your Data</h3>
              <PrivacyHighlight title="No Data Sales - Ever">
                BitLoot does not and will never sell, rent, or trade your personal information to 
                third parties for marketing purposes.
              </PrivacyHighlight>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">5.3 Legal Disclosures</h3>
              <p>We may disclose your information if required to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Comply with applicable laws, regulations, or legal processes</li>
                <li>Respond to lawful requests from public authorities</li>
                <li>Protect our rights, privacy, safety, or property</li>
                <li>Investigate potential violations of our Terms of Service</li>
              </ul>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 6: Data Retention */}
            <Section id="data-retention" icon={Clock} title="6. Data Retention">
              <p>
                We retain your personal data only for as long as necessary to fulfill the purposes for which 
                it was collected, or as required by law. When you delete your account, your personal data is 
                permanently removed after a <strong>30-day grace period</strong> to allow for account recovery 
                if the deletion was accidental.
              </p>
              
              <InfoBox>
                After the 30-day grace period, your data is securely deleted and cannot be recovered. 
                Order records may be retained in anonymized form for legal compliance purposes.
              </InfoBox>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 7: Data Security */}
            <Section id="data-security" icon={Lock} title="7. Data Security">
              <p>We implement comprehensive security measures to protect your personal information:</p>

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-green-success" />
                      <span className="font-medium text-text-primary">Encryption</span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      AES-256-GCM encryption for sensitive data at rest; TLS 1.3 for data in transit.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-green-success" />
                      <span className="font-medium text-text-primary">Access Control</span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      Role-based access control; minimal privilege principle for staff access.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-4 h-4 text-green-success" />
                      <span className="font-medium text-text-primary">Infrastructure</span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      Secure cloud infrastructure with DDoS protection, WAF, and regular security audits.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="w-4 h-4 text-green-success" />
                      <span className="font-medium text-text-primary">Authentication</span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      OTP-based email verification; secure password hashing with bcrypt.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex gap-3 p-4 rounded-lg bg-orange-warning/10 border border-orange-warning/30">
                <AlertTriangle className="w-5 h-5 text-orange-warning shrink-0 mt-0.5" />
                <div className="text-sm text-text-secondary">
                  <strong className="text-orange-warning">Important:</strong> While we implement robust security 
                  measures, no method of transmission over the Internet or electronic storage is 100% secure. 
                  We cannot guarantee absolute security.
                </div>
              </div>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 8: Your Rights */}
            <Section id="your-rights" icon={UserCheck} title="8. Your Rights">
              <p>Depending on your location, you may have the following rights regarding your personal data:</p>

              <div className="space-y-4 mt-4">
                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Right to Access</h4>
                    <p className="text-sm text-text-secondary">
                      Request a copy of the personal data we hold about you.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Right to Rectification</h4>
                    <p className="text-sm text-text-secondary">
                      Request correction of inaccurate or incomplete data.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Right to Erasure</h4>
                    <p className="text-sm text-text-secondary">
                      Request deletion of your personal data (with certain exceptions for legal compliance).
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Right to Data Portability</h4>
                    <p className="text-sm text-text-secondary">
                      Receive your data in a structured, commonly used format.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Right to Object</h4>
                    <p className="text-sm text-text-secondary">
                      Object to processing based on legitimate interests or for direct marketing.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Right to Withdraw Consent</h4>
                    <p className="text-sm text-text-secondary">
                      Withdraw consent at any time for consent-based processing.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <p className="mt-4">
                To exercise any of these rights, please contact us at{' '}
                <Link href="mailto:privacy@bitloot.io" className="text-purple-neon hover:underline">
                  privacy@bitloot.io
                </Link>. We will respond within 30 days.
              </p>

              <InfoBox>
                For account-related actions, you can manage many settings directly through your account 
                dashboard, including downloading your data or requesting account deletion.
              </InfoBox>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 9: Cookies & Tracking */}
            <Section id="cookies" icon={Cookie} title="9. Cookies & Tracking">
              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">9.1 What Are Cookies</h3>
              <p>
                Cookies are small text files placed on your device when you visit our Platform. They help 
                us provide a better user experience and understand how you interact with our services.
              </p>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">9.2 Types of Cookies We Use</h3>
              <p>
                BitLoot uses only <strong>essential cookies</strong> that are required for our platform to function. 
                These cookies enable core functionality like authentication, security, and cart management.
              </p>
              
              <div className="overflow-x-auto mt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-text-primary">Cookie Type</TableHead>
                      <TableHead className="text-text-primary">Purpose</TableHead>
                      <TableHead className="text-text-primary">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Essential</TableCell>
                      <TableCell>Authentication (JWT access/refresh tokens), security</TableCell>
                      <TableCell>Session - 7 days</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <PrivacyHighlight title="No Tracking Cookies">
                We do not use analytics, advertising, or third-party tracking cookies. Your browsing 
                activity on BitLoot is not tracked or shared with advertisers.
              </PrivacyHighlight>

              <h3 className="text-lg font-semibold text-text-primary mt-6 mb-3">9.3 Managing Cookies</h3>
              <p>
                You can control cookies through your browser settings. Note that disabling essential 
                cookies may affect the functionality of our Platform.
              </p>

              <InfoBox>
                Since we only use essential cookies required for site functionality, no cookie 
                consent banner is needed. You can manage cookies through your browser settings.
              </InfoBox>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 10: Third-Party Services */}
            <Section id="third-party" icon={ExternalLink} title="10. Third-Party Services">
              <p>
                To operate our Platform effectively, we work with trusted third-party service providers 
                in the following categories:
              </p>

              <div className="space-y-4 mt-4">
                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Payment Processing</h4>
                    <p className="text-sm text-text-secondary">
                      We use secure cryptocurrency payment processors to handle transactions. These 
                      providers may collect payment-related data (wallet addresses, transaction amounts) 
                      in accordance with their own privacy policies.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Infrastructure & Security</h4>
                    <p className="text-sm text-text-secondary">
                      We use industry-leading cloud infrastructure and security services to protect 
                      our platform and your data. These services may process technical data (IP addresses, 
                      request headers) for security and performance purposes.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-bg-secondary/50 border-border-subtle">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-text-primary mb-2">Email Communications</h4>
                    <p className="text-sm text-text-secondary">
                      We use secure email delivery services to send transactional emails (order confirmations, 
                      key delivery, account notifications). These services process email addresses and 
                      message content to deliver communications.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <InfoBox>
                We carefully vet all service providers and require them to maintain appropriate 
                security measures and data protection standards. All providers are bound by 
                contractual obligations to protect your data.
              </InfoBox>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 11: International Transfers */}
            <Section id="international" icon={Globe} title="11. International Data Transfers">
              <p>
                BitLoot operates globally, and your data may be processed in countries other than your 
                country of residence. When we transfer data internationally, we ensure appropriate 
                safeguards are in place:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Standard Contractual Clauses (SCCs) approved by relevant authorities</li>
                <li>Data processing agreements with all service providers</li>
                <li>Encryption of data in transit and at rest</li>
                <li>Compliance with applicable data protection laws</li>
              </ul>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 12: Children's Privacy */}
            <Section id="children" icon={Users} title="12. Children's Privacy">
              <p>
                BitLoot is not intended for use by individuals under 18 years of age. We do not 
                knowingly collect personal information from children. If you believe we have 
                inadvertently collected data from a minor, please contact us immediately at{' '}
                <Link href="mailto:privacy@bitloot.io" className="text-purple-neon hover:underline">
                  privacy@bitloot.io
                </Link>, and we will promptly delete such information.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 13: Changes to This Policy */}
            <Section id="changes" icon={FileText} title="13. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material 
                changes by:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Posting the updated policy with a new &quot;Last Updated&quot; date</li>
                <li>Sending email notification to registered users (for significant changes)</li>
                <li>Displaying a prominent notice on the Platform</li>
              </ul>
              <p>
                We encourage you to review this Privacy Policy periodically. Your continued use of 
                the Platform after changes constitutes acceptance of the updated policy.
              </p>
            </Section>

            <Separator className="bg-border-subtle" />

            {/* Section 14: Contact Information */}
            <Section id="contact" icon={Mail} title="14. Contact Information">
              <p>
                If you have questions, concerns, or requests regarding this Privacy Policy or our 
                data practices, please contact us:
              </p>
              <Card className="bg-bg-secondary/50 border-border-subtle mt-4">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-purple-neon" />
                      <span className="text-text-primary">privacy@bitloot.io</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-purple-neon" />
                      <Link href="/contact" className="text-purple-neon hover:underline">
                        Contact Form
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <p className="mt-4">
                We aim to respond to all privacy-related inquiries within 30 days. For urgent matters, 
                please indicate this in your subject line.
              </p>
            </Section>

            {/* Final Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-12 p-6 rounded-xl bg-linear-to-r from-purple-neon/10 via-cyan-glow/10 to-purple-neon/10 border border-purple-neon/30"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-neon/20 border border-purple-neon/30 shrink-0">
                  <Shield className="w-6 h-6 text-purple-neon" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Your Privacy Matters
                  </h3>
                  <p className="text-text-secondary">
                    At BitLoot, we believe in transparency and respect for your personal data. 
                    We&apos;re committed to protecting your privacy while providing the best possible 
                    digital marketplace experience. If you have any concerns, don&apos;t hesitate to reach out.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Related Links */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link 
                href="/terms" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-text-secondary hover:text-purple-neon hover:border-purple-neon/50 transition-all"
              >
                <FileText className="w-4 h-4" />
                Terms of Service
              </Link>
              <Link 
                href="/refunds" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-text-secondary hover:text-purple-neon hover:border-purple-neon/50 transition-all"
              >
                <Zap className="w-4 h-4" />
                Refund Policy
              </Link>
              <Link 
                href="/contact" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-text-secondary hover:text-purple-neon hover:border-purple-neon/50 transition-all"
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
