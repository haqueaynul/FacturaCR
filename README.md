# Costa Rica Factura Electrónica Hub (Ministerio de Hacienda v4.3 & v4.4)

An enterprise-grade, full-stack platform for **Costa Rica Electronic Invoicing and Supplier Invoice Reception (Recepción de Comprobantes)** integrating directly with the **Ministerio de Hacienda (Dirección General de Tributación - DGT)** APIs. 

Built with **React 19, TypeScript, Tailwind CSS, Express, and Node.js**, this application supports both legacy **v4.3 (Resolution DGT-R-033-2019)** and modernized **v4.4 (Resolution DGT-R-028-2023 / TRIBU-CR)** specifications, XAdES-EPES cryptographic signing, automated sandbox testing, multi-user role management (Accountant, Lawyer, Admin), and an AES-256-GCM encrypted key vault.

---

## 1. How to Run This App on a Local Machine

### Prerequisites
- **Node.js**: v18.0.0 or higher (Node 20+ LTS recommended)
- **npm**: v9.0.0 or higher
- **Git**

### Installation Steps

1. **Clone or Download the Repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the provided `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and verify or customize the variables (see Section 3 below).

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The backend Express server and Vite frontend will mount on **port 3000**.

5. **Open in Browser:**
   Navigate to:
   ```
   http://localhost:3000
   ```

6. **Production Build & Execution:**
   To compile and run in production mode:
   ```bash
   npm run build
   npm run start
   ```

---

## 2. Core Functionality & Features

### A. Electronic Invoicing Engine (v4.3 & v4.4 Compliant)
- **Supports All Official Document Types**:
  - `01`: Factura Electrónica (FE)
  - `02`: Nota de Débito Electrónica (ND)
  - `03`: Nota de Crédito Electrónica (NC)
  - `04`: Tiquete Electrónico (TE)
  - `08`: Factura Electrónica de Compra (FEC)
  - `09`: Factura Electrónica de Exportación (FEE)
  - `10`: Recibo Electrónico de Pago (REP - introduced in v4.4 for credit installment payments)
- **50-Digit Numeric Clave Generator**: Automatically generates and parses compliant 50-digit Claves according to Hacienda rules:
  `[506][DD][MM][YY][12-digit Cedula][20-digit Consecutivo][1-digit Situación][8-digit Security Code]`
- **Official CABYS Catalog Integration**: Searchable database of 13-digit Central Bank (BCCR) & Hacienda goods and service codes with automated VAT rate mapping (13%, 8%, 4%, 2%, 1%, 0%).
- **Multi-Currency**: Supports Costa Rican Colones (`CRC ₡`) and US Dollars (`USD $`) with official Central Bank exchange rate handling.

### B. Digital Signing Engine (XAdES-EPES PKCS#12)
- Implements **Costa Rica Law 8454 (Digital Certificates and Signatures)**.
- Ingests standard `.p12` / `.pfx` software cryptographic containers with 4-digit PIN authentication.
- Produces canonicalized XML (`C14N 20010315`), computes `SHA-256` digest values, generates `SignedProperties`, and appends standard `<ds:Signature>` elements referencing Hacienda's official signature policy URI.

### C. Hacienda Sandbox Automation & Asynchronous Polling
- **Dual Sandbox Modes**:
  - **Smart Sandbox Simulator**: 100% compliant local emulator for instant testing without requiring ATV credentials.
  - **Live ATV Sandbox (Staging)**: Connects via proxy to `idp.comprobanteselectronicos.go.cr` and `api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/`.
- **Asynchronous Status Poller**: Polls Hacienda until the document reaches `aceptado` or `rechazado`, and captures the official `<MensajeHacienda>` response XML.
- **Automated Retry Worker**: Automatic retry with exponential backoff and jitter for transient HTTP 503 network errors.

### D. B2B Invoice Reception (Recepción de Comprobantes)
- Generates and signs **Mensaje Receptor** XML payloads:
  - `05`: Aceptación Total (Full Acceptance to deduct input VAT credit)
  - `06`: Aceptación Parcial (Partial Acceptance)
  - `07`: Rechazo Total (Total Rejection)
- Enforces the **8-working-day legal deadline** from invoice receipt under Law 9635.

### E. Bulk Batch Processing
- High-throughput batch generator capable of creating, digitally signing, and streaming 10 to 100 invoices in parallel.

### F. Multi-User Roles & Professional Desks
- **Certified Public Accountant (CPA) Desk**:
  - Formulario D-104 VAT return calculation (Débito Fiscal vs. Crédito Fiscal).
  - Official Sales Ledger (*Libro de Ventas*) and Purchases Ledger (*Libro de Compras*).
  - Proportionality factor and tax credit deductibility audits.
- **Legal Counsel / Lawyer Desk**:
  - Law 8454 compliance audit of cryptographic certificates.
  - Corporate *Personería Jurídica* registration standing and expiry tracking.
  - Legal justifications for invoice annulments via Credit/Debit Notes.
- **Admin Enterprise Hub**:
  - Multi-tenant client company switching and onboarding.
  - Global consolidated tax liability and audit package exports.

### G. Security & Cryptographic Vault (AES-256-GCM)
- Authenticated **AES-256-GCM** encryption with `scrypt` key derivation for all stored passwords, `.p12` certificates, and taxpayer records. Zero plaintext storage of tax credentials.

### H. Internationalization & User Experience
- **Bilingual Interface**: Full toggle between **English (EN)** and **Spanish (ES)** across all headers, forms, validation hints, modals, notifications, and reports.
- **Theme Switcher**: Instant toggle between Dark Theme and Bright Theme.
- **Interactive Version Switcher**: 1-click switcher between **v4.3** and **v4.4** with an interactive side-by-side comparison modal.

---

## 3. Environment Variables Configuration

All application configuration variables are loaded from the root `.env` file (copied from `.env.example`).

```ini
# ==============================================================================
# SERVER & APP CONFIGURATION
# ==============================================================================
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# ==============================================================================
# CRYPTOGRAPHIC VAULT SECURITY
# ==============================================================================
# Master secret used by scrypt to derive the 256-bit key for AES-256-GCM vault encryption.
# In production, set this to a strong, high-entropy 64+ character string.
ENCRYPTION_SECRET=CR_HACIENDA_VAULT_KEY_2026_SUPER_SECRET

# ==============================================================================
# MINISTERIO DE HACIENDA IDP (OAUTH2 KEYCLOAK TOKEN ENDPOINT)
# ==============================================================================
# Sandbox / Staging (default):
HACIENDA_IDP_URL=https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token

# Production (uncomment when deploying to production with live tax credentials):
# HACIENDA_IDP_URL=https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token

# ==============================================================================
# MINISTERIO DE HACIENDA RECEPCIÓN API (DOCUMENT SUBMISSION & POLLING)
# ==============================================================================
# Sandbox / Staging (default):
HACIENDA_API_URL=https://api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/

# Production (uncomment when deploying to production):
# HACIENDA_API_URL=https://api.comprobanteselectronicos.go.cr/recepcion/v1/

# ==============================================================================
# QR VERIFICATION URL
# ==============================================================================
# Base URL used to generate official verification QR code payloads for printed/PDF invoices.
# Scanning the QR code points the consumer or auditor directly to the official tax portal.
QR_VERIFICATION_URL=https://tribunet.hacienda.go.cr/docs/
```

### Where to Change Between Sandbox and Production
- To test with official staging credentials, keep `HACIENDA_IDP_URL` pointing to `rut-stag` and `HACIENDA_API_URL` pointing to `recepcion-sandbox/v1/`.
- In the application UI, open the **Sandbox Settings Modal** (Gear icon in top navigation) to toggle between the **Smart Sandbox Simulator** (instant mock) and **Live ATV Sandbox** (HTTP calls through to Hacienda staging servers).

---

## 4. Useful npm Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Express backend and Vite frontend with hot reload disabled on port 3000. |
| `npm run build` | Compiles the production React application into `/dist`. |
| `npm run start` | Executes the production Node.js Express server. |
| `npm run lint` | Runs TypeScript type checker (`tsc --noEmit`) to validate types. |
| `npm run clean` | Deletes build artifacts and `/dist`. |

---

## 5. Technical Support & Regulatory Standards
- **Dirección General de Tributación (DGT)**: [https://hacienda.go.cr](https://hacienda.go.cr)
- **Resolución DGT-R-033-2019**: Electronic Invoicing Format v4.3.
- **Resolución DGT-R-028-2023**: Electronic Invoicing & Reception Format v4.4 (TRIBU-CR).
- **Ley 8454**: Law on Certificates, Digital Signatures and Electronic Documents of Costa Rica.
- **Ley 9635**: Law for Strengthening Public Finances (Value Added Tax - IVA).

---

## 6. REST API Reference & Developer Documentation

The platform provides a comprehensive REST API and in-app developer documentation explorer:
- **Interactive In-App API Docs**: Click the **`API Docs`** button (`</>` icon) in the top navigation bar to open the live interactive API Explorer. You can search endpoints, copy cURL commands, test live requests, and download the OpenAPI 3.0 specification.
- **Complete Markdown Specification**: See [API_DOCS.md](./API_DOCS.md) for full endpoint specifications, request/response JSON payloads, status codes, and 50-digit Clave / XAdES cryptographic algorithms.
- **Technical & Compliance Guide**: See [DOCUMENTATION.md](./DOCUMENTATION.md) for functional workflows, Formulario D-104 tax reconciliation, and 8-working-day supplier invoice legal remedies.

