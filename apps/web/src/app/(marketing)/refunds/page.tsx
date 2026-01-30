'use client';

import { 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  HelpCircle,
  MessageCircle,
  CreditCard,
  Package,
  Shield,
  Info,
  Zap,
  Globe,
  FileText,
  ArrowRight,
  AlertCircle,
  Ban,
  CircleDollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/design-system/primitives/card';
import { Separator } from '@/design-system/primitives/separator';
import { Button } from '@/design-system/primitives/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/design-system/primitives/accordion';

// Last updated date
const LAST_UPDATED = 'January 30, 2026';
const EFFECTIVE_DATE = 'January 30, 2026';

// Section Component
function Section({ 
  id, 
  icon: Icon, 
  title, 
  children,
  iconColor = 'text-orange-warning',
  bgColor = 'bg-orange-warning/10',
  borderColor = 'border-orange-warning/30',
}: { 
  id: string; 
  icon: React.ElementType; 
  title: string; 
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
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${bgColor} ${borderColor} border`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-text-primary">{title}</h2>
      </div>
      <div className="prose prose-invert max-w-none text-text-secondary leading-relaxed space-y-4">
        {children}
      </div>
    </motion.section>
  );
}

// Critical Warning Box
function CriticalWarning({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-xl bg-linear-to-r from-orange-warning/20 via-orange-warning/10 to-orange-warning/20 border-2 border-orange-warning/50">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-warning/20 border border-orange-warning/50 shrink-0">
          <AlertTriangle className="w-5 h-5 text-orange-warning" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-orange-warning mb-2">{title}</h3>
          <div className="text-sm text-text-secondary">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Eligible/Not Eligible Card
function RefundStatusCard({ 
  type, 
  title, 
  items 
}: { 
  type: 'eligible' | 'not-eligible'; 
  title: string; 
  items: string[];
}) {
  const isEligible = type === 'eligible';
  
  return (
    <Card className={`${isEligible ? 'bg-green-success/5 border-green-success/30' : 'bg-orange-warning/5 border-orange-warning/30'}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          {isEligible ? (
            <CheckCircle2 className="w-6 h-6 text-green-success" />
          ) : (
            <XCircle className="w-6 h-6 text-orange-warning" />
          )}
          <h3 className={`text-lg font-semibold ${isEligible ? 'text-green-success' : 'text-orange-warning'}`}>
            {title}
          </h3>
        </div>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                isEligible ? 'bg-green-success/20' : 'bg-orange-warning/20'
              }`}>
                {isEligible ? (
                  <CheckCircle2 className="w-3 h-3 text-green-success" />
                ) : (
                  <Ban className="w-3 h-3 text-orange-warning" />
                )}
              </div>
              <span className="text-sm text-text-secondary">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

// Step Card
function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-glow/20 border border-cyan-glow/50 shrink-0 font-bold text-cyan-glow">
        {step}
      </div>
      <div>
        <h4 className="font-semibold text-text-primary mb-1">{title}</h4>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
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

// FAQ Data
const faqs = [
  {
    question: 'Why can\'t I get a refund for my purchase?',
    answer: 'Digital products like game keys and software licenses are delivered instantly upon payment. Once a key is revealed or delivered, it cannot be "returned" like a physical product. This is an industry-standard policy to prevent abuse and protect both buyers and sellers.',
  },
  {
    question: 'My key doesn\'t work. What should I do?',
    answer: 'First, verify you\'re redeeming on the correct platform (Steam, Epic, Xbox, etc.) and in the correct region. Check for typos when entering the key. If it still doesn\'t work, contact our support team with your order ID and screenshots of any error messages. We\'ll investigate and provide a replacement or refund if the key was invalid.',
  },
  {
    question: 'I accidentally bought the wrong product. Can I exchange it?',
    answer: 'Unfortunately, we cannot exchange or replace products purchased by mistake, even if the key has not been revealed. Once a purchase is made, the order is processed and keys are reserved. Please carefully review your cart and product details before completing checkout to avoid purchasing the wrong item.',
  },
  {
    question: 'How long does a refund take to process?',
    answer: 'For eligible refunds, we aim to process them within 3-7 business days. Cryptocurrency refunds are sent to the same wallet address used for the original payment. Processing time may vary based on blockchain network conditions.',
  },
  {
    question: 'I sent the wrong cryptocurrency. Can I get a refund?',
    answer: 'Unfortunately, sending the wrong cryptocurrency or using the wrong network results in lost funds. BitLoot cannot recover these funds as they are not received in our payment system. Always double-check the payment details, including the correct network and token, before sending.',
  },
  {
    question: 'What happens if I underpay for my order?',
    answer: 'If you send less cryptocurrency than required, your payment is marked as "underpaid" and the order fails. These funds are non-refundable. Network fees must be accounted for by the sender. We recommend adding a small buffer to ensure full payment is received.',
  },
  {
    question: 'Can I dispute a charge with my crypto provider?',
    answer: 'Cryptocurrency transactions are irreversible by design. There is no "chargeback" mechanism like with credit cards. This is why we encourage buyers to verify all details before making a purchase. For legitimate issues, always contact our support team first.',
  },
  {
    question: 'The game was cheaper elsewhere. Can I get a price match refund?',
    answer: 'We do not offer price matching or partial refunds based on price differences. Prices on BitLoot may change due to sales, promotions, or market conditions. The price at checkout is the final price.',
  },
];

export default function RefundPolicyPage(): React.ReactElement {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-b from-bg-secondary/50 to-transparent border-b border-border-subtle">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-orange-warning/5 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-warning/10 border border-orange-warning/30 mb-6">
              <RotateCcw className="w-4 h-4 text-orange-warning" />
              <span className="text-sm text-orange-warning font-medium">Returns & Refunds</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-text-primary mb-4">
              Refund Policy
            </h1>
            
            <p className="text-lg text-text-secondary mb-6">
              Understand our refund policy for digital products purchased through BitLoot. 
              Please read carefully before making a purchase.
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

      {/* Quick Summary Banner */}
      <div className="bg-bg-secondary/30 border-b border-border-subtle">
        <div className="container mx-auto px-4 md:px-6 py-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6 text-center"
          >
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-cyan-glow" />
              <span className="text-text-secondary">Digital products are <strong className="text-text-primary">non-refundable</strong> once delivered</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-border-subtle" />
            <div className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-orange-warning" />
              <span className="text-text-secondary">Underpayments are <strong className="text-orange-warning">not eligible</strong> for refunds</span>
            </div>
            <div className="hidden md:block w-px h-6 bg-border-subtle" />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-success" />
              <span className="text-text-secondary">Invalid keys may qualify for <strong className="text-green-success">replacement</strong></span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Critical Warning Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <CriticalWarning title="Important: Please Read Before Purchasing">
              <p className="mb-3">
                BitLoot sells <strong>digital products</strong> (game keys, software licenses, gift cards, 
                subscriptions) that are delivered <strong>instantly</strong> upon payment confirmation. Due to the 
                nature of digital goods:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>All sales are generally <strong>final and non-refundable</strong></li>
                <li>Keys cannot be &quot;returned&quot; once revealed or delivered</li>
                <li>Cryptocurrency underpayments are <strong>never refundable</strong></li>
                <li>Wrong network/token transfers cannot be recovered</li>
              </ul>
            </CriticalWarning>
          </motion.div>

          <Separator className="bg-border-subtle" />

          {/* Why Digital Products Are Non-Refundable */}
          <Section 
            id="why-non-refundable" 
            icon={Package} 
            title="Why Digital Products Are Non-Refundable"
            iconColor="text-cyan-glow"
            bgColor="bg-cyan-glow/10"
            borderColor="border-cyan-glow/30"
          >
            <p>
              Unlike physical goods, digital products cannot be &quot;returned&quot; in any meaningful way. 
              Once a product key or license code is revealed, it becomes linked to the buyer&apos;s account 
              or system. Here&apos;s why this matters:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Instant Delivery:</strong> Keys are delivered immediately upon payment, leaving no 
                window for cancellation.
              </li>
              <li>
                <strong>One-Time Use:</strong> Most digital keys can only be redeemed once. Once used, 
                they have no resale value.
              </li>
              <li>
                <strong>Fraud Prevention:</strong> Offering refunds on revealed keys would enable abuse 
                where buyers could claim and keep the key while also receiving a refund.
              </li>
              <li>
                <strong>Industry Standard:</strong> This policy aligns with major platforms like Steam, 
                Epic Games, PlayStation Store, and Xbox Marketplace for digital goods.
              </li>
            </ul>
          </Section>

          <Separator className="bg-border-subtle" />

          {/* Eligibility Comparison */}
          <Section 
            id="eligibility" 
            icon={HelpCircle} 
            title="Refund Eligibility"
            iconColor="text-purple-neon"
            bgColor="bg-purple-neon/10"
            borderColor="border-purple-neon/30"
          >
            <p>
              While our general policy is non-refundable, we do consider refunds or replacements 
              in specific exceptional circumstances:
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <RefundStatusCard
                type="eligible"
                title="May Qualify for Refund/Replacement"
                items={[
                  'Invalid or non-working key (verified as not previously redeemed)',
                  'Duplicate purchase (same product bought twice in error)',
                  'Product significantly different from description',
                  'Technical failure on our end preventing delivery',
                  'Order processing error by BitLoot',
                  'Key already redeemed before delivery (rare)',
                ]}
              />
              <RefundStatusCard
                type="not-eligible"
                title="NOT Eligible for Refund"
                items={[
                  'Change of mind after purchase',
                  'Key already revealed or redeemed by buyer',
                  'Underpayment (sent less crypto than required)',
                  'Wrong cryptocurrency or network used',
                  'Price drops after purchase',
                  'Compatibility issues with buyer\'s system',
                  'Regional restrictions (buyer\'s responsibility)',
                  'Disputes after key has been redeemed',
                ]}
              />
            </div>
          </Section>

          <Separator className="bg-border-subtle" />

          {/* Cryptocurrency Payment Issues */}
          <Section 
            id="crypto-issues" 
            icon={CircleDollarSign} 
            title="Cryptocurrency Payment Issues"
            iconColor="text-orange-warning"
            bgColor="bg-orange-warning/10"
            borderColor="border-orange-warning/30"
          >
            <p>
              Cryptocurrency transactions are irreversible by nature. The following situations are 
              <strong className="text-orange-warning"> NOT eligible for refunds</strong>:
            </p>

            <div className="space-y-4 mt-4">
              <Card className="bg-orange-warning/5 border-orange-warning/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-text-primary">Underpayments</h4>
                      <p className="text-sm text-text-secondary mt-1">
                        If you send less cryptocurrency than required, the order will fail and the funds 
                        are non-refundable. Always account for network fees and send the exact amount shown.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-warning/5 border-orange-warning/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-text-primary">Wrong Network</h4>
                      <p className="text-sm text-text-secondary mt-1">
                        Sending cryptocurrency on the wrong blockchain network (e.g., sending ETH on BSC 
                        instead of Ethereum mainnet) results in permanent loss of funds.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-warning/5 border-orange-warning/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-text-primary">Wrong Token</h4>
                      <p className="text-sm text-text-secondary mt-1">
                        Sending a different cryptocurrency than specified (e.g., sending USDC when USDT 
                        was required) cannot be recovered.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-warning/5 border-orange-warning/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-warning shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-text-primary">Expired Payment Window</h4>
                      <p className="text-sm text-text-secondary mt-1">
                        Payment windows typically expire after 15-30 minutes. Payments sent after expiration 
                        may not be automatically applied to your order.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <InfoBox>
              <strong>Pro Tip:</strong> Always double-check the payment address, network, and amount before 
              sending. Copy-paste addresses to avoid typos, and verify the first and last few characters match.
            </InfoBox>
          </Section>

          <Separator className="bg-border-subtle" />

          {/* How to Request a Refund */}
          <Section 
            id="how-to-request" 
            icon={MessageCircle} 
            title="How to Request a Refund"
            iconColor="text-green-success"
            bgColor="bg-green-success/10"
            borderColor="border-green-success/30"
          >
            <p>
              If you believe you have a valid reason for a refund or replacement, please follow these steps:
            </p>

            <div className="space-y-6 mt-6">
              <StepCard 
                step={1} 
                title="Gather Your Information"
                description="Collect your order ID, email address used for purchase, transaction hash (if applicable), and any screenshots of errors or issues."
              />
              <StepCard 
                step={2} 
                title="Contact Support"
                description="Reach out to our support team through live chat, email (support@bitloot.com), or the contact form. Include all relevant details."
              />
              <StepCard 
                step={3} 
                title="Provide Evidence"
                description="For invalid keys, provide screenshots showing the error message. For other issues, include any relevant documentation."
              />
              <StepCard 
                step={4} 
                title="Wait for Review"
                description="Our team will investigate your request within 1-3 business days. We may contact you for additional information."
              />
              <StepCard 
                step={5} 
                title="Resolution"
                description="If approved, refunds are processed within 3-7 business days. Cryptocurrency refunds are sent to your original payment address."
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/contact">
                <Button className="gap-2">
                  <Mail className="w-4 h-4" />
                  Contact Support
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/order-lookup">
                <Button variant="outline" className="gap-2">
                  <Package className="w-4 h-4" />
                  Track Order
                </Button>
              </Link>
            </div>
          </Section>

          <Separator className="bg-border-subtle" />

          {/* Processing Time */}
          <Section 
            id="processing-time" 
            icon={Clock} 
            title="Refund Processing Time"
            iconColor="text-purple-neon"
            bgColor="bg-purple-neon/10"
            borderColor="border-purple-neon/30"
          >
            <p>If your refund request is approved, here&apos;s what to expect:</p>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Card className="bg-bg-secondary/50 border-border-subtle">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-text-primary mb-2">Review Period</h4>
                  <p className="text-sm text-text-secondary">1-3 business days for investigation</p>
                </CardContent>
              </Card>
              <Card className="bg-bg-secondary/50 border-border-subtle">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-text-primary mb-2">Processing</h4>
                  <p className="text-sm text-text-secondary">3-7 business days after approval</p>
                </CardContent>
              </Card>
              <Card className="bg-bg-secondary/50 border-border-subtle">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-text-primary mb-2">Crypto Refunds</h4>
                  <p className="text-sm text-text-secondary">Sent to original payment address</p>
                </CardContent>
              </Card>
              <Card className="bg-bg-secondary/50 border-border-subtle">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-text-primary mb-2">Network Fees</h4>
                  <p className="text-sm text-text-secondary">Deducted from refund amount</p>
                </CardContent>
              </Card>
            </div>

            <InfoBox>
              Refund processing times may vary based on cryptocurrency network congestion. 
              During high-traffic periods, blockchain confirmations may take longer.
            </InfoBox>
          </Section>

          <Separator className="bg-border-subtle" />

          {/* Key Replacement Policy */}
          <Section 
            id="replacement" 
            icon={RotateCcw} 
            title="Key Replacement Policy"
            iconColor="text-green-success"
            bgColor="bg-green-success/10"
            borderColor="border-green-success/30"
          >
            <p>
              In some cases, we may offer a replacement key instead of a refund. This applies when:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The original key was invalid or already redeemed (not by you)</li>
              <li>There was a fulfillment error on our end</li>
              <li>The same product is available in stock</li>
            </ul>

            <p className="mt-4">
              Replacement keys are subject to availability. If a replacement is not available, 
              we will process a refund instead (if eligible).
            </p>

            <Card className="bg-green-success/5 border-green-success/30 mt-4">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-success shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-text-primary">Replacement Priority</h4>
                    <p className="text-sm text-text-secondary mt-1">
                      We prioritize replacements over refunds as it&apos;s faster for you to receive 
                      your product, and it helps maintain a positive experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Separator className="bg-border-subtle" />

          {/* FAQ Section */}
          <Section 
            id="faq" 
            icon={HelpCircle} 
            title="Frequently Asked Questions"
            iconColor="text-cyan-glow"
            bgColor="bg-cyan-glow/10"
            borderColor="border-cyan-glow/30"
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-bg-secondary/50 border border-border-subtle rounded-lg px-4"
                >
                  <AccordionTrigger className="text-left text-text-primary hover:text-cyan-glow">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-text-secondary">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Section>

          <Separator className="bg-border-subtle" />

          {/* Contact Section */}
          <Section 
            id="contact" 
            icon={Mail} 
            title="Need Help?"
            iconColor="text-cyan-glow"
            bgColor="bg-cyan-glow/10"
            borderColor="border-cyan-glow/30"
          >
            <p>
              If you have questions about this Refund Policy or need assistance with a specific 
              order, our support team is here to help:
            </p>
            <Card className="bg-bg-secondary/50 border-border-subtle mt-4">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-cyan-glow" />
                    <span className="text-text-primary">support@bitloot.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-cyan-glow" />
                    <span className="text-text-primary">Live Chat (24/7)</span>
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
              Response times: Live chat is typically instant during business hours. Email responses 
              within 24-48 hours.
            </p>
          </Section>

          {/* Final Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-12 p-6 rounded-xl bg-linear-to-r from-orange-warning/10 via-purple-neon/10 to-cyan-glow/10 border border-border-subtle"
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-glow/20 border border-cyan-glow/30 shrink-0">
                <Zap className="w-6 h-6 text-cyan-glow" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  Buy with Confidence
                </h3>
                <p className="text-text-secondary">
                  While our refund policy is strict due to the nature of digital goods, we stand 
                  behind the quality of our products. All keys are sourced from authorized distributors 
                  and verified before delivery. If you ever receive a non-working key, we&apos;ll make it right.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Related Links */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link 
              href="/terms" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/50 transition-all"
            >
              <FileText className="w-4 h-4" />
              Terms of Service
            </Link>
            <Link 
              href="/privacy" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/50 transition-all"
            >
              <Shield className="w-4 h-4" />
              Privacy Policy
            </Link>
            <Link 
              href="/help" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-secondary border border-border-subtle text-text-secondary hover:text-cyan-glow hover:border-cyan-glow/50 transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
