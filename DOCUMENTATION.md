# Technical & Functional Documentation: Costa Rica Factura Electrónica Hub

This comprehensive guide covers the operational workflows, technical architectures, data structures, cryptographic standards, and regulatory compliance rules governing the Costa Rica **Ministerio de Hacienda (Dirección General de Tributación - DGT)** electronic invoicing ecosystem (v4.3 & v4.4).

---

## Table of Contents
1. [How to Use This Application](#1-how-to-use-this-application)
2. [How to Generate Documents & Required Values](#2-how-to-generate-documents--required-values)
3. [Digital Signing with Cryptographic Key (XAdES-EPES PKCS#12)](#3-digital-signing-with-cryptographic-key-xades-epes)
4. [API Authentication & Submission](#4-api-authentication--submission)
5. [Asynchronous Processing & Validation](#5-asynchronous-processing--validation)
6. [B2B Acceptance / Rejection (Recepción de Comprobantes)](#6-b2b-acceptance--rejection-recepción-de-comprobantes)
7. [REST API Reference & Developer Integration](#7-rest-api-reference--developer-integration)

---

## 1. How to Use This Application

### A. Navigation & Main Layout
The interface is structured into a top navigation bar and 7 specialized functional tabs:
1. **Top Header**:
   - **Language Toggle (`EN` / `ES`)**: Switches all user-facing texts, hints, form labels, and notifications between English and Spanish.
   - **Theme Toggle (`Sun` / `Moon`)**: Switches between Dark Theme (midnight slate) and Bright Theme (clean white/gray).
   - **Schema Switcher (`[ v4.3 | v4.4 ]`)**: Instantly toggles the active company's e-invoicing schema.
   - **Company Selector**: Switch between enrolled client companies or add a new one.
   - **User Menu**: View current user session, switch profiles, or sign out.
   - **Sandbox Settings (Gear icon)**: Configure ATV credentials, upload `.p12` certificates, or run preconfigured test scenarios.
   - **Notifications Drawer (Bell icon)**: Real-time alerts for document status changes and background events.

2. **Main Tabs**:
   - **1. Emisión & Cola (Invoicing & Queue)**: Local invoice generation, 50-digit Clave preview, CABYS catalog search, and real-time submission queue with XML viewer.
   - **2. Recepción B2B (Supplier Invoice Reception)**: Process incoming supplier invoices and submit acceptance messages (`05`, `06`, `07`).
   - **3. Lotes Masivos (Bulk Processing)**: Generate and transmit batches of 10 to 100 invoices concurrently.
   - **4. Auditoría (Audit Trail)**: 10-step regulatory audit log with CSV and JSON export.
   - **Accountant Desk**: Certified Public Accountant workspace with Formulario D-104 VAT return calculation, sales ledgers, and credit proportionality audits.
   - **Legal Counsel Desk**: Law 8454 compliance audits, certificate expiry tracking, and legal justifications for invoice annulments.
   - **Admin Enterprise Hub**: Multi-company directory, accountant/lawyer company assignments, and consolidated financial reports.

### B. User Roles & Permissions
- **Admin (`admin`)**: Unrestricted access to all companies, documents, audit logs, and cross-company accounting reports.
- **Accountant (`accountant`)**: Manages tax reconciliation, Formulario D-104 returns, and client sales/purchases ledgers for assigned companies.
- **Lawyer (`lawyer`)**: Audits PKCS#12 certificate validity, verifies *Personería Jurídica* status, and validates legal grounds for Credit/Debit Note cancellations.

---

## 2. How to Generate Documents & Required Values

### A. Document Types Supported
| Code | Official Name | Description |
| :--- | :--- | :--- |
| `01` | **Factura Electrónica (FE)** | Standard commercial sale between taxable businesses/individuals. |
| `02` | **Nota de Débito (ND)** | Increases the value of an existing invoice (e.g. late fees, missing charges). |
| `03` | **Nota de Crédito (NC)** | Annulls or partially discounts a previously issued electronic invoice. |
| `04` | **Tiquete Electrónico (TE)** | B2C retail ticket issued to consumers when tax credit deduction is not requested. |
| `08` | **Factura Electrónica de Compra (FEC)** | Issued by a buyer when purchasing from a vendor in the Simplified Tax Regime. |
| `09` | **Factura Electrónica de Exportación (FEE)** | Issued for goods or services exported outside Costa Rica (0% VAT exempt). |
| `10` | **Recibo Electrónico de Pago (REP)** | Introduced in **v4.4**; documents installment and partial payments made to credit sales. |

### B. Required Fields for Document Generation

#### 1. Header Information
- **`codigoActividad`** *(string, 6 digits)*: Official economic activity code registered with the DGT (e.g., `620101` for custom software development).
- **`moneda`** *(string)*: Either `CRC` (Colones) or `USD` (US Dollars).
- **`tipoCambio`** *(decimal)*: Official Central Bank exchange rate. Must be `1.0` if currency is `CRC`.
- **`condicionVenta`** *(string, 2 digits)*:
  - `01`: Contado (Cash / Immediate payment)
  - `02`: Crédito (Credit sale; requires `plazoCredito` in days)
  - `03`: Consignación
  - `99`: Otros
- **`plazoCredito`** *(integer, required if `condicionVenta = '02'`)*: Credit payment terms in days (e.g., 30, 60, 90).
- **`medioPago`** *(string, 2 digits)*:
  - `01`: Efectivo (Cash)
  - `02`: Tarjeta (Credit/Debit Card)
  - `03`: Cheque
  - `04`: Transferencia Bancaria
  - `05`: **SINPE Móvil** (Dedicated code in v4.4; highly recommended for Costa Rica mobile payments)

#### 2. Issuer (`Emisor`) & Customer (`Receptor`)
- **`nombre`**: Legal corporate name or full personal name.
- **`tipoIdentificacion`** *(string, 2 digits)*:
  - `01`: Cédula Física (9 digits)
  - `02`: Cédula Jurídica (10 digits)
  - `03`: DIMEX (Foreign resident identification, 11-12 digits)
  - `04`: NITE (Tax identification for special entities, 10 digits)
- **`numeroIdentificacion`** *(string)*: Tax identification number without hyphens or spaces.
- **`correo`**: Customer email address where the signed XML and PDF representation will be delivered.

#### 3. Line Items (`LineaDetalle`)
Each invoice line requires:
- **`numeroLinea`**: Sequential line number starting at 1.
- **`codigoCabys`** *(string, 13 digits)*: Official Catálogo de Bienes y Servicios code published by the Central Bank (BCCR).
- **`detalle`**: Clear commercial description of the product or service.
- **`cantidad`**: Decimal quantity (up to 3 decimal places).
- **`unidadMedida`**: Unit of measurement (e.g. `Sp` for professional services, `Unid` for units, `kg`, `m`).
- **`precioUnitario`**: Unit price excluding tax (up to 5 decimal places).
- **`montoDescuento`**: Commercial discount (if applicable).
- **`codigoTarifaIva` & `tarifaIva`**:
  - `01`: 0% Exento
  - `02`: 1% Reduced Rate (Basic food basket, veterinary goods)
  - `03`: 2% Reduced Rate (Medicines, private education)
  - `04`: 4% Reduced Rate (Private health services, flight tickets)
  - `07`: 8% Reduced Rate (Transitory tourism services under Law 9882)
  - `08`: 13% General VAT Rate (Standard commercial rate)

---

### C. 50-Digit Numeric Clave Architecture
The **Clave** is the unique identifier for every electronic document in Costa Rica. It is strictly 50 numeric digits structured as follows:

$$\text{Clave} = \underbrace{506}_{\text{Country}} \, \underbrace{\text{DDMMYY}}_{\text{Date}} \, \underbrace{\text{CCCCCCCCCCCC}}_{12\text{-digit Cedula}} \, \underbrace{\text{SSSTTTTTDDNNNNNNNNNN}}_{20\text{-digit Consecutivo}} \, \underbrace{1}_{\text{Situación}} \, \underbrace{\text{SSSSSSSS}}_{8\text{-digit Security Code}}$$

- **Country Code (3 digits)**: Always `506` for Costa Rica.
- **Date (6 digits)**: Day (`DD`), Month (`MM`), Year (`YY`) in Costa Rica local time (UTC-6).
- **Taxpayer ID (12 digits)**: Issuer cédula left-padded with zeros (e.g., `003101123456`).
- **Consecutive Number (20 digits)**:
  - Branch / Sucursal (3 digits, e.g. `001`)
  - Terminal / POS (5 digits, e.g. `00001`)
  - Document Type (2 digits, e.g. `01` for FE)
  - Sequential Number (10 digits, e.g. `0000000001`)
- **Document Situation (1 digit)**:
  - `1`: Normal transmission
  - `2`: Contingency transmission (no internet during sale)
  - `3`: Without internet connection
- **Security Code (8 digits)**: Random 8-digit numeric code to ensure uniqueness and prevent predictability.

---

## 3. Digital Signing with Cryptographic Key (XAdES-EPES)

Under **Costa Rica Law 8454**, every electronic document submitted to Hacienda must be signed with a qualified digital certificate issued by an accredited Certification Authority (CA), such as BCCR (SINPE), Banco Nacional, or authorized private CAs.

### A. Technical Signature Specification
- **Format**: XML Advanced Electronic Signatures - Explicit Policy Electronic Signatures (**XAdES-EPES**), enveloping profile according to ETSI TS 101 903 v1.3.2.
- **Container**: PKCS#12 (`.p12` / `.pfx`) protected by a 4-digit numeric PIN.
- **Digest Algorithm**: `SHA-256` (`http://www.w3.org/2001/04/xmlenc#sha256`).
- **Canonicalization**: Canonical XML 1.0 without comments (`http://www.w3.org/TR/2001/REC-xml-c14n-20010315`).
- **Signature Algorithm**: RSA with SHA-256 (`http://www.w3.org/2001/04/xmldsig-more#rsa-sha256`).
- **Signature Policy Identifier**:
  - v4.3 Policy URI: `https://www.hacienda.go.cr/ATV/politicaFirma/politicaFirmaFacturaElectronicaV4.3.pdf`
  - Policy Hash: `mQ9w7Uo2v3hR8f5Yy4t1k==`

### B. Structure of the `<ds:Signature>` Block
The signature block is embedded directly inside the root element before the closing tag:

```xml
<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="Signature-xxxx">
  <ds:SignedInfo>
    <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
    <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
    <ds:Reference Id="Reference-Doc" URI="">
      <ds:Transforms>
        <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
      </ds:Transforms>
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
      <ds:DigestValue>Base64Sha256DigestOfInvoiceXml==</ds:DigestValue>
    </ds:Reference>
    <ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#SignedProperties">
      <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
      <ds:DigestValue>Base64Sha256DigestOfSignedProperties==</ds:DigestValue>
    </ds:Reference>
  </ds:SignedInfo>
  <ds:SignatureValue>Base64RsaSha256SignatureValue==</ds:SignatureValue>
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>Base64PublicCertificateData==</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
  <ds:Object Id="XadesObject">
    <xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#Signature">
      <xades:SignedProperties Id="SignedProperties">
        <xades:SignedSignatureProperties>
          <xades:SigningTime>2026-10-01T09:30:00-06:00</xades:SigningTime>
          <xades:SigningCertificate>
            <xades:Cert>
              <xades:CertDigest>
                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
                <ds:DigestValue>CertDigest==</ds:DigestValue>
              </xades:CertDigest>
              <xades:IssuerSerial>
                <ds:X509IssuerName>CN=CA SINPE - PERSONA JURIDICA v2, O=BCCR, C=CR</ds:X509IssuerName>
                <ds:X509SerialNumber>154823901</ds:X509SerialNumber>
              </xades:IssuerSerial>
            </xades:Cert>
          </xades:SigningCertificate>
          <xades:SignaturePolicyIdentifier>
            <xades:SignaturePolicyId>
              <xades:SigPolicyId>
                <xades:Identifier>https://www.hacienda.go.cr/ATV/politicaFirma/politicaFirmaFacturaElectronicaV4.3.pdf</xades:Identifier>
                <xades:Description>Política de Firma Factura Electrónica Ministerio de Hacienda v4.3</xades:Description>
              </xades:SigPolicyId>
              <xades:SigPolicyHash>
                <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" />
                <ds:DigestValue>mQ9w7Uo2v3hR8f5Yy4t1k==</ds:DigestValue>
              </xades:SigPolicyHash>
            </xades:SignaturePolicyId>
          </xades:SignaturePolicyIdentifier>
        </xades:SignedSignatureProperties>
      </xades:SignedProperties>
    </xades:QualifyingProperties>
  </ds:Object>
</ds:Signature>
```

---

## 4. API Authentication & Submission

Ministerio de Hacienda secures its electronic invoicing APIs using **Keycloak Identity Provider (IDP)** with OAuth 2.0 Password Grant flow.

### Step 1: Obtain OAuth 2.0 Bearer Token
- **Endpoint**:
  - Sandbox: `https://idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token`
  - Production: `https://idp.comprobanteselectronicos.go.cr/auth/realms/rut/protocol/openid-connect/token`
- **HTTP Method**: `POST`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Parameters**:
  - `client_id`: `api-stag` (in sandbox) or `api-prod` (in production)
  - `grant_type`: `password`
  - `username`: Taxpayer's ATV API username (e.g. `cpf-02-3101123456@stag.comprobanteselectronicos.go.cr`)
  - `password`: Taxpayer's ATV API password

#### Expected Response (JSON):
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "refresh_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "bearer"
}
```

---

### Step 2: Submit Document to Recepción Endpoint
Once digitally signed, the complete XML string is base64-encoded and transmitted as a JSON payload:

- **Endpoint**:
  - Sandbox: `https://api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/recepcion/`
  - Production: `https://api.comprobanteselectronicos.go.cr/recepcion/v1/recepcion/`
- **HTTP Method**: `POST`
- **Headers**:
  - `Authorization`: `Bearer <access_token>`
  - `Content-Type`: `application/json`

#### Submission Payload (JSON):
```json
{
  "clave": "50601102600310112345600100001010000000001198765432",
  "fecha": "2026-10-01T09:30:00-06:00",
  "emisor": {
    "tipoIdentificacion": "02",
    "numeroIdentificacion": "3101123456"
  },
  "receptor": {
    "tipoIdentificacion": "02",
    "numeroIdentificacion": "3101987654"
  },
  "comprobanteXml": "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48RmFjdHVyYUVsZWN0cm9uaWNh..."
}
```

#### Hacienda Response:
- **HTTP 202 Accepted**: Document was queued for asynchronous processing.
- **Location Header**: Contains the status polling URL (`/recepcion-sandbox/v1/recepcion/{clave}`).

---

## 5. Asynchronous Processing & Validation

Because Hacienda validates certificates, CABYS catalogs, tax mathematics, and duplicate claves asynchronously to handle national volume, the submission response (`202 Accepted`) does **not** signify that the invoice is legally valid yet.

```
[Local System] ---> (POST /recepcion) ---> [Hacienda Queue] (Returns 202 Accepted)
                                                  |
                                                  v
                                      [Hacienda Validation Engine]
                                      - Validates XAdES signature
                                      - Verifies active cédula
                                      - Validates CABYS vs IVA rate
                                      - Checks duplicate Clave
                                                  |
[Local System] <--- (GET /recepcion/{clave}) <----+
Returns 200 OK with <MensajeHacienda> (ind-estado: 'aceptado' or 'rechazado')
```

### Step 1: Query Document Status
- **Endpoint**: `GET /recepcion-sandbox/v1/recepcion/{clave}`
- **Headers**: `Authorization: Bearer <access_token>`

#### Response Statuses:
- **`ind-estado` = `procesando`**: Document is still being validated in Hacienda's queue. Poll again after 2-5 seconds.
- **`ind-estado` = `aceptado`**: Document is officially authorized and registered in the national tax repository.
- **`ind-estado` = `rechazado`**: Document was rejected due to a regulatory violation.

### Step 2: The `<MensajeHacienda>` XML
When validation finishes, Hacienda returns an official signed XML receipt (`respuesta-xml`):

```xml
<?xml version="1.0" encoding="utf-8"?>
<MensajeHacienda xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.3/mensajeHacienda">
  <Clave>50601102600310112345600100001010000000001198765432</Clave>
  <NombreEmisor>SERVICIOS TECNOLÓGICOS DEL VALLE S.A.</NombreEmisor>
  <TipoIdentificacionEmisor>02</TipoIdentificacionEmisor>
  <NumeroCedulaEmisor>3101123456</NumeroCedulaEmisor>
  <NombreReceptor>CORPORACIÓN INTERNACIONAL S.A.</NombreReceptor>
  <TipoIdentificacionReceptor>02</TipoIdentificacionReceptor>
  <NumeroCedulaReceptor>3101987654</NumeroCedulaReceptor>
  <Mensaje>1</Mensaje> <!-- 1 = Aceptado, 3 = Rechazado -->
  <DetalleMensaje>Comprobante electrónico aceptado y registrado en el repositorio oficial de la Dirección General de Tributación.</DetalleMensaje>
  <MontoTotalImpuesto>32500.00000</MontoTotalImpuesto>
  <TotalFactura>282500.00000</TotalFactura>
</MensajeHacienda>
```

### Step 3: Automated Exponential Backoff Retry Logic
When transient HTTP 500, 502, 503, or network timeout errors occur, this platform applies exponential backoff:

$$\text{Delay}(n) = \min\left(60, \, 4 \times 2^{n-1}\right) + \text{jitter}$$

where $n$ is the retry attempt (1 through 5). If all 5 attempts fail, the document is moved to `error_envio` for manual inspection in the Audit Trail.

---

## 6. B2B Acceptance / Rejection (Recepción de Comprobantes)

Under **Costa Rica Law 9635**, registered businesses that receive electronic invoices from vendors **must** submit a formal digital confirmation message (*Mensaje Receptor*) to Hacienda to claim the input VAT credit on their Formulario D-104 tax return.

### A. The 8-Working-Day Rule
- **Deadline**: The buyer has exactly **8 working days** from the invoice emission date to submit the Mensaje Receptor.
- **Consequence of missing deadline**: If no message is sent, the expense cannot legally be deducted from corporate income tax or used as VAT tax credit.

### B. Message Types (`tipoMensaje`)
- **`05` - Aceptación Total**: Confirms the purchase in full and claims 100% of the allowed input VAT credit.
- **`06` - Aceptación Parcial**: Partially accepts goods/services (e.g., damaged items returned).
- **`07` - Rechazo Total**: Entirely rejects the invoice (e.g., unauthorized order, wrong billing name, incorrect pricing).

### C. Tax Condition Codes (`CondicionImpuesto`)
The buyer must specify how the VAT paid will be deducted:
- `01`: Genera crédito IVA (General commercial tax credit applied against output VAT).
- `02`: Genera crédito parcial del IVA (Proportionality applied for mixed taxable and exempt activities).
- `03`: Bienes de Capital (Capital assets tax credit).
- `04`: Gasto corriente no genera crédito (Expense for non-creditable operational cost).
- `05`: Proporcionalidad (Full annual VAT proportionality factor).

### D. Submitting the `<MensajeReceptor>`
The platform generates, digitally signs with XAdES-EPES, and submits the XML:

```xml
<?xml version="1.0" encoding="utf-8"?>
<MensajeReceptor xmlns="https://cdn.comprobanteselectronicos.go.cr/xml-schemas/v4.3/mensajeReceptor">
  <Clave>50601102600310112345600100001010000000001198765432</Clave>
  <NumeroCedulaEmisor>3101123456</NumeroCedulaEmisor>
  <FechaEmisionDoc>2026-10-01T09:30:00-06:00</FechaEmisionDoc>
  <Mensaje>1</Mensaje> <!-- 1 for 05 Aceptado, 2 for 06 Parcial, 3 for 07 Rechazado -->
  <DetalleMensaje>Comprobante recibido y aceptado para deducción fiscal de IVA.</DetalleMensaje>
  <MontoTotalImpuesto>32500.00000</MontoTotalImpuesto>
  <TotalFactura>282500.00000</TotalFactura>
  <NumeroCedulaReceptor>3101987654</NumeroCedulaReceptor>
  <NumeroConsecutivoReceptor>00100001050000000001</NumeroConsecutivoReceptor>
  <CondicionImpuesto>01</CondicionImpuesto>
  <MontoTotalImpuestoAcreditar>32500.00000</MontoTotalImpuestoAcreditar>
</MensajeReceptor>
```

Once submitted, Hacienda returns a `202 Accepted` and processes the reception confirmation, officially recording the tax credit in the buyer's DGT tax account.

---

### E. How to Identify B2B Acceptance / Rejection Statuses

In both XML exchanges and UI records, reception statuses are categorized by standardized indicators:

| Code | Official Label | XML `<Mensaje>` Tag | Hacienda Response Effect | Form D-104 Impact |
| :--- | :--- | :--- | :--- | :--- |
| **`05`** | **Aceptación Total** | `<Mensaje>1</Mensaje>` | Authorizes 100% deduction | Adds to Line 23 (Crédito Fiscal) |
| **`06`** | **Aceptación Parcial** | `<Mensaje>2</Mensaje>` | Authorizes partial VAT credit | Deducts accepted portion only |
| **`07`** | **Rechazo Total** | `<Mensaje>3</Mensaje>` | Rejects deduction entirely | 0 credit; purges invoice liability |

#### How to Identify in `<MensajeHacienda>` Response XML:
Hacienda responds with an official authorization block:
- `<Mensaje>1</Mensaje>` inside `<MensajeHacienda>` indicates **Aceptado** (Authorized).
- `<Mensaje>3</Mensaje>` indicates **Rechazado** (Rejected with reason code in `<DetalleMensaje>`).

---

### F. The 8-Working-Day Legal Deadline Violation & How to Lean Back to a Solution

#### The Legal Obligation (Law 9635, Art. 27 & Resolution DGT-R-033-2019):
Costa Rica tax regulations establish that taxpayers must issue their **Mensaje Receptor** within **eight (8) business days** (Monday through Friday, excluding national holidays) following the date of invoice issuance. If an invoice exceeds this statutory window, the Dirección General de Tributación automatically flags the input VAT credit as disqualified upon audit.

#### Overdue Item Identification:
In this application, incoming supplier invoices are continuously evaluated against today's date:
- **Green (`Within Legal Window`)**: 1 to 5 working days elapsed.
- **Amber (`Expiring Soon`)**: 6 to 8 working days elapsed (immediate confirmation recommended).
- **Red (`Legal Deadline Violated`)**: >8 working days elapsed. The invoice is highlighted with the exact days overdue and the at-risk tax credit amount.

#### How to Lean Back to a Solution (Recognized Tax Remedies):

When an 8-working-day deadline violation occurs, taxpayers have three legally compliant procedures to resolve the issue:

##### 1. Solution 1: Request Supplier Credit Note (03) & Immediate Re-invoice (Gold Standard - 100% Tax Credit Safe)
- **Mechanism**: The buyer contacts the supplier's billing department. The supplier issues a **Nota de Crédito Electrónica (03)** referencing the expired invoice, completely annulling it, and immediately issues a new **Factura Electrónica (01)** with today's date.
- **Why it works**: Legally resets the 8-working-day clock to **Day 1**. The buyer can now submit Mensaje Receptor `05` on-time, fully claiming 100% of the input VAT credit without audit risk.
- **In-App Action**: Click **"1. Reset Clock (Supplier NC)"** on the overdue item to simulate or execute this annulment and reset the clock. Use the **"Copy Request Letter"** button to copy a formal legal request letter formatted for your supplier.

##### 2. Solution 2: Extemporaneous Acceptance with CPA Audit Dossier (Condition 04 / D-104 Rectification)
- **Mechanism**: If the supplier cannot re-issue the invoice, the buyer submits the Mensaje Receptor using **Tax Condition 04 (Operational Expense - Gasto Corriente)** rather than Condition 01.
- **Why it works**: While direct VAT credit offset may be deferred or disallowed, the expense remains fully deductible against **Corporate Income Tax (*Impuesto sobre las Utilidades*)** under Article 48 of the Tax Code (*Código de Normas y Procedimientos Tributarios - CNPT*), provided the transaction has tangible proof of delivery:
  - Bank wire receipt or SINPE transfer voucher.
  - Signed purchase order (*Orden de Compra*).
  - Supplier delivery receipt or contract.
- **In-App Action**: Click **"2. Late CPA Note"** to submit extemporaneous acceptance under Condition 04 with CPA compliance note.

##### 3. Solution 3: Formal Document Rejection (Mensaje Receptor 07)
- **Mechanism**: If the vendor refuses to cooperate, the service was never delivered, or the invoice was issued erroneously to your tax ID, the buyer submits **Mensaje Receptor 07 (Rechazo Total)**.
- **Why it works**: Completely decouples the unacknowledged document from your tax accounting records, legally notifying Hacienda that your business does not accept the commercial or tax liability.
- **In-App Action**: Submit code `07` from the reception manager form.

---

## 7. REST API Reference & Developer Integration

The platform includes a complete, production-ready REST API implementing all requirements of Ministerio de Hacienda Resolutions **DGT-R-033-2019** (v4.3) and **DGT-R-028-2023** (v4.4).

### Key Integration Resources:
- **Interactive In-App API Docs**: Click the **`API Docs`** button (`</>` icon) in the application header to launch the interactive live explorer. It provides live request execution ("Try it out"), parameter editing, response code verification, and instant cURL snippet generation.
- **Downloadable OpenAPI 3.0**: Inside the API Docs modal, click **"OpenAPI 3.0"** to download the complete specification JSON formatted for immediate import into Postman, Insomnia, or Swagger.
- **Complete REST Reference**: Read [API_DOCS.md](./API_DOCS.md) for full endpoint specifications, required HTTP headers, request payloads, response samples, error codes, 50-digit Clave breakdown, and XAdES-EPES cryptographic hashing rules.


