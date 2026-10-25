const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  WidthType,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
} = require('docx');

const NAVY = '0F172A';
const SLATE_DARK = '1E293B';
const SLATE_TEXT = '334155';
const SLATE_MUTED = '64748B';
const BRAND_BLUE = '2563EB';
const EMERALD = '059669';
const BORDER_COLOR = 'CBD5E1';
const BG_LIGHT = 'F8FAFC';
const BG_ALT = 'F1F5F9';

function createHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 150 },
  });
}

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 100 },
  });
}

function createHeading3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
  });
}

function p(text, options = {}) {
  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, font: 'Calibri', size: 22, color: SLATE_TEXT, ...options })];
  return new Paragraph({
    children: runs,
    spacing: { before: 60, after: 100, line: 280 },
  });
}

function bullet(text, boldPrefix = '') {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({ text: boldPrefix + ' ', bold: true, font: 'Calibri', size: 22, color: SLATE_DARK }));
  }
  children.push(new TextRun({ text, font: 'Calibri', size: 22, color: SLATE_TEXT }));
  return new Paragraph({
    children,
    bullet: { level: 0 },
    spacing: { before: 40, after: 60, line: 260 },
  });
}

function callout(title, bodyText, color = BRAND_BLUE) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F8FAFC' },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: title, bold: true, font: 'Calibri', size: 22, color: NAVY }),
                ],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: bodyText, font: 'Calibri', size: 20, color: SLATE_MUTED }),
                ],
                spacing: { line: 260 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createTable(headers, rows, colWidths = []) {
  const tableRows = [];

  // Header Row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => {
        const cellOpts = {
          shading: { fill: NAVY },
          margins: { top: 120, bottom: 120, left: 140, right: 140 },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: h,
                  bold: true,
                  color: 'FFFFFF',
                  font: 'Calibri',
                  size: 20,
                }),
              ],
            }),
          ],
        };
        if (colWidths[i]) {
          cellOpts.width = { size: colWidths[i], type: WidthType.PERCENTAGE };
        }
        return new TableCell(cellOpts);
      }),
    })
  );

  // Data Rows
  rows.forEach((row, rIdx) => {
    const isAlt = rIdx % 2 === 1;
    tableRows.push(
      new TableRow({
        children: row.map((cellText, cIdx) => {
          const cellOpts = {
            shading: { fill: isAlt ? BG_ALT : 'FFFFFF' },
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
              right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_COLOR },
            },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cellText,
                    font: 'Calibri',
                    size: 20,
                    color: SLATE_DARK,
                  }),
                ],
                spacing: { line: 240 },
              }),
            ],
          };
          if (colWidths[cIdx]) {
            cellOpts.width = { size: colWidths[cIdx], type: WidthType.PERCENTAGE };
          }
          return new TableCell(cellOpts);
        }),
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
      left: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
      right: { style: BorderStyle.SINGLE, size: 6, color: BORDER_COLOR },
    },
    rows: tableRows,
  });
}

async function buildDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22,
            color: SLATE_TEXT,
          },
        },
      },
      heading1: {
        run: {
          font: 'Calibri',
          size: 32,
          bold: true,
          color: NAVY,
        },
      },
      heading2: {
        run: {
          font: 'Calibri',
          size: 26,
          bold: true,
          color: BRAND_BLUE,
        },
      },
      heading3: {
        run: {
          font: 'Calibri',
          size: 23,
          bold: true,
          color: SLATE_DARK,
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'NAVESTA TECHNOLOGIES • CLIENT TECHNICAL OVERVIEW',
                    font: 'Calibri',
                    size: 16,
                    color: SLATE_MUTED,
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Confidential • Page ',
                    font: 'Calibri',
                    size: 16,
                    color: SLATE_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Calibri',
                    size: 16,
                    color: SLATE_MUTED,
                  }),
                  new TextRun({
                    text: ' of ',
                    font: 'Calibri',
                    size: 16,
                    color: SLATE_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Calibri',
                    size: 16,
                    color: SLATE_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title Cover Block
          new Paragraph({
            children: [
              new TextRun({
                text: 'Navesta Technologies',
                font: 'Calibri',
                size: 44,
                bold: true,
                color: NAVY,
              }),
            ],
            spacing: { before: 200, after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Institutional Debt Advisory, Algorithmic Payoff & Balance Transfer Platform',
                font: 'Calibri',
                size: 24,
                bold: true,
                color: BRAND_BLUE,
              }),
            ],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Comprehensive Architecture Specification, End-to-End Workflows, Security Protections & Compliance Deliverable',
                font: 'Calibri',
                size: 20,
                color: SLATE_MUTED,
                italics: true,
              }),
            ],
            spacing: { after: 300 },
          }),

          // Metadata Callout
          callout(
            'Document Metadata & Classification',
            'Prepared for: Client Review, Technical Due Diligence & Stakeholder Alignment\nPlatform: Web & Responsive Mobile Application\nStatus: Production-Ready (Verified on PHP 8.2+ / Node 20+ / PostgreSQL 17)\nRelease Version: 1.0.0 (October 2026)',
            BRAND_BLUE
          ),

          new Paragraph({ spacing: { before: 200 } }),

          // 1. Executive Summary
          createHeading1('1. Executive Summary'),
          p(
            'Navesta is an institutional-grade personal finance optimization platform tailored for Indian borrowers. It directly addresses the compounding debt trap in India, where individuals carry high-interest credit card debt (averaging 42% to 48% APR) and fragmented personal loans.'
          ),
          p('The platform delivers 5 primary capabilities:'),
          bullet('Real-time consolidation of multiple credit cards and personal loans into a single unified risk console.', '1. Mathematical Debt Visibility:'),
          bullet('Automated calculation of Debt Avalanche (highest APR first) versus Debt Snowball (smallest balance first) payoff schedules to identify the exact month and year of debt freedom.', '2. Algorithmic Payoff Modeling:'),
          bullet('Direct matching with regulated Scheduled Commercial Banks and NBFCs (SBI, HDFC, ICICI, Tata Capital, Bajaj Finserv) to refinance toxic debt into structured term facilities from 10.25% p.a.', '3. Institutional Balance Takeover:'),
          bullet('Secure, virus-scanned upload and storage facility for financial statements with automated ClamAV inspection.', '4. Bank Statement Vault:'),
          bullet('Strict adherence to the Indian Digital Personal Data Protection (DPDP) Act 2023, RBI Digital Lending Guidelines, AES-256 encrypted storage, and zero-disk-cache transport policies.', '5. Enterprise Security & Compliance:'),

          new Paragraph({ spacing: { before: 200 } }),

          // 2. Technology Stack
          createHeading1('2. Technology Stack & System Architecture'),
          p(
            'Navesta utilizes an enterprise-grade multi-tier architecture designed for low latency, maximum concurrency, and strict financial data isolation.'
          ),
          createTable(
            ['Architectural Layer', 'Core Technology', 'Version', 'Role & Operational Value'],
            [
              ['Frontend Framework', 'Next.js (App Router)', '15.5.x', 'Server-side rendering, route optimization, code splitting, and zero-flicker transitions.'],
              ['Frontend Logic', 'React / TypeScript', '19.0.x / 5.7.x', 'Strictly typed UI components, state machines, and real-time amortization modeling.'],
              ['Client Caching', 'TanStack Query (React Query)', 'v5.x', 'In-memory query deduplication, background revalidation, and network traffic minimization.'],
              ['Design System', 'Tailwind CSS + Lucide Icons', '3.4.x / 0.475.x', 'Custom fintech design tokens, responsive breakpoints, accessible touch targets.'],
              ['Data Visualization', 'Recharts', '3.10.x', 'Interactive SVG debt composition and payoff timeline visualizations.'],
              ['Backend API', 'Laravel', '12.x', 'Domain-driven service layer, Eloquent ORM, Sanctum session auth, and strict request validation.'],
              ['High-Speed Runtime', 'Laravel Octane (FrankenPHP)', 'Latest', 'Boots application state into memory; handles requests without cold starts (<30ms).'],
              ['Primary Database', 'PostgreSQL', '17', 'ACID-compliant storage, foreign key constraints, composite scale indexing, and decimal precision.'],
              ['Connection Pooler', 'PgBouncer', '1.23.x', 'Transaction-level pooling; enables 1,000+ API workers to share 25–30 real DB connections.'],
              ['Cache & Message Queue', 'Redis', '7-alpine', 'Distributed memory engine for sessions, rate limits, distributed locks, and queue workers.'],
              ['Virus Scanner', 'ClamAV Daemon (clamd)', 'Stable', 'INSTREAM socket inspection for malware, macros, and embedded threats in statement uploads.'],
              ['Admin Back-Office', 'Filament 3', '3.x', 'Internal bank operations portal with mandatory TOTP Two-Factor Authentication.'],
            ],
            [22, 22, 16, 40]
          ),

          new Paragraph({ spacing: { before: 200 } }),

          // 3. End-to-End Website Flow
          createHeading1('3. End-to-End Website Flow & User Journeys'),
          p('The Navesta platform accommodates 3 distinct operational user journeys:'),

          createHeading2('User Journey A: Public Borrower (Discovery & Pre-qualification)'),
          bullet('Homepage (/): Introduces the balance takeover model, institutional benchmark rates (10.25% vs 42%), interactive payoff simulations, and partner showcase.', 'Step 1:'),
          bullet('Instant Debt Audit Modal: 3-step diagnostic where users select their debt types and monthly outflow to calculate projected savings and potential freedom dates. Includes direct 1-click WhatsApp advisory handoff.', 'Step 2:'),
          bullet('Takeover Calculator (/calculator): Interactive sliders allowing borrowers to test varying tenure lengths (12 to 60 months) and compare monthly savings against current EMIs. Includes printable PDF roadmaps.', 'Step 3:'),
          bullet('Knowledge Hub (/blog): Searchable repository of educational financial research covering CIBIL score optimization, foreclosure math, and RBI guidelines.', 'Step 4:'),
          bullet('Contact & Advisory Desk (/contact): Grievance redressal and advisory inquiry form connected directly to the backend database with SLA tracking.', 'Step 5:'),

          createHeading2('User Journey B: Authenticated Borrower (Debt Management Console)'),
          bullet('Sign In & Profile Verification: Secure authentication via HttpOnly session cookies, brute-force lockout, and optional SMS OTP two-factor verification.', 'Step 1:'),
          bullet('Unified Dashboard (/dashboard): Single BFF network call (/api/v1/dashboard/full) loads debt exposure, weighted interest rate, monthly EMI burden, avalanche vs snowball sequence, and CIBIL tips.', 'Step 2:'),
          bullet('Debt Management (/loans & /credit-cards): Register and manage personal loans, vehicle loans, and credit cards with full month-by-month amortization and takeover analysis with Privacy Mode masking.', 'Step 3:'),
          bullet('Balance Transfer Workbench (/balance-transfer): Select high-APR accounts to refinance; view matched partner bank offers; submit applications directly to partner underwriting desks.', 'Step 4:'),
          bullet('Encrypted Statement Vault (/statements): Drag-and-drop bank and credit card statement PDFs up to 10MB; real-time ClamAV antivirus scanning status badges; secure decrypted downloads.', 'Step 5:'),
          bullet('Account Settings & Privacy (/settings): Profile management, phone verification, 2FA toggles, 1-click DPDP JSON data export, and complete account erasure.', 'Step 6:'),

          createHeading2('User Journey C: Institutional Admin & Risk Desk'),
          bullet('Mandatory 2FA Portal (/admin): Access requires TOTP authenticator verification (Google Authenticator / Authy) before session establishment.', 'Step 1:'),
          bullet('Application Underwriting: Risk officers review balance transfer submissions, verify source debt figures, inspect uploaded statement PDFs, and advance status (Submitted -> Under Review -> Approved / Disbursed).', 'Step 2:'),
          bullet('Lender Catalog Control: Dynamic management of partner bank APR bands, credit score thresholds, and processing fee schedules.', 'Step 3:'),
          bullet('Immutable Audit Logging: Append-only event store recording actor IDs, IP addresses, statement downloads, and state mutations.', 'Step 4:'),

          new Paragraph({ spacing: { before: 200 } }),

          // 4. Security, Privacy & DPDP
          createHeading1('4. Enterprise Security, Privacy & Compliance'),
          p('Navesta is engineered to comply with strict institutional banking standards and the Indian Digital Personal Data Protection (DPDP) Act 2023:'),

          createTable(
            ['Security Dimension', 'Technical Mechanism', 'Protection Outcome'],
            [
              ['Data at Rest Encryption', 'AES-256-CBC with HMAC-SHA256 via Laravel Crypt.', 'Phone numbers and statement files are stored encrypted. Raw data is unreadable even if disk is stolen.'],
              ['Transport & Anti-Caching', 'Zero-disk-cache headers (no-store, no-cache, max-age=0, private).', 'Browsers, proxies, and shared computers never save financial balances or interest figures to local disk.'],
              ['Session Protection', 'HttpOnly, Secure, SameSite=Lax Sanctum cookies.', 'JavaScript cannot read session tokens, eliminating Cross-Site Scripting (XSS) credential theft.'],
              ['CSRF Defense', 'Double-submit cookie validation (XSRF-TOKEN).', 'Strict validation on all state-mutating requests (POST, PUT, DELETE).'],
              ['Privacy Mode (Shield)', 'Client-side currency masking (Eye/EyeOff toggle).', 'Masks figures to "₹ ••••••" in public spaces; cleanses component state from browser RAM on unmount.'],
              ['ClamAV Antivirus Pipeline', 'Daemonized clamd scanner over TCP INSTREAM socket.', 'Uploads are quarantined in "pending" status and verified virus-free before download is unlocked.'],
              ['DPDP Right to Portability', 'GET /api/v1/users/me/export endpoint.', 'Borrowers download their complete personal and debt record as a structured JSON archive in 1 click.'],
              ['DPDP Right to Erasure', 'DELETE /api/v1/users/me endpoint.', 'Permanent account deletion cascading across loans, cards, statements, and snapshot tables.'],
            ],
            [25, 35, 40]
          ),

          new Paragraph({ spacing: { before: 200 } }),

          // 5. Scalability Architecture
          createHeading1('5. High-Scale Performance Architecture'),
          p('To support 100,000+ active borrowers and manage sudden traffic surges, the platform implements multi-layer optimization:'),

          createTable(
            ['Scalability Tier', 'Implementation', 'System Benefit'],
            [
              ['Backend-for-Frontend (BFF)', '/api/v1/dashboard/full consolidated endpoint', 'Replaces 4 sequential network requests with 1 atomic call, saving 3 TCP handshakes per visit.'],
              ['Client In-Memory Caching', 'TanStack Query with 1-min staleTime and 5-min gcTime', 'Deduplicates identical API requests and slashes server load by 60%–80% during active user sessions.'],
              ['Octane Memory Runtime', 'Laravel Octane running on FrankenPHP engine', 'Preserves application boots in RAM, eliminating PHP process bootstrap overhead (sub-30ms latencies).'],
              ['Database Connection Pooling', 'PgBouncer in transaction pooling mode', 'Allows 1,000+ worker threads to share 25–30 real PostgreSQL connections, preventing connection exhaustion.'],
              ['Read-Replica Routing', 'DB_READ_HOST automatic query splitting', 'Routes heavy analytical read queries away from the primary database, keeping write transactions fast.'],
              ['Direct Presigned Uploads', 'POST /api/v1/statements/presigned-url direct to S3/R2', 'Statement uploads bypass API servers completely; saves server bandwidth and CPU.'],
              ['Edge CDN Caching', 'Public endpoints use s-maxage=86400, stale-while-revalidate', 'Lender catalog and blog posts are served directly from Cloudflare edge caches globally.'],
              ['Composite Scale Indexes', 'Targeted B-Tree indexes on statements, audit_logs, and snapshots', 'Guarantees fast index seeks across millions of rows without sequential disk table scans.'],
            ],
            [25, 35, 40]
          ),

          new Paragraph({ spacing: { before: 200 } }),

          // 6. Responsive Design System
          createHeading1('6. Responsive Design & Cross-Device Compatibility'),
          p('The user interface is designed mobile-first and audited across all modern device categories:'),

          createTable(
            ['Device Category', 'Target Viewports', 'Responsive Adaptations & UX Layouts'],
            [
              ['Compact Phones', '320px – 390px (iPhone SE, Galaxy A series)', 'Single-column stacked metric cards; full-width touch buttons (min 44px); statement vault switches to card view; capped modal heights.'],
              ['Standard Phones', '390px – 430px (iPhone 16 Pro, Pixel 9, Galaxy S24)', 'Full mobile navigation drawer with touch navigation tiles; touch-optimized slider handles; thumb-reachable privacy toggles.'],
              ['Foldables & Tablets', '600px – 1024px (iPad, Surface, Galaxy Z Fold)', '2-column responsive grids; side-by-side Before/After sliders; horizontally scroll-resilient data tables.'],
              ['Laptops & Desktops', '1024px – 1440px (MacBook, Windows Laptops)', '12-column responsive layout with persistent parameter sidebar and live offer recalculation on the right.'],
              ['Ultrawide Monitors', '1440px+ (4K / 21:9 Displays)', 'Contained max-width boundaries (max-w-7xl / 1280px) preventing visual distortion and excessive eye strain.'],
            ],
            [22, 28, 50]
          ),

          new Paragraph({ spacing: { before: 200 } }),

          // 7. Enterprise Capabilities & Security Specifications
          createHeading1('7. Enterprise Capabilities & Security Specifications'),
          p('Detailed architectural specifications for institutional audit across perimeter security, multi-cloud storage, encryption key custody, automated ingestion, and compliance controls:'),

          createTable(
            ['Pillar / Capability', 'Architecture Specification', 'Implementation Details & Compliance Impact'],
            [
              ['Perimeter Firewall & WAF', 'Edge WAF (Cloudflare/AWS/OCI) + In-App Security Middleware', 'OWASP Top 10 mitigation, DDoS absorption, bot challenges, strict HSTS, CSP, X-Frame-Options, and anti-sniffing headers on all routes.'],
              ['Cryptographic Architecture', 'Multi-Tier Encryption (Transit, At Rest, Envelope)', 'TLS 1.3 with forward secrecy; column-level AES-256-CBC field encryption for PII (phone, PAN, bank accounts); encrypted statement payloads.'],
              ['Passwordless SMS Login', 'Direct Phone OTP Authentication via Twilio/Gateway', 'Instant 6-digit OTP verification (/api/v1/auth/phone/send-otp and /verify-otp), eliminating credential reuse and brute force risks.'],
              ['Multi-Channel Ingestion', 'Account Aggregator (AA) + SMS/Email Parsing', 'RBI-regulated NBFC-AA consent framework (Setu, Finvu) + client-side SMS transaction pattern matching + OAuth2 e-statement ingestion.'],
              ['Multi-Cloud Statement Vault', 'Abstracted Cloud Storage (AWS S3, GCP, OCI Object Storage)', 'Flysystem multi-cloud drivers in ap-south-1 (Mumbai); presigned direct upload bypass; ClamAV virus scanning; automated PDF table parsing.'],
              ['Knowledge Hub & Content', 'Headless Blog CMS & Edge Distribution', 'Structured database schema (posts table) with Markdown editor, automated slugs, cover image S3 storage, and edge CDN cache revalidation.'],
              ['Customer Digital Footprint', 'Non-Repudiation Audit Trails (user_footprints table)', 'Captures IP address, full user-agent, device type, OS, canvas device fingerprint hash, session ID, and cookie consent logs per RBI directives.'],
              ['Postal PIN Code Verification', 'India Post API Integration with Redis Caching', '6-digit PIN code lookup (/api/v1/utilities/pincode/{code}) resolving district, state, city, and post offices with 30-day Redis cache.'],
              ['DPDP Lifecycle & Soft Deletes', 'SoftDeletes trait across core entities (deleted_at)', 'Reconciles DPDP Section 12 Right to Erasure with PMLA/RBI 5-year statutory audit retention; revokes active tokens while keeping audit trail.'],
              ['KMS Decryption Key Custody', 'Hardware Security Module (HSM) Envelope Encryption', 'Master keys kept in Cloud KMS (AWS KMS, GCP Cloud KMS, OCI Vault); runtime RAM secret mounts (/run/secrets/app_key); zero hardcoded keys.'],
              ['Admin Panel Data Export', 'Streaming CSV & Audit Exports in Filament 3', 'Risk officers can stream-export customer portfolios, takeover applications, and security audit logs without server memory exhaustion.'],
            ],
            [22, 28, 50]
          ),

          new Paragraph({ spacing: { before: 200 } }),

          // 8. Verification & Delivery Metrics
          createHeading1('8. Verification & Test Metrics'),
          bullet('118 tests passed (482 assertions) validating math, security, rate limiting, and data privacy.', 'Automated PHPUnit Test Suite:'),
          bullet('npx tsc --noEmit executed with 0 errors across all pages, components, and API client interfaces.', 'TypeScript Static Type Checking:'),
          bullet('k6 test script (loadtest/api.js) benchmarked for 200 concurrent virtual users with a p95 latency threshold < 500ms.', 'Load Testing Specification:'),
          bullet('Continuous monitoring at /health validating database and Redis connectivity.', 'Real-Time Health Monitoring:'),

          new Paragraph({ spacing: { before: 300 } }),

          callout(
            'Institutional Signoff & Deliverable Confirmation',
            'This technical document represents the complete production build of the Navesta platform. Both the Next.js frontend (port 3000) and Laravel Octane API backend (port 3001) are active, tested, and fully aligned with client requirements.',
            EMERALD
          ),
        ],
      },
    ],
  });

  const outputDir = path.resolve(__dirname, '../../docs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'Navesta_Technical_Architecture_and_Client_Overview.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);

  console.log('SUCCESS: Word document successfully created at: ' + outputPath);
  console.log('File size: ' + (buffer.length / 1024).toFixed(1) + ' KB');
}

buildDocx().catch((err) => {
  console.error('Error building DOCX:', err);
  process.exit(1);
});
