/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ShoppingCart,
  UserCheck,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface Topic {
  id: string;
  number: string;
  title: string;
  shortDesc: string;
  icon: any;
  category: 'threats' | 'technology' | 'response';
  whatItIs: string;
  howScammersDoIt: string;
  realWorldScenario: {
    story: string;
    indicators: string[];
    redFlag: string;
  };
  keyTakeaway: string;
}

const SCAM_TOPICS: Topic[] = [
  {
    id: 'phishing-domains',
    number: '01',
    title: 'Phishing Links & Misleading Domains',
    shortDesc: 'How deceptive links exploit subdomain hierarchy, typosquatting, and homoglyphs.',
    icon: ExternalLink,
    category: 'threats',
    whatItIs:
      'Phishing links are deceptive addresses designed to mimic reputable brands. Attackers craft URLs where the left-hand text says "paypal" or "bankofamerica", but the actual registrable domain before the slash belongs entirely to the scammer.',
    howScammersDoIt:
      'They use three main techniques: 1) Subdomain confusion (e.g., `bank.com.attacker-controlled.net`), 2) Typosquatting (replacing letter "l" with number "1" or letter "o" with "0"), and 3) IDN Homoglyphs (using Cyrillic or Greek characters that look identical to Latin letters).',
    realWorldScenario: {
      story:
        'A text message arrives claiming your package is held at customs. The link reads: "https://dhl-express.tracking-customs-resolution.org/pay". The recipient sees "dhl-express" on the left and assumes it is official DHL.',
      indicators: [
        'Visible Left Part: dhl-express',
        'Real Domain: tracking-customs-resolution.org',
        'Registered: 18 hours ago via anonymous privacy guard',
      ],
      redFlag:
        'The domain directly before the single slash "/" is NOT dhl.com. Anyone can register any domain and put "dhl" in front of it.',
    },
    keyTakeaway:
      'Always read a URL backwards from the first single slash "/" to find the real registered domain.',
  },
  {
    id: 'fake-logins',
    number: '02',
    title: 'Fake Login Pages & Impersonation',
    shortDesc: 'Pixel-perfect replicas of Google, Microsoft 365, and banking portals that capture passwords and 2FA tokens.',
    icon: UserCheck,
    category: 'threats',
    whatItIs:
      'Credential harvesting portals are exact duplicates of genuine login pages. They match fonts, logos, error animations, and even multi-factor authentication (MFA) prompts.',
    howScammersDoIt:
      'Modern attack kits use reverse proxies (like Evilginx). When you type your password and approve a 2FA code, the proxy forwards it to the real bank in real time, logs you in, and steals your authenticated session cookie.',
    realWorldScenario: {
      story:
        'An employee receives an email: "Shared Document: Q4 Salary Review". Clicking prompts: "Sign in with Microsoft 365 to view this protected PDF".',
      indicators: [
        'Displayed Layout: Exact Microsoft login design with company logo',
        'Actual URL: login-microsoftonline.partner-secure-portal.info',
        'Form Action: Real-time credential relay',
      ],
      redFlag:
        'Legitimate single sign-on (SSO) redirects only to login.microsoftonline.com or accounts.google.com, never third-party partner portals.',
    },
    keyTakeaway:
      'Adopt Passkeys or FIDO2 hardware security keys. They are cryptographically bound to the real domain name and cannot be phished by clone portals.',
  },
  {
    id: 'malicious-downloads',
    number: '03',
    title: 'Suspicious Attachments & Malicious Downloads',
    shortDesc: 'Executables disguised as PDFs, archive traps, and macro-enabled documents.',
    icon: FileText,
    category: 'threats',
    whatItIs:
      'Malicious downloads trick victims into opening executable code that installs info-stealers, remote access trojans (RATs), or ransomware.',
    howScammersDoIt:
      'Attackers exploit operating system defaults that hide known file extensions. By naming a file `invoice_2026.pdf.exe`, users only see `invoice_2026.pdf` with a PDF icon. They also use `.iso` disk images, password-protected `.zip` files (to bypass email antivirus scanners), and `.js` or `.vbs` scripts.',
    realWorldScenario: {
      story:
        'A job applicant downloads an interview preparation guide compressed inside `Applicant_Profile_Assessment.zip`. Inside is a file with a PDF icon that launches an executable info-stealer.',
      indicators: [
        'Apparent Name: Interview_Prep.pdf',
        'Real Extension: .pdf.exe (Portable Executable)',
        'Payload: RedLine / Lumma InfoStealer scraping browser passwords and session cookies',
      ],
      redFlag:
        'A genuine PDF document never asks for administrator permissions, never has a .exe or .scr extension, and never opens a terminal window.',
    },
    keyTakeaway:
      'Enable "Show File Extensions" in your operating system. Never open .exe, .scr, .bat, or .iso files received from email or messaging apps.',
  },
  {
    id: 'padlock-myth',
    number: '04',
    title: 'The Padlock Fallacy (HTTPS ≠ Safe)',
    shortDesc: 'Why the green padlock only guarantees encryption in transit, not the honesty of the recipient.',
    icon: Lock,
    category: 'technology',
    whatItIs:
      'For decades, users were taught: "Look for the padlock and https:// to know a website is safe." Today, this advice is obsolete and dangerously misleading.',
    howScammersDoIt:
      'HTTPS (TLS encryption) ensures that a third party on your public Wi-Fi cannot intercept data in transit. However, anyone in the world can obtain a free, automated SSL certificate in under 60 seconds (via Let’s Encrypt). Over 85% of active phishing sites now have valid SSL certificates and display the padlock.',
    realWorldScenario: {
      story:
        'A user visits a fraudulent luxury shopping outlet offering $900 designer jackets for $49. The site has a valid green padlock and HTTPS, so the user assumes their payment is safe.',
      indicators: [
        'Security Indicator: Valid TLS 1.3 certificate',
        'Issuer: Automated free certificate authority',
        'Recipient: Fraudulent offshore card-skimming operation',
      ],
      redFlag:
        'The padlock encrypts your connection directly to the criminal. It ensures nobody steals your credit card on the way, but gives your credit card directly to the thief.',
    },
    keyTakeaway:
      'The padlock only proves your connection is private, not that the website owner is honest.',
  },
  {
    id: 'urgency-threats',
    number: '05',
    title: 'Urgency, Fear & Fraudulent Payment Demands',
    shortDesc: 'Psychological manipulation using countdown timers, legal threats, and untraceable payment methods.',
    icon: DollarSign,
    category: 'threats',
    whatItIs:
      'Scammers rely on emotional urgency—panic, fear of arrest, missed deliveries, or sudden financial windfalls—to short-circuit your logical thinking.',
    howScammersDoIt:
      'They create artificial deadlines ("Your account will be suspended in 15 minutes!") and demand payment via irreversible or untraceable channels: gift cards (Apple, Google Play), wire transfers, peer-to-peer apps (Zelle, CashApp), or cryptocurrency ATMs.',
    realWorldScenario: {
      story:
        'A pop-up displays a fake Windows Defender alert with a loud siren: "CRITICAL VIRUS DETECTED! Do NOT restart your PC. Call Microsoft Support at (800) 555-0199 immediately."',
      indicators: [
        'Pressure Tactics: Flashing red screens, audio alarms, full-screen lockups',
        'Requested Action: Call toll-free number and grant remote desktop access (AnyDesk/TeamViewer)',
        'Payment Demand: Purchase $500 Target gift cards to "secure federal account"',
      ],
      redFlag:
        'No legitimate technology company or government agency ever demands payment in gift cards, wire transfers, or cryptocurrency.',
    },
    keyTakeaway:
      'Whenever an alert creates intense urgency or demands non-refundable payment methods, stop immediately. It is virtually always a scam.',
  },
  {
    id: 'fake-shops-investments',
    number: '06',
    title: 'Fake Online Stores & Investment Schemes',
    shortDesc: 'Too-good-to-be-true retail discounts, fake escrow services, and cryptocurrency yield traps.',
    icon: ShoppingCart,
    category: 'threats',
    whatItIs:
      'Fraudulent e-commerce sites and bogus trading platforms designed to take your money without ever delivering goods or allowing withdrawals.',
    howScammersDoIt:
      'Fake stores advertise 80–90% clearance discounts on social media (Instagram, TikTok, Facebook Ads). They steal product photos from legitimate retailers. In crypto/investment scams, a fake dashboard shows huge fake profits, but when the victim tries to withdraw, they demand "tax fees" or "liquidity deposits".',
    realWorldScenario: {
      story:
        'A Facebook ad advertises an official PlayStation 5 bundle for $89 from a domain called "sony-clearance-direct-liquidation.shop".',
      indicators: [
        'Pricing: 85% below wholesale manufacturing cost',
        'Contact Info: Only a generic web form; no physical address, phone number, or company registration',
        'Domain Age: Registered 12 days ago in Iceland with hidden WHOIS data',
      ],
      redFlag:
        'Extravagant discounts that defy economic reality combined with a freshly registered domain are guaranteed scams.',
    },
    keyTakeaway:
      'If a deal looks too good to be true, it is. Always search the company name plus the word "scam" or "review" before paying.',
  },
  {
    id: 'personal-info',
    number: '07',
    title: 'Protecting Personal Information & Privacy Rights',
    shortDesc: 'Why threat intelligence scanning requires privacy boundaries and how to safeguard sensitive tokens.',
    icon: Shield,
    category: 'technology',
    whatItIs:
      'Online privacy and threat intelligence are deeply connected. Automated scanners and public security feeds often publicly archive submitted URLs and files.',
    howScammersDoIt:
      'When users copy and paste full URLs into public analysis tools, those URLs often contain session tokens, password reset hashes, or personal emails (e.g., `company.com/reset?token=secret123`). Public threat feeds index these, inadvertently exposing private accounts to reconnaissance bots.',
    realWorldScenario: {
      story:
        'A user receives a suspicious email from their healthcare provider and pastes the password reset link into a public threat scanner.',
      indicators: [
        'Exposed URL: https://portal.healthcare.org/auth/reset?token=a9f8e7d6c5b4&user=patient482',
        'Consequence: The token is archived in a public malware database where threat intelligence subscribers can see and click it',
      ],
      redFlag:
        'Public scanners are search engines for indicators. Submitting private links can leak sensitive authentication data.',
    },
    keyTakeaway:
      'Strip query parameters (like ?token= or ?auth=) before submitting any URL to a public threat database.',
  },
  {
    id: 'emergency-steps',
    number: '08',
    title: 'What To Do If You Clicked a Suspicious Link',
    shortDesc: 'Actionable emergency protocol to isolate damage, revoke access, and protect your accounts.',
    icon: LifeBuoy,
    category: 'response',
    whatItIs:
      'Making a mistake is human. Having a calm, step-by-step containment protocol immediately after clicking or entering information minimizes damage.',
    howScammersDoIt:
      'Attackers count on panic or delay. If you act within the first few minutes, you can invalidate tokens before they are exploited.',
    realWorldScenario: {
      story:
        'You realized 30 seconds after entering your university login details that the website domain was suspicious.',
      indicators: [
        'Immediate Action Needed: Password invalidation & session revocation',
        'Device Status: Potential credential compromise',
      ],
      redFlag:
        'Waiting to see what happens gives the attacker hours to change recovery emails and transfer funds.',
    },
    keyTakeaway:
      'Follow the 5-step containment checklist below immediately.',
  },
];

export const ScamEducation: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'threats' | 'technology' | 'response'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>('phishing-domains');

  // Interactive URL Anatomy state
  const [activeAnatomyPart, setActiveAnatomyPart] = useState<'scheme' | 'subdomain' | 'domain' | 'path' | 'query'>('domain');

  // Emergency checklist interactive state
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const filteredTopics = SCAM_TOPICS.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.shortDesc.toLowerCase().includes(q) ||
        t.whatItIs.toLowerCase().includes(q) ||
        t.keyTakeaway.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-[#2D7773] uppercase">
            <BookOpen className="w-4 h-4 text-[#2D7773]" />
            <span>Practical Security & Scam Prevention Field Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#111827] tracking-tight">
            Learn How Online Scams & Deceptions Work
          </h2>
          <p className="text-sm text-[#697386] leading-relaxed">
            Technical safeguards matter, but human judgment is your first and last line of defense. Explore concise, actionable breakdowns of modern phishing, fake websites, malware disguises, and emergency recovery steps.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-[#D8DCE2]">
          <div className="inline-flex p-1 bg-[#F5F2EA] rounded-lg border border-[#D8DCE2] text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedCategory === 'all' ? 'bg-[#111827] text-white font-semibold' : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              All Topics ({SCAM_TOPICS.length})
            </button>
            <button
              onClick={() => setSelectedCategory('threats')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedCategory === 'threats' ? 'bg-[#111827] text-white font-semibold' : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              Scams & Threats (5)
            </button>
            <button
              onClick={() => setSelectedCategory('technology')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedCategory === 'technology' ? 'bg-[#111827] text-white font-semibold' : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              Tech & Limits (2)
            </button>
            <button
              onClick={() => setSelectedCategory('response')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedCategory === 'response' ? 'bg-[#111827] text-white font-semibold' : 'text-[#697386] hover:text-[#111827]'
              }`}
            >
              Emergency Action (1)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 text-xs bg-[#F5F2EA] border border-[#D8DCE2] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2D7773]"
            />
            <Search className="w-3.5 h-3.5 text-[#697386] absolute left-2.5 top-3" />
          </div>
        </div>
      </div>

      {/* Interactive Tool 1: Interactive URL Anatomy Breakdown */}
      <div className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#2D7773] uppercase tracking-wider">
          <Lightbulb className="w-4 h-4 text-[#D5A64A]" />
          <span>Interactive Forensic Tool · URL Anatomy</span>
        </div>

        <div>
          <h3 className="text-xl font-bold text-[#111827]">
            How to Read a Deceptive Web Address
          </h3>
          <p className="text-xs text-[#697386] mt-1">
            Click on each component of the suspicious URL below to learn what attackers tamper with and where your eyes should look first.
          </p>
        </div>

        {/* Visual URL Box with interactive spans */}
        <div className="p-4 sm:p-6 bg-[#111827] text-white rounded-xl font-mono text-xs sm:text-sm overflow-x-auto leading-relaxed border border-slate-700">
          <span
            onClick={() => setActiveAnatomyPart('scheme')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
              activeAnatomyPart === 'scheme'
                ? 'bg-[#2D7773] text-white font-bold ring-2 ring-white/50'
                : 'text-emerald-400 hover:bg-slate-800'
            }`}
          >
            https://
          </span>
          <span
            onClick={() => setActiveAnatomyPart('subdomain')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
              activeAnatomyPart === 'subdomain'
                ? 'bg-[#D5A64A] text-[#111827] font-bold ring-2 ring-white/50'
                : 'text-amber-300 hover:bg-slate-800'
            }`}
          >
            paypal-account-verify.
          </span>
          <span
            onClick={() => setActiveAnatomyPart('domain')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
              activeAnatomyPart === 'domain'
                ? 'bg-[#C94C4C] text-white font-bold ring-2 ring-white/50'
                : 'text-rose-400 underline decoration-wavy hover:bg-slate-800'
            }`}
          >
            security-session99.org
          </span>
          <span
            onClick={() => setActiveAnatomyPart('path')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
              activeAnatomyPart === 'path'
                ? 'bg-blue-600 text-white font-bold ring-2 ring-white/50'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            /signin/auth
          </span>
          <span
            onClick={() => setActiveAnatomyPart('query')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
              activeAnatomyPart === 'query'
                ? 'bg-purple-600 text-white font-bold ring-2 ring-white/50'
                : 'text-purple-300 hover:bg-slate-800'
            }`}
          >
            ?ref=urgent_alert&id=9284
          </span>
        </div>

        {/* Breakdown Explanation Card */}
        <div className="p-5 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] text-xs space-y-2">
          {activeAnatomyPart === 'scheme' && (
            <div>
              <span className="font-bold text-sm text-[#111827] block font-mono text-emerald-800">
                1. Scheme (https://) — The Transport Security
              </span>
              <p className="text-[#111827] leading-relaxed mt-1">
                Indicates TLS encryption. <strong>Common misconception:</strong> People think "https://" means the site is legitimate. In reality, it only encrypts transmission. Criminals obtain free, automated HTTPS certificates in 60 seconds.
              </p>
            </div>
          )}

          {activeAnatomyPart === 'subdomain' && (
            <div>
              <span className="font-bold text-sm text-[#111827] block font-mono text-amber-800">
                2. Subdomain Trap (paypal-account-verify.) — The Camouflage
              </span>
              <p className="text-[#111827] leading-relaxed mt-1">
                Attackers add brand names into subdomains to trick mobile users whose browser address bar cuts off the right half of long URLs. The owner of <code>security-session99.org</code> can create any subdomain they want (e.g., <code>apple.com.security-session99.org</code>).
              </p>
            </div>
          )}

          {activeAnatomyPart === 'domain' && (
            <div>
              <span className="font-bold text-sm text-[#111827] block font-mono text-rose-800">
                3. Registrable Domain (security-session99.org) — The REAL Owner
              </span>
              <p className="text-[#111827] leading-relaxed mt-1">
                <strong>THIS IS WHAT MATTERS.</strong> The registrable domain is the text immediately preceding the single slash <code>/</code>. In this example, the domain is <strong>NOT paypal.com</strong>—it is <code>security-session99.org</code>. You are handing your password to whoever owns that domain.
              </p>
            </div>
          )}

          {activeAnatomyPart === 'path' && (
            <div>
              <span className="font-bold text-sm text-[#111827] block font-mono text-blue-800">
                4. Path (/signin/auth) — The Server Resource
              </span>
              <p className="text-[#111827] leading-relaxed mt-1">
                Directs the browser to a specific script or file on the server. Phishing kits often use paths like <code>/login/verification/step1</code> to make the page appear structured and legitimate.
              </p>
            </div>
          )}

          {activeAnatomyPart === 'query' && (
            <div>
              <span className="font-bold text-sm text-[#111827] block font-mono text-purple-800">
                5. Query Parameters (?ref=...&id=...) — Tracking & Sensitive Data
              </span>
              <p className="text-[#111827] leading-relaxed mt-1">
                Parameters passed to the server. Scammers use these to track which victim clicked the email link. <strong>Warning:</strong> Legitimate reset links often place secret tokens here (e.g., <code>?reset_token=abc</code>); never paste full query strings into public scanners.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Topics Accordion List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[#111827]">
          Essential Security Guidance ({filteredTopics.length} Lessons)
        </h3>

        {filteredTopics.map((topic) => {
          const isExpanded = expandedTopicId === topic.id;
          const Icon = topic.icon;

          return (
            <div
              key={topic.id}
              className="bg-[#FFFFFF] border border-[#D8DCE2] rounded-xl overflow-hidden shadow-xs transition-colors"
            >
              <button
                type="button"
                onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 hover:bg-[#F5F2EA]/40 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F2EA] border border-[#D8DCE2] flex items-center justify-center text-[#2D7773] shrink-0 font-mono font-bold text-xs mt-0.5">
                    {topic.number}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base text-[#111827]">
                        {topic.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                          topic.category === 'response'
                            ? 'bg-rose-100 text-rose-800'
                            : topic.category === 'technology'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {topic.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#697386] leading-relaxed">
                      {topic.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="p-1 text-[#697386] shrink-0 mt-2">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-[#D8DCE2] space-y-6 text-xs">
                  {/* Detailed explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-[#2D7773] font-mono block">
                        What It Is
                      </span>
                      <p className="text-[#111827] leading-relaxed text-xs">
                        {topic.whatItIs}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-[#C94C4C] font-mono block">
                        How Scammers Exploit It
                      </span>
                      <p className="text-[#111827] leading-relaxed text-xs">
                        {topic.howScammersDoIt}
                      </p>
                    </div>
                  </div>

                  {/* Real World Scenario Box */}
                  <div className="p-4 bg-[#F5F2EA] rounded-xl border border-[#D8DCE2] space-y-3">
                    <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-[#111827] uppercase">
                      <Eye className="w-3.5 h-3.5 text-[#2D7773]" />
                      <span>Real-World Forensic Scenario</span>
                    </div>
                    <p className="text-[#111827] text-xs italic leading-relaxed">
                      "{topic.realWorldScenario.story}"
                    </p>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#697386]">
                        Observed Indicators:
                      </span>
                      <ul className="list-disc list-inside text-[11px] text-[#111827] space-y-0.5">
                        {topic.realWorldScenario.indicators.map((ind, i) => (
                          <li key={i}>{ind}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs">
                      <strong className="block mb-0.5">The Critical Red Flag:</strong>
                      <span>{topic.realWorldScenario.redFlag}</span>
                    </div>
                  </div>

                  {/* Key Takeaway Pill */}
                  <div className="p-3.5 bg-[#111827] text-white rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#D5A64A] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono text-[10px] uppercase font-bold text-[#D5A64A] block">
                        Actionable Rule of Thumb
                      </span>
                      <span className="text-xs text-slate-200 font-medium leading-relaxed">
                        {topic.keyTakeaway}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Emergency Action Plan Checklist: What To Do After Clicking */}
      <div className="bg-[#FFFFFF] border-2 border-[#C94C4C] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#C94C4C] uppercase tracking-wider">
          <LifeBuoy className="w-4 h-4 text-[#C94C4C]" />
          <span>Incident Containment Protocol</span>
        </div>

        <div>
          <h3 className="text-xl font-bold text-[#111827]">
            What to Do If You Clicked a Suspicious Link (Emergency Checklist)
          </h3>
          <p className="text-xs text-[#697386] mt-1 leading-relaxed">
            Stay calm and act systematically. Follow these 5 containment steps immediately to prevent account takeover or financial loss.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              step: 'Step 1: Disconnect Internet Immediately (If a file downloaded)',
              desc: 'If a file downloaded or started executing, disconnect Wi-Fi or unplug your ethernet cable immediately. This stops active malware from transmitting stolen credentials or encryption keys back to command-and-control servers.',
            },
            {
              step: 'Step 2: Change Passwords From a DIFFERENT Device',
              desc: 'Never change passwords from the compromised device if malware was executed. Use your phone or another clean computer to change passwords for the affected account, your primary email, and financial portals.',
            },
            {
              step: 'Step 3: Invalidate All Active Sessions ("Sign Out Everywhere")',
              desc: 'In Google, Microsoft, or Apple account settings, click "Sign out of all sessions / Revoke active logins". This instantly terminates any session cookies the attacker captured with a reverse proxy.',
            },
            {
              step: 'Step 4: Contact Your Bank & Monitor Credit (If card details entered)',
              desc: 'If you submitted credit card or banking details, call the fraud number on the back of your card immediately to freeze or replace the card. Place a temporary fraud alert or credit freeze.',
            },
            {
              step: 'Step 5: Run a Full Endpoint Antivirus / Malware Scan',
              desc: 'Run a thorough scan using Windows Defender, Malwarebytes, or your trusted antivirus solution. Check browser extensions for newly installed, unauthorized add-ons.',
            },
          ].map((item, idx) => (
            <label
              key={idx}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer select-none ${
                checkedSteps[idx]
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-[#F5F2EA] border-[#D8DCE2] hover:border-[#2D7773]'
              }`}
            >
              <input
                type="checkbox"
                checked={Boolean(checkedSteps[idx])}
                onChange={() => toggleCheck(idx)}
                className="mt-1 rounded border-[#D8DCE2] text-[#2D7773] focus:ring-[#2D7773] shrink-0"
              />
              <div className="space-y-1 text-xs">
                <span
                  className={`font-bold block ${
                    checkedSteps[idx] ? 'text-emerald-950 line-through' : 'text-[#111827]'
                  }`}
                >
                  {item.step}
                </span>
                <p className="text-[#697386] leading-relaxed">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
