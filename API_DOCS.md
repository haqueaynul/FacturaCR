# Costa Rica Factura Electrónica API Documentation (v4.3 & v4.4)

Official REST API Reference for the Costa Rica Ministerio de Hacienda (Dirección General de Tributación - DGT) Electronic Invoicing, XAdES-EPES Cryptographic Signing, B2B Supplier Reception, and Formulario D-104 Tax Reconciliation Hub.

---

## 1. Architecture Overview

The backend is built as an Express + TypeScript engine exposing authenticated REST endpoints under `/api/*`. It provides:
1. **Cryptographic Engine**: In-memory PKCS#12 certificate parsing, XML canonicalization (`C14N`), SHA-256 digesting, and XAdES-EPES enveloped signature generation.
2. **Encrypted Key Vault**: Hardware-grade AES-256-GCM symmetric encryption for ATV passwords and digital certificates.
3. **Multi-Tenancy & Multi-Role**: Role-based access control for Accountants (CPA), Legal Counsel, and System Administrators across multiple enrolled client companies.
4. **Hacienda Sandbox Communication**: Full emulation of the staging and production DGT reception and querying endpoints, with automatic exponential retry backoff and asynchronous state reconciliation.
5. **Dual Schema Support**: Dynamic switching between **v4.3** (DGT-R-033-2019) and **v4.4** (introducing *Recibo Electrónico de Pago - REP* and *SINPE Móvil*).

---

## 2. Global Headers & Conventions

All requests and responses communicate using JSON.

| Header | Value | Description |
| :--- | :--- | :--- |
| `Accept` | `application/json` | Required on all GET and POST requests. |
| `Content-Type` | `application/json` | Required on all POST requests. |

### Standard Response Codes
- `200 OK`: Request succeeded. Returned on queries, updates, and successful synchronous operations.
- `201 Created`: Resource successfully created (new document emitted, company enrolled, or user registered).
- `400 Bad Request`: Validation failure (missing required field, invalid 50-digit clave, or unrecognized CABYS code).
- `401 Unauthorized`: Authentication required or invalid credentials.
- `404 Not Found`: Target entity not found.
- `500 Internal Server Error`: Server exception with JSON error payload `{ "error": "description" }`.

---

## 3. Endpoints Reference

### A. Authentication & Session (`/api/auth/*`)

#### 1. `GET /api/auth/me`
Retrieves the active authenticated user profile, assigned role, and permitted companies.

**Response `200 OK`**:
```json
{
  "user": {
    "id": "USR-ADMIN",
    "name": "Carlos Solano (Super Administrador)",
    "email": "admin@hacienda-hub.cr",
    "role": "admin",
    "companyIds": ["COMP-1", "COMP-2", "COMP-3"]
  }
}
```

#### 2. `POST /api/auth/signin`
Establishes a session context for a specific user.

**Request Body**:
```json
{
  "email": "admin@hacienda-hub.cr",
  "password": "adminPassword123!"
}
```

**Response `200 OK`**:
```json
{
  "success": true,
  "user": {
    "id": "USR-ADMIN",
    "name": "Carlos Solano (Super Administrador)",
    "role": "admin"
  }
}
```

#### 3. `POST /api/auth/signup`
Enrolls a new professional (Accountant, Lawyer, or Admin).

**Request Body**:
```json
{
  "name": "Licda. Gabriela Méndez CPA",
  "email": "gmendez@cpacr.com",
  "password": "PasswordSecure123!",
  "role": "accountant",
  "licenseNumber": "CPA-CR-22194"
}
```

**Response `201 Created`**:
```json
{
  "success": true,
  "user": {
    "id": "USR-22194",
    "name": "Licda. Gabriela Méndez CPA",
    "role": "accountant",
    "licenseNumber": "CPA-CR-22194"
  }
}
```

#### 4. `POST /api/auth/signout`
Ends the current user session and resets to default administrative profile.

---

### B. Companies & Multi-Tenancy (`/api/companies/*`)

#### 1. `GET /api/companies`
Lists all taxpayer companies accessible by the requesting user.

**Response `200 OK`**:
```json
[
  {
    "id": "COMP-1",
    "nombre": "SERVICIOS TECNOLÓGICOS DEL VALLE S.A.",
    "cedula": "3101123456",
    "tipoCedula": "02",
    "codigoActividad": "620101",
    "regimenTributario": "tradicional",
    "schemaVersion": "4.4",
    "p12Status": "valid"
  }
]
```

#### 2. `POST /api/companies`
Enrolls a new legal entity or individual taxpayer.

**Request Body**:
```json
{
  "nombre": "INNOVA CONSULTING GROUP S.A.",
  "nombreComercial": "INNOVA TECH",
  "cedula": "3101999888",
  "tipoCedula": "02",
  "codigoActividad": "620101",
  "regimenTributario": "tradicional",
  "correo": "facturacion@innovacr.com",
  "telefono": "2299-8800",
  "sucursal": "001",
  "puntoVenta": "00001"
}
```

#### 3. `POST /api/companies/:id/activate`
Switches the active company workspace. Subsequent invoice generations, submissions, and report inquiries will operate in the selected company's context.

---

### C. Taxpayer Configuration & Schemas (`/api/config/*`)

#### 1. `GET /api/config`
Retrieves the active taxpayer configuration, branch codes, ATV username, and certificate expiration.

#### 2. `POST /api/config`
Updates credentials in the AES-256-GCM encrypted vault.

**Request Body**:
```json
{
  "atvPassword": "UpdatedATVSecret2026#",
  "pinP12": "1234",
  "useLiveSandbox": true
}
```

#### 3. `POST /api/config/schema-version`
Toggles between schema `4.3` and `4.4`.

**Request Body**:
```json
{
  "schemaVersion": "4.4"
}
```

---

### D. Electronic Invoicing (`/api/documents/*`)

#### 1. `GET /api/documents`
Queries emitted vouchers. Optional query parameters:
- `companyId`: Filter by company ID.
- `estado`: Filter by state (`aceptado`, `rechazado`, `procesando`, `firmado`, `error_envio`).
- `tipo`: Filter by voucher type (`01`, `02`, `03`, `04`, `08`, `09`, `10`).

#### 2. `POST /api/documents`
Generates, signs with XAdES-EPES, and queues submission of an electronic voucher.

**Request Body**:
```json
{
  "tipoDocumento": "01",
  "moneda": "CRC",
  "tipoCambio": 1.0,
  "condicionVenta": "01",
  "medioPago": "04",
  "receptor": {
    "nombre": "BANCO NACIONAL DE COSTA RICA",
    "cedula": "4000042139",
    "tipoCedula": "02",
    "correo": "facturacion@bncr.fi.cr"
  },
  "items": [
    {
      "codigoCabys": "8314100000000",
      "detalle": "Servicios de Consultoría de Software",
      "cantidad": 1,
      "unidadMedida": "Sp",
      "precioUnitario": 100000,
      "tarifaIva": 13,
      "codigoTarifaIva": "08",
      "montoIva": 13000,
      "montoTotalLinea": 113000
    }
  ],
  "autoSubmit": true
}
```

**Response `201 Created`**:
```json
{
  "id": "DOC-1002",
  "clave": "50603102600310112345600100001010000000002194820148",
  "consecutivo": "00100001010000000002",
  "estado": "firmado",
  "digestValue": "YA0b3iN8SdpQTfn4ik6Z/UcwDHgowpjqmf9cfJTeULU=",
  "signatureValue": "Vcm2ANG/rdtp4XESV3fCraIH4SeOqu23eIJgRzkF03I="
}
```

#### 3. `POST /api/documents/:id/submit`
Retries transmission of a signed voucher that was stuck in transient 503 error state.

#### 4. `GET /api/documents/:id/status`
Polls asynchronous status from the DGT reception endpoint and returns the `<MensajeHacienda>`.

#### 5. `POST /api/documents/bulk`
Mass batch generation for 10 to 100 invoices concurrently with CABYS validation.

**Request Body**:
```json
{
  "batchCount": 20,
  "taxRegime": "tradicional",
  "baseAmount": 50000
}
```

---

### E. B2B Supplier Reception (`/api/reception/*`)

#### 1. `GET /api/reception`
Lists all buyer confirmation messages (`05` Aceptado, `06` Aceptado Parcial, `07` Rechazado).

#### 2. `POST /api/reception`
Generates and signs the official buyer reception confirmation XML (`MensajeReceptor`) to legally secure deductible VAT input credits in Formulario D-104.

**Request Body**:
```json
{
  "claveDocumento": "50601102600310188811100100001010000000001188888888",
  "emisorCedula": "3101888111",
  "tipoMensaje": "05",
  "detalleMensaje": "Aceptación total de compras para deducción en Formulario D-104",
  "montoTotalImpuesto": 13000,
  "totalFactura": 113000,
  "condicionImpuesto": "01",
  "montoTotalImpuestoAcreditar": 13000,
  "montoTotalDeGastoAplicable": 100000
}
```

#### 3. `GET /api/reception/supplier-invoices`
Returns pending incoming supplier invoices with real-time 8-working-day legal deadline calculation.

#### 4. `POST /api/reception/supplier-invoices/remedy`
Applies an official legal or accounting remedy for an 8-working-day deadline violation:
- `supplier_reissue`: Simulates supplier Credit Note (03) annulment and new emission, resetting the legal 8-day clock.
- `cpa_late_justification`: Sets Condition 04 (expense deduction with CPA audit justification).
- `rejection`: Formally issues Mensaje Receptor 07 to reject the invoice.

---

### F. Reports & Analytics (`/api/reports/*`)

#### 1. `GET /api/reports/summary`
Calculates Formulario D-104 VAT position:
- `ivaDebitoFiscal`: Total VAT collected from accepted sales.
- `ivaCreditoFiscal`: Total VAT deductible from accepted supplier reception messages.
- `balanceIvaPagar`: Net payable tax liability (`Math.max(0, debito - credito)`).
- `avgResponseTimeMs`: Average Hacienda API latency.

#### 2. `GET /api/admin/reports/:companyId`
Generates an executive accounting report certified with CPA and Legal Counsel license numbers.

---

### G. Regulatory Audit Logs & Test Scenarios

#### 1. `GET /api/logs`
Streams the 10-step regulatory audit trail:
`1. GENERATION` -> `2. CANONICALIZATION` -> `3. DIGEST` -> `4. XAdES-EPES` -> `5. STORAGE` -> `6. SUBMISSION` -> `7. POLLING` -> `8. VALIDATION` -> `9. RESOLUTION` -> `10. ACCOUNTING`.

#### 2. `POST /api/sandbox/preset-scenario`
Executes one of the official regulatory test scenarios:
- `standard_sale_13` (scen1): Standard 13% VAT commercial sale.
- `health_services_4` (scen2): Private medical services at reduced 4% VAT (Art. 26 Ley 9635).
- `tourism_services_8` (scen3): ICT registered tourism lodging at 8% VAT.
- `export_invoice_fee` (scen4): Software engineering export voucher (FEE 09) in USD (0% VAT).
- `simplified_regime_fec` (scen5): Factura Electrónica de Compra (FEC 08) for Simplified Regime vendors.
- `test_duplicate_clave` (scen6): Rejection simulation for pre-existing Clave.
- `test_signature_failure` (scen7): Rejection simulation for invalid or corrupt signature digest.
- `test_network_503_retry` (scen8): Transient 503 error simulation with exponential retry backoff.
- `v44_rep_payment` (scen9): Recibo Electrónico de Pago (REP 10) in v4.4 using SINPE Móvil (MedioPago 05).

---

## 4. 50-Digit Clave Numerical Algorithm

Every electronic voucher generated in Costa Rica is identified by an exact 50-digit numerical code calculated according to the following layout:

```text
506 DD MM AA CCCCCCCCCCCC SSS PPPPP TT KKKKKKKKKK S RRRRRRRR
 |   |  |  |       |        |    |    |      |     |     |
 |   |  |  |       |        |    |    |      |     |     +-- 8-digit Security Code
 |   |  |  |       |        |    |    |      |     +-------- 1-digit Tax Situation (1 Normal)
 |   |  |  |       |        |    |    |      +-------------- 10-digit Sequential Number
 |   |  |  |       |        |    |    +--------------------- 2-digit Document Type (01 FE, 03 NC, 10 REP)
 |   |  |  |       |        |    +-------------------------- 5-digit POS Terminal Number
 |   |  |  |       |        +------------------------------- 3-digit Branch Number
 |   |  |  |       +---------------------------------------- 12-digit Taxpayer ID (padded with zeros)
 |   +--+--+------------------------------------------------ 6-digit Emission Date (DDMMAA)
 +---------------------------------------------------------- 3-digit Country Code (506)
```

---

## 5. XAdES-EPES Digital Signature Standard

Digital signatures comply with Costa Rica Digital Signature Law 8454 and Central Bank of Costa Rica (BCCR) CA SINPE guidelines:
- **Canonicalization**: Canonical XML 1.0 (`http://www.w3.org/TR/2001/REC-xml-c14n-20010315`)
- **Signature Algorithm**: RSA-SHA256 (`http://www.w3.org/2001/04/xmldsig-more#rsa-sha256`)
- **Digest Algorithm**: SHA-256 (`http://www.w3.org/2001/04/xmlenc#sha256`)
- **Policy URL**: `https://www.hacienda.go.cr/ATV/politicaFirma/politicaFirmaFacturaElectronicaV4.3.pdf`
- **Key Storage**: AES-256-GCM encrypted in memory vault with dynamic Initialization Vector (IV).
