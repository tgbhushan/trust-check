/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LearningLesson {
  id: string;
  category: 'threats' | 'technology' | 'privacy';
  title: string;
  shortSummary: string;
  explanation: string;
  realisticExample: {
    scenario: string;
    indicator: string;
    howItWorks: string;
  };
  keyTakeaway: string;
}

export const LEARNING_LESSONS: LearningLesson[] = [
  {
    id: 'phishing',
    category: 'threats',
    title: 'Phishing & Deceptive Messaging',
    shortSummary: 'Deceptive messages designed to manipulate recipients into revealing sensitive data or executing unwanted actions.',
    explanation:
      'Phishing relies on psychological triggers—urgency, authority, fear, or excitement—rather than technical exploits. Attackers craft messages impersonating banks, shipping carriers, tax authorities, or IT departments. Even sophisticated users can fall prey when a message arrives during a busy workday or simulates an expected transaction.',
    realisticExample: {
      scenario: 'An email claiming your parcel delivery failed and requires a $1.20 re-delivery fee within 12 hours.',
      indicator: 'https://post-delivery-update-293.com/tracking',
      howItWorks: 'The victim is led to a simulated post portal asking for full credit card details, billing address, and phone number, which are harvested instantly by the attacker.',
    },
    keyTakeaway: 'Always verify claims independently through the official organization app or a saved bookmark, never via the links provided in unexpected messages.',
  },
  {
    id: 'credential-theft',
    category: 'threats',
    title: 'Credential Harvesting Portals',
    shortSummary: 'Replicas of corporate and consumer login interfaces engineered to capture passwords and MFA session codes.',
    explanation:
      'Credential harvesting sites often use exact copies of legitimate login forms (Microsoft 365, Google Workspace, banking portals). Modern reverse-proxy toolkits (like Evilginx) can even proxy multi-factor authentication (MFA) requests in real time, capturing session cookies alongside usernames and passwords.',
    realisticExample: {
      scenario: 'A shared document notification prompting the recipient to "Sign in with your organization email" to view an urgent quarterly invoice.',
      indicator: 'https://login-microsoftonline.corporate-portal-viewer.org/oauth2',
      howItWorks: 'The page mirrors the organization’s actual single sign-on branding. When the user logs in and confirms their 2FA prompt, the proxy steals the authenticated session cookie.',
    },
    keyTakeaway: 'Use FIDO2 / Passkey hardware keys which cryptographically bind authentication to the legitimate domain origin, neutralizing fake portal credential theft.',
  },
  {
    id: 'domain-impersonation',
    category: 'threats',
    title: 'Domain Impersonation & Typosquatting',
    shortSummary: 'Exploiting visual similarity, misspellings, or alternative top-level domains to mimic trusted institutions.',
    explanation:
      'Attackers register domain names that look almost identical to familiar brands by replacing letters (e.g., lowercase "l" with number "1", or using Cyrillic homoglyphs like "а" instead of Latin "a"). They may also add prefixes like `account-`, `verify-`, or `login-` to a brand name.',
    realisticExample: {
      scenario: 'A search engine ad for popular messaging software leading to an impersonation domain with a malicious installer.',
      indicator: 'https://www.examp1e-bank.com/secure',
      howItWorks: 'The domain swaps letter "l" for "1" or appends a hyphen. Because the layout matches the official site, visitors assume it is the genuine service.',
    },
    keyTakeaway: 'Inspect the address bar carefully up to the first single slash `/`. The domain name directly preceding the slash is the actual host authority.',
  },
  {
    id: 'malicious-downloads',
    category: 'threats',
    title: 'Malicious Downloads & File Masquerading',
    shortSummary: 'Disguising executable malware as innocent PDF invoices, spreadsheet reports, or software updates.',
    explanation:
      'Malicious actors frequently double-extend filenames (e.g., `invoice_092026.pdf.exe`) relying on default operating system settings that hide file extensions. Once executed, the binary can install ransomware, keyloggers, or info-stealers while opening a decoy document to avoid suspicion.',
    realisticExample: {
      scenario: 'A freelance contractor receives an inquiry with a compressed archive `project_specifications.zip` containing an `.exe` disguised with a PDF icon.',
      indicator: 'SHA-256: 2c2446132bb3522f741b7c06d3b8e23807768323860f4178ab0f31e33ccfe2a8',
      howItWorks: 'Opening the executable initiates an InfoStealer payload that scrapes browser auto-fill credentials, session cookies, and crypto wallets within milliseconds.',
    },
    keyTakeaway: 'Enable visible file extensions in your operating system and never run executable formats (.exe, .scr, .iso, .bat) received via unverified channels.',
  },
  {
    id: 'suspicious-redirects',
    category: 'threats',
    title: 'Open Redirects & Traffic Chaining',
    shortSummary: 'Abusing legitimate domains or shorteners to funnel victims through multiple intermediaries into hostile territory.',
    explanation:
      'An open redirect is an application flaw where a trusted domain takes a parameter and redirects the visitor without validation (e.g., `https://trusted.gov/redirect?url=https://attacker.com`). To the user and automated email filters, the initial URL appears to belong to a reputable institution.',
    realisticExample: {
      scenario: 'An attacker shares a legitimate university link that quietly bounces the browser to a lottery scam.',
      indicator: 'https://trusted-university.edu/outbound?dest=https://sketchy-reward-hub.net',
      howItWorks: 'The victim trusts the university domain. Upon clicking, the university server issues an HTTP 302 Found redirecting the browser to the attack infrastructure.',
    },
    keyTakeaway: 'Be alert when clicking URLs containing `redirect=`, `url=`, `dest=`, or `next=` parameters pointing to external domains.',
  },
  {
    id: 'https-limitations',
    category: 'technology',
    title: 'The "HTTPS Equals Safe" Myth',
    shortSummary: 'The padlock icon guarantees encryption in transit—not that the entity at the other end is trustworthy.',
    explanation:
      'HTTPS ensures that eavesdroppers on your Wi-Fi cannot intercept or tamper with the communication between your browser and the website server. However, obtaining a free SSL certificate takes less than 60 seconds through automated certificate authorities. Today, over 80% of active phishing websites use HTTPS and display the padlock.',
    realisticExample: {
      scenario: 'A fraudulent shopping site offering 90% discounts displays a valid SSL certificate and a green padlock.',
      indicator: 'https://luxury-outlet-clearance-sale.org',
      howItWorks: 'The connection is encrypted, meaning your credit card information reaches the attacker’s server securely without interception.',
    },
    keyTakeaway: 'A padlock means the connection is private, not that the destination is honest. Always assess the identity of the host, not just the lock icon.',
  },
  {
    id: 'threat-intelligence-databases',
    category: 'technology',
    title: 'How Threat Intelligence Operates',
    shortSummary: 'Aggregate security engines, sandbox detonators, and heuristic telemetry pooled together.',
    explanation:
      'Platforms like VirusTotal coordinate feeds from dozens of independent security companies, cloud scanners, and public blacklists. When an indicator is queried, you see a mosaic of verdicts from signature-based scanners, machine learning models, and reputation heuristics.',
    realisticExample: {
      scenario: 'Checking a domain returns 3 malicious hits from phishing specialists, but 65 harmless hits from standard antivirus engines.',
      indicator: 'Domain: new-phish-brand.com',
      howItWorks: 'Different vendors specialize in different vectors. A generic file antivirus engine might not track brand-new URL phishing campaigns as quickly as dedicated web filter vendors.',
    },
    keyTakeaway: 'Examine which specific engines flagged an indicator and what classification they assigned, rather than judging solely by raw numbers.',
  },
  {
    id: 'false-positives-negatives',
    category: 'technology',
    title: 'False Positives vs. False Negatives',
    shortSummary: 'Why automated threat intelligence can both misidentify benign sites and overlook fresh attacks.',
    explanation:
      'A false positive occurs when legitimate developer tools or privacy services get misclassified as malicious. A false negative occurs when a brand-new threat is evaluated before any vendor has recorded evidence. Zero detections in a threat report proves only that no reporting vendor has flagged it yet—it does not prove the item is harmless.',
    realisticExample: {
      scenario: 'A targeted spear-phishing link sent to one executive has never been seen by any public scanner.',
      indicator: 'https://executive-payroll-review.internal-portal.biz',
      howItWorks: 'Because the attacker created the infrastructure hours earlier, public databases return "No detections reported" or 404 Inconclusive.',
    },
    keyTakeaway: 'Never mistake "No detections found" for "Certified safe". Context, sender identity, and plausibility remain essential.',
  },
  {
    id: 'url-privacy',
    category: 'privacy',
    title: 'URL Privacy & Information Disclosure',
    shortSummary: 'Query strings frequently contain private email addresses, reset tokens, and unindexed document paths.',
    explanation:
      'When you submit an indicator to an external scanner like VirusTotal, that query becomes part of a shared global database accessible to security researchers, subscribers, and automated feeds. If the URL contains a password-reset token, a one-time login link, or confidential file keys, anyone analyzing that feed can access that sensitive data.',
    realisticExample: {
      scenario: 'An employee submits an unlisted Google Drive or Notion link containing `authuser` or `token` query parameters to a public scanner.',
      indicator: 'https://docs.service.com/view?share_token=secret_98f411b7',
      howItWorks: 'The link is archived on the public service. Third parties monitoring public intelligence feeds can view the confidential document.',
    },
    keyTakeaway: 'Never submit private, authenticated, or password-reset links to threat intelligence scanners. Strip sensitive query parameters first.',
  },
  {
    id: 'digital-surveillance',
    category: 'privacy',
    title: 'Indicator Tracking & Surveillance Risks',
    shortSummary: 'How querying private internal infrastructure or investigative targets can reveal your own activities.',
    explanation:
      'Threat actors monitor threat intelligence feeds to discover when their infrastructure has been noticed by investigators or targets. If an organization queries a suspected hostile IP immediately after receiving an attack, the adversary learns that their campaign was detected and can switch infrastructure.',
    realisticExample: {
      scenario: 'A journalist investigates a sensitive leak website by querying its exact staging subdomain on a public scanning portal.',
      indicator: 'https://leaks-staging-04.confidential-whistleblower.org',
      howItWorks: 'The query appears in public passive DNS and scanner feeds, notifying adversaries that someone is actively probing the staging infrastructure.',
    },
    keyTakeaway: 'Responsible investigation requires using offline demo fixtures, passive cached lookups, or isolated infrastructure when handling sensitive sources.',
  },
  {
    id: 'responsible-investigation',
    category: 'privacy',
    title: 'The Principles of Responsible Investigation',
    shortSummary: 'Investigate evidence without clicking links, triggering payloads, or exposing private credentials.',
    explanation:
      'Responsible investigations prioritize safety and privacy: never open untrusted links in your primary browser, never download or run unverified files, check hashes rather than uploading confidential files, verify sender addresses out-of-band, and acknowledge when evidence is inconclusive rather than jumping to false conclusions.',
    realisticExample: {
      scenario: 'Receiving a suspicious invoice email.',
      indicator: 'Procedure: Extract domain -> Check passive reputation -> Inspect WHOIS -> Do not execute file.',
      howItWorks: 'By investigating indicators through safe passive lookups rather than active execution, you gather evidence while remaining completely protected.',
    },
    keyTakeaway: 'Evidence before conclusions. Privacy before convenience. Question the trust before clicking.',
  },
];
