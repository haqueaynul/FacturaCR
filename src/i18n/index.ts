/**
 * @file src/i18n/index.ts
 * @description Bilingual Internationalization (i18n) dictionary for Costa Rica Factura Electrónica v4.3.
 * Full translations for English (EN) and Spanish (ES), including regulatory tax definitions,
 * step suggestions, role descriptions (Accountant, Lawyer, Admin), validation hints, and reports.
 */

export type Language = 'es' | 'en';

export interface Translations {
  // Brand & Header
  appTitle: string;
  appSubtitle: string;
  versionBadge: string;
  versionSwitcherLabel: string;
  compareVersionsBtn: string;
  version43Label: string;
  version44Label: string;
  versionModalTitle: string;
  versionModalSubtitle: string;
  switchSuccessToast: string;
  sandboxMode: string;
  sandboxLive: string;
  sandboxSim: string;
  vaultEncrypted: string;
  xadesSignature: string;
  themeToggle: string;
  languageToggle: string;
  currentCompany: string;
  switchCompany: string;
  registerCompany: string;
  signIn: string;
  signUp: string;
  signOut: string;
  welcomeUser: string;
  roleAdmin: string;
  roleAccountant: string;
  roleLawyer: string;

  // Tabs
  tabInvoicing: string;
  tabB2BReception: string;
  tabBulk: string;
  tabAudit: string;
  tabAccountantDesk: string;
  tabLawyerDesk: string;
  tabAdminHub: string;

  // Stats
  statIssued: string;
  statApproved: string;
  statPending: string;
  statTaxBalance: string;
  statSuccessRate: string;
  statAvgLatency: string;
  statDebit: string;
  statCredit: string;
  statRejected: string;

  // Step Guide Banner (Automated Next Step Suggestions)
  guideTitle: string;
  guideDismiss: string;
  stepGenCompleted: string;
  stepGenNextAction: string;
  stepSubCompleted: string;
  stepSubNextAction: string;
  stepAppCompleted: string;
  stepAppNextAction: string;
  stepRecCompleted: string;
  stepRecNextAction: string;
  stepErrDetected: string;
  stepErrNextAction: string;

  // Invoicing Form & Validations
  formNewDocTitle: string;
  formDocType: string;
  formCurrency: string;
  formExchangeRate: string;
  formSaleCondition: string;
  formPaymentMethod: string;
  formCreditTerm: string;
  formDays: string;
  customerData: string;
  customerName: string;
  customerIdType: string;
  customerIdNumber: string;
  customerEmail: string;
  lineItems: string;
  addLine: string;
  cabysCode: string;
  itemDetail: string;
  itemQty: string;
  itemUnitPrice: string;
  itemVatRate: string;
  itemVatAmount: string;
  itemTotal: string;
  subtotalNet: string;
  totalVat: string;
  totalInvoice: string;
  btnSignAndSubmit: string;
  btnSigning: string;
  searchCabys: string;

  // Validation Hints (for beginners)
  hintDocType: string;
  hintClave50: string;
  hintCedula: string;
  hintCabys: string;
  hintVatRates: string;
  hintSaleCondition: string;
  hintPaymentMethod: string;
  hintB2BMensaje: string;
  hintTaxCredit: string;

  // Submission Queue
  queueTitle: string;
  queueSubtitle: string;
  filterAllStatus: string;
  filterAccepted: string;
  filterProcessing: string;
  filterRejected: string;
  filterError: string;
  searchPlaceholder: string;
  colTypeSeq: string;
  colClave: string;
  colCustomer: string;
  colDate: string;
  colTotal: string;
  colHaciendaStatus: string;
  colActions: string;
  actionDetails: string;
  actionRetry: string;
  actionCheckStatus: string;

  // B2B Reception
  b2bTitle: string;
  b2bSubtitle: string;
  b2bClaveInput: string;
  b2bDecision: string;
  b2bDecision05: string;
  b2bDecision06: string;
  b2bDecision07: string;
  b2bSupplierName: string;
  b2bSupplierId: string;
  b2bInvoiceTotal: string;
  b2bVatTotal: string;
  b2bTaxCondition: string;
  b2bCreditAmount: string;
  b2bDetailNote: string;
  b2bSubmitBtn: string;
  b2bSampleBtn: string;
  b2bHistoryTitle: string;

  // Bulk Processing
  bulkTitle: string;
  bulkSubtitle: string;
  bulkBatchSize: string;
  bulkRegime: string;
  bulkAvgAmount: string;
  bulkPipelineDesc: string;
  bulkExecuteBtn: string;
  bulkProcessingText: string;

  // Audit Logs
  auditTitle: string;
  auditSubtitle: string;
  auditExportCsv: string;
  auditExportJson: string;
  auditFilterStep: string;
  auditFilterStatus: string;
  auditColTime: string;
  auditColStep: string;
  auditColStatus: string;
  auditColHttp: string;
  auditColLatency: string;
  auditColDetail: string;
  auditColClave: string;

  // Accountant Desk
  accountantTitle: string;
  accountantSubtitle: string;
  accountantDuties: string;
  accountantD104Title: string;
  accountantReconcileTitle: string;
  accountantExpenseCat: string;
  accountantSalesLedger: string;
  accountantPurchasesLedger: string;
  accountantExportReports: string;
  accountantGenerateD104: string;

  // Lawyer Desk
  lawyerTitle: string;
  lawyerSubtitle: string;
  lawyerDuties: string;
  lawyerCertAuditTitle: string;
  lawyerLegalStamp: string;
  lawyerPersoneriaTitle: string;
  lawyerCreditNoteLegal: string;
  lawyerDisputeTitle: string;
  lawyerIssueCert: string;

  // Admin Hub
  adminTitle: string;
  adminSubtitle: string;
  adminCompanyList: string;
  adminAllReports: string;
  adminRegisterCompBtn: string;
  adminEnrollUser: string;
  adminTotalCompanies: string;
  adminGlobalVat: string;
  adminConsolidatedReport: string;

  // Modals & Common
  close: string;
  save: string;
  cancel: string;
  download: string;
  copy: string;
  copied: string;
  print: string;
  testScenariosBtn: string;
  reportsD104Btn: string;

  // Notifications & Header
  notificationsTitle: string;
  notificationsClear: string;
  notificationsEmpty: string;
  settingsTooltip: string;

  // Footer
  footerAuthority: string;
  footerSecurity: string;

  // Sandbox & Vault Settings Modal
  cfgModalTitle: string;
  cfgModalSubtitle: string;
  cfgTabHacienda: string;
  cfgTabScenarios: string;
  cfgTabVault: string;
  cfgVersionTitle: string;
  cfgV44Title: string;
  cfgV44Badge: string;
  cfgV44Desc: string;
  cfgV43Title: string;
  cfgV43Badge: string;
  cfgV43Desc: string;
  cfgSandboxModeTitle: string;
  cfgSimTitle: string;
  cfgSimDesc: string;
  cfgLiveTitle: string;
  cfgLiveDesc: string;
  cfgTaxpayerName: string;
  cfgTaxpayerId: string;
  cfgEconomicCode: string;
  cfgTaxRegime: string;
  cfgRegimeTraditional: string;
  cfgRegimeSimplified: string;
  cfgRegimeFreeZone: string;
  cfgRegimeAgro: string;
  cfgAtvTitle: string;
  cfgAtvUsername: string;
  cfgAtvPassword: string;
  cfgAtvEncryptedPass: string;
  cfgAtvEnterPass: string;
  cfgP12Title: string;
  cfgP12Badge: string;
  cfgP12Pin: string;
  cfgP12PinPlaceholder: string;
  cfgP12Upload: string;
  cfgP12SelectFile: string;
  cfgBtnSave: string;
  cfgBtnSaving: string;
  cfgScenariosDesc: string;
  cfgScen1Title: string;
  cfgScen1Desc: string;
  cfgScen2Title: string;
  cfgScen2Desc: string;
  cfgScen3Title: string;
  cfgScen3Desc: string;
  cfgScen4Title: string;
  cfgScen4Desc: string;
  cfgScen5Title: string;
  cfgScen5Desc: string;
  cfgScen6Title: string;
  cfgScen6Desc: string;
  cfgScen7Title: string;
  cfgScen7Desc: string;
  cfgScen8Title: string;
  cfgScen8Desc: string;
  cfgBtnTest: string;
  cfgVaultTitle: string;
  cfgVaultDesc: string;
  cfgVaultAlgo: string;
  cfgVaultSig: string;
  cfgVaultMasking: string;
  cfgVaultMaskingActive: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Brand & Header
    appTitle: 'Costa Rica e-Invoice Hub',
    appSubtitle: 'Ministry of Finance · Official v4.3 / v4.4 Invoicing & Reception System',
    versionBadge: 'Tax Authority',
    versionSwitcherLabel: 'Schema Version',
    compareVersionsBtn: 'Compare v4.3 vs v4.4',
    version43Label: 'v4.3 Legacy (DGT-R-033-2019)',
    version44Label: 'v4.4 Latest (TRIBU-CR / REP)',
    versionModalTitle: 'Costa Rica Factura Electrónica: v4.3 vs v4.4 Specification Comparison',
    versionModalSubtitle: 'Technical and regulatory guide by Ministerio de Hacienda & Dirección General de Tributación',
    switchSuccessToast: 'Successfully switched active tax schema version to',
    sandboxMode: 'Sandbox Mode',
    sandboxLive: 'Live ATV Sandbox (stag)',
    sandboxSim: 'Smart Sandbox Simulator',
    vaultEncrypted: 'AES-256-GCM Vault',
    xadesSignature: 'XAdES-EPES PKCS#12',
    themeToggle: 'Switch to Bright / Dark Theme',
    languageToggle: 'Español',
    currentCompany: 'Active Company',
    switchCompany: 'Switch Company',
    registerCompany: 'Register New Company',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    welcomeUser: 'Welcome',
    roleAdmin: 'System Administrator',
    roleAccountant: 'Certified Accountant (CPA)',
    roleLawyer: 'Legal Counsel / Attorney',

    // Tabs
    tabInvoicing: '1. Invoicing & Queue',
    tabB2BReception: '2. B2B Reception (Supplier Invoices)',
    tabBulk: '3. Bulk Batch Processing',
    tabAudit: '4. Compliance Audit Trail',
    tabAccountantDesk: 'Accountant Desk',
    tabLawyerDesk: 'Legal Counsel Desk',
    tabAdminHub: 'Admin Enterprise Hub',

    // Stats
    statIssued: 'Issued Invoices',
    statApproved: 'Approved by Tax Authority',
    statPending: 'Queue / In Validation',
    statTaxBalance: 'VAT Balance to Declare',
    statSuccessRate: 'Approval Rate',
    statAvgLatency: 'avg API response',
    statDebit: 'VAT Debit',
    statCredit: 'VAT Credit',
    statRejected: 'rejected',

    // Step Guide Banner
    guideTitle: 'Guided Tax Assistant · Next Step Suggestion',
    guideDismiss: 'Dismiss',
    stepGenCompleted: 'Step 1 Completed: Electronic invoice generated locally with 50-digit Clave.',
    stepGenNextAction: 'Next Step: Digitally sign with XAdES-EPES PKCS#12 and submit to Ministry of Finance Sandbox.',
    stepSubCompleted: 'Step 2 & 3 Completed: Document sent to Tax Authority Queue (HTTP 202).',
    stepSubNextAction: 'Next Step: Query asynchronous processing status to verify official acceptance.',
    stepAppCompleted: 'Step 4 Completed: Document officially ACCEPTED and authorized by Hacienda.',
    stepAppNextAction: 'Next Step: Inspect official XML & QR code, or register supplier invoices in B2B Reception.',
    stepRecCompleted: 'Step 5 Completed: B2B Supplier Reception message (Mensaje Receptor) filed.',
    stepRecNextAction: 'Next Step: Review VAT credit deduction in the Accountant Desk Formulario D-104.',
    stepErrDetected: 'Transmission Warning: Document failed or requires validation correction.',
    stepErrNextAction: 'Next Step: Review error diagnostics, verify CABYS/Cédula, or trigger exponential retry.',

    // Invoicing Form & Validations
    formNewDocTitle: 'Issue Electronic Document v4.3',
    formDocType: 'Document Type',
    formCurrency: 'Currency',
    formExchangeRate: 'Exch. Rate (BCCR)',
    formSaleCondition: 'Sale Condition',
    formPaymentMethod: 'Payment Method',
    formCreditTerm: 'Credit Term (Days)',
    formDays: 'Days',
    customerData: 'Customer / Buyer Information',
    customerName: 'Customer Name / Corporate Name',
    customerIdType: 'ID Type',
    customerIdNumber: 'Tax ID Number (Cédula)',
    customerEmail: 'Notification Email for XML',
    lineItems: 'Line Items (Official CABYS v4.3 Catalogue)',
    addLine: 'Add Line Item',
    cabysCode: 'CABYS Code (13 digits)',
    itemDetail: 'Item / Service Description',
    itemQty: 'Qty',
    itemUnitPrice: 'Unit Price',
    itemVatRate: 'VAT Rate',
    itemVatAmount: 'VAT',
    itemTotal: 'Line Total',
    subtotalNet: 'Net Subtotal',
    totalVat: 'Total VAT',
    totalInvoice: 'Total Invoice',
    btnSignAndSubmit: 'Digitally Sign & Transmit to Hacienda',
    btnSigning: 'Signing & Transmitting...',
    searchCabys: 'Search CABYS Catalogue',

    // Validation Hints
    hintDocType: '01: Electronic Invoice (with Tax ID). 04: Electronic Ticket (consumer). 03: Credit Note (returns/discounts). 08: Purchase Invoice (from simplified regime suppliers). 09: Export Invoice (0% VAT).',
    hintClave50: '50-digit numeric key: Country 506 + Date (DDMMYY) + 12-digit Tax ID + 20-digit consecutive + 1-digit situation + 8-digit security code.',
    hintCedula: 'Physical person: 9 digits (e.g. 101230456). Legal entity / corporation: 10 digits (e.g. 3101123456). DIMEX: 11-12 digits. NITE: 10 digits.',
    hintCabys: 'Mandatory 13-digit classification code established by Central Bank and Tax Authority to determine legal tax treatment.',
    hintVatRates: '13% General standard. 8% Registered Tourism. 4% Private Healthcare. 2% Education. 1% Basic Food Basket. 0% Exempt / Exports.',
    hintSaleCondition: '01: Cash (immediate payment). 02: Credit (specify days). 03: Consignment.',
    hintPaymentMethod: '04: Bank Transfer / SINPE Móvil. 02: Credit/Debit Card. 01: Cash. 03: Check.',
    hintB2BMensaje: '05: Accepted (100% tax deductible). 06: Partially Accepted. 07: Rejected (disputed supplier invoice).',
    hintTaxCredit: 'Determines whether you take 100% VAT credit (01 Pleno), partial credit (02), capital asset (03), non-deductible (04), or proportionality (05).',

    // Queue
    queueTitle: 'Submission Queue & Asynchronous Validation',
    queueSubtitle: 'Real-time tracking of tax authority reception states, official responses, and automated retries.',
    filterAllStatus: 'All Statuses',
    filterAccepted: 'Accepted / Authorized',
    filterProcessing: 'Validating (Async)',
    filterRejected: 'Rejected by Tax Authority',
    filterError: 'Connection Error / Retrying',
    searchPlaceholder: 'Search by Clave, consecutive, or customer...',
    colTypeSeq: 'Type / Consecutive',
    colClave: '50-Digit Clave',
    colCustomer: 'Customer / Buyer',
    colDate: 'Emission Date',
    colTotal: 'Total Amount',
    colHaciendaStatus: 'Hacienda Status',
    colActions: 'Actions',
    actionDetails: 'Details & XML',
    actionRetry: 'Retry',
    actionCheckStatus: 'Check Status',

    // B2B Reception
    b2bTitle: 'B2B Reception of Supplier Invoices (Mensaje Receptor)',
    b2bSubtitle: 'Generate MensajeReceptor v4.3 (Codes 05, 06, 07) to deduct purchases and claim VAT fiscal credit.',
    b2bClaveInput: 'Supplier Invoice 50-Digit Clave *',
    b2bDecision: 'Buyer Decision (Official Hacienda Code)',
    b2bDecision05: '05 - Accepted (Full Tax Deduction)',
    b2bDecision06: '06 - Partially Accepted',
    b2bDecision07: '07 - Rejected (Dispute / Non-deductible)',
    b2bSupplierName: 'Supplier Legal Name',
    b2bSupplierId: 'Supplier Tax ID (Cédula)',
    b2bInvoiceTotal: 'Total Invoice Amount',
    b2bVatTotal: 'Total VAT in Invoice',
    b2bTaxCondition: 'Tax Credit Condition (Form D-104)',
    b2bCreditAmount: 'VAT Credit to Claim',
    b2bDetailNote: 'Receptor Justification / Memo',
    b2bSubmitBtn: 'Sign & Submit Reception Message to Hacienda',
    b2bSampleBtn: 'Generate Test Supplier Clave',
    b2bHistoryTitle: 'Received Supplier Invoices History',

    // Bulk Processing
    bulkTitle: 'Bulk Invoice Processing Engine',
    bulkSubtitle: 'Generate high-volume batches of invoices, sign concurrently with XAdES-EPES, and stream to Sandbox.',
    bulkBatchSize: 'Batch Size',
    bulkRegime: 'Tax Regime',
    bulkAvgAmount: 'Base Invoice Amount',
    bulkPipelineDesc: 'Pipeline: 1. Assign sequential 50-digit Claves · 2. Sign XAdES-EPES PKCS#12 · 3. Stream HTTP 202 to Sandbox',
    bulkExecuteBtn: 'Generate & Transmit Batch',
    bulkProcessingText: 'Processing Batch Concurrently...',

    // Audit Logs
    auditTitle: 'Regulatory Compliance Audit Trail',
    auditSubtitle: 'Immutable logs of cryptographic signatures, HTTP requests, latencies, and official tax responses.',
    auditExportCsv: 'Export CSV',
    auditExportJson: 'Export JSON',
    auditFilterStep: 'Filter Step',
    auditFilterStatus: 'Filter Status',
    auditColTime: 'Time',
    auditColStep: 'Process Step',
    auditColStatus: 'Status',
    auditColHttp: 'HTTP',
    auditColLatency: 'Latency',
    auditColDetail: 'Audit Message & Details',
    auditColClave: 'Associated Clave',

    // Accountant Desk
    accountantTitle: 'Accountant Compliance Desk',
    accountantSubtitle: 'Monthly tax reconciliation, Formulario D-104 filing preparation, CABYS classification, and ledgers.',
    accountantDuties: 'Accountant Responsibilities: Perform invoicing on behalf of clients, reconcile VAT collected (Débito) against VAT paid (Crédito), generate monthly D-104 tax statements, classify expenses, and verify supplier acceptance messages.',
    accountantD104Title: 'Formulario D-104 Monthly VAT Return (Preview)',
    accountantReconcileTitle: 'VAT Débito vs Crédito Fiscal Reconciliation',
    accountantExpenseCat: 'CABYS Expense Classification & Audit',
    accountantSalesLedger: 'Official Sales Journal (Libro de Ventas)',
    accountantPurchasesLedger: 'Official Purchases Journal (Libro de Compras)',
    accountantExportReports: 'Export Complete Accounting Package',
    accountantGenerateD104: 'File D-104 Statement Report',

    // Lawyer Desk
    lawyerTitle: 'Legal Counsel & Tax Compliance Desk',
    lawyerSubtitle: 'Legal validity audit under Law 8454, digital certificate standing, power of attorney, and dispute review.',
    lawyerDuties: 'Lawyer Responsibilities: Validate legal identity & Personería Jurídica, audit cryptographic signature compliance under Costa Rica Digital Signature Law 8454, justify invoice cancellations (Notas de Crédito), and issue legal compliance certificates for tax defense.',
    lawyerCertAuditTitle: 'Law 8454 Digital Certificate Legal Standing',
    lawyerLegalStamp: 'Legal Compliance Audit Seal',
    lawyerPersoneriaTitle: 'Corporate Power of Attorney (Personería Jurídica) Registry',
    lawyerCreditNoteLegal: 'Legal Justification for Credit / Debit Notes',
    lawyerDisputeTitle: 'Commercial & Tax Dispute Review',
    lawyerIssueCert: 'Issue Legal Compliance Certification',

    // Admin Hub
    adminTitle: 'Enterprise Admin Hub · Multi-Company Management',
    adminSubtitle: 'Global oversight across all enrolled companies, cross-company tax reporting, and professional role management.',
    adminCompanyList: 'Enrolled Client Companies',
    adminAllReports: 'Generate Consolidated Company Accounting Reports',
    adminRegisterCompBtn: 'Enroll New Company',
    adminEnrollUser: 'Assign Accountants & Lawyers to Company',
    adminTotalCompanies: 'Total Companies',
    adminGlobalVat: 'Total Global VAT Managed',
    adminConsolidatedReport: 'Full Enterprise Accounting Package',

    // Modals & Common
    close: 'Close',
    save: 'Save Changes',
    cancel: 'Cancel',
    download: 'Download',
    copy: 'Copy',
    copied: 'Copied!',
    print: 'Print Document',
    testScenariosBtn: 'Sandbox Scenarios',
    reportsD104Btn: 'D-104 Report',

    // Notifications & Header
    notificationsTitle: 'Notifications',
    notificationsClear: 'Clear',
    notificationsEmpty: 'No pending notifications.',
    settingsTooltip: 'Hacienda Sandbox & .p12 Certificate Settings',

    // Footer
    footerAuthority: 'Ministry of Finance of Costa Rica · General Directorate of Taxation · Formats v4.3 & v4.4',
    footerSecurity: 'XAdES-EPES Digital Signature · Law 8454 · AES-256-GCM Encrypted Storage',

    // Sandbox & Vault Settings Modal
    cfgModalTitle: 'Ministerio de Hacienda Sandbox & Cryptographic Vault Settings',
    cfgModalSubtitle: 'Official ATV connection parameters, .p12 cryptographic certificate, and tax compliance test regimes.',
    cfgTabHacienda: 'Sandbox Credentials & .p12 Certificate',
    cfgTabScenarios: 'Preconfigured Tax Scenarios',
    cfgTabVault: 'AES-256-GCM Vault Security',
    cfgVersionTitle: 'Electronic Invoicing Version (Ministerio de Hacienda)',
    cfgV44Title: 'Version 4.4 (TRIBU-CR / In Effect)',
    cfgV44Badge: 'Recommended',
    cfgV44Desc: 'XML v4.4 schemas, Payment Electronic Receipt (REP), dedicated SINPE Móvil code 05, and "No Sujeto" vs "Exento" separation.',
    cfgV43Title: 'Version 4.3 (Previous Standard / ATV)',
    cfgV43Badge: 'Legacy',
    cfgV43Desc: 'XML v4.3 schemas (Resolution DGT-R-033-2019), standard electronic invoices, Credit/Debit Notes, and tickets without REP.',
    cfgSandboxModeTitle: 'Tax Sandbox Operation Mode',
    cfgSimTitle: 'Smart Sandbox Simulator',
    cfgSimDesc: 'Emulates 100% of Hacienda API v4.3 & v4.4, validates XAdES-EPES signatures, produces official RespuestaHacienda, and tests immediately.',
    cfgLiveTitle: 'Live ATV Sandbox (Staging)',
    cfgLiveDesc: 'Connects via proxy to idp.comprobanteselectronicos.go.cr and api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/ with live credentials.',
    cfgTaxpayerName: 'Taxpayer Name / Legal Corporate Name',
    cfgTaxpayerId: 'Issuer Tax ID (Cédula)',
    cfgEconomicCode: 'Economic Activity Code (6 digits)',
    cfgTaxRegime: 'Tax Regime',
    cfgRegimeTraditional: 'Traditional / General Regime',
    cfgRegimeSimplified: 'Simplified Tax Regime',
    cfgRegimeFreeZone: 'Free Trade Zone Regime',
    cfgRegimeAgro: 'Agricultural Regime',
    cfgAtvTitle: 'ATV API Credentials (Ministerio de Hacienda)',
    cfgAtvUsername: 'ATV Username (IDP Stag)',
    cfgAtvPassword: 'ATV API Password',
    cfgAtvEncryptedPass: '•••••••••••• (Encrypted in Vault)',
    cfgAtvEnterPass: 'Enter API password',
    cfgP12Title: 'PKCS#12 (.p12) Cryptographic Certificate',
    cfgP12Badge: 'XAdES-EPES Signature',
    cfgP12Pin: 'Cryptographic Key PIN',
    cfgP12PinPlaceholder: '4-digit PIN (e.g. 1234)',
    cfgP12Upload: 'Upload .p12 File',
    cfgP12SelectFile: 'Select official .p12 certificate',
    cfgBtnSave: 'Save & Secure in Vault',
    cfgBtnSaving: 'Saving in Vault...',
    cfgScenariosDesc: 'Execute official test scenarios with one click as required by Ministerio de Hacienda for certification:',
    cfgScen1Title: '1. General Sale 13% VAT',
    cfgScen1Desc: 'Traditional Regime, standard invoice with general VAT (Rate 08).',
    cfgScen2Title: '2. Healthcare Services 4% VAT',
    cfgScen2Desc: 'Reduced rate according to Art. 26 Law 9635 for private healthcare.',
    cfgScen3Title: '3. Tourism Services 8% VAT',
    cfgScen3Desc: 'Transitory rate Law 9882 for lodging and certified ICT travel agencies.',
    cfgScen4Title: '4. Export Invoice (FEE 09)',
    cfgScen4Desc: 'Services exported in USD, 0% Exempt rate to non-resident foreign client.',
    cfgScen5Title: '5. Purchase Invoice (FEC 08)',
    cfgScen5Desc: 'Purchase from unregistered vendor in Simplified Taxation Regime.',
    cfgScen6Title: '6. Duplicate Clave Test (Rejection)',
    cfgScen6Desc: 'Simulates 400 rejection from Hacienda for duplicate numeric clave.',
    cfgScen7Title: '7. Invalid Signature Test (Rejection)',
    cfgScen7Desc: 'Simulates rejection for untrusted certificate or corrupt digest.',
    cfgScen8Title: '8. 503 Outage & Auto-Retry Test',
    cfgScen8Desc: 'Simulates transient HTTP 503 outage and triggers exponential retry queue.',
    cfgBtnTest: 'Test',
    cfgVaultTitle: 'Cryptographic Security Vault & Financial Record Protection',
    cfgVaultDesc: 'To comply with tax security directives, all financial records, PKCS#12 certificates, private keys, and Ministry credentials are encrypted using authenticated AES-256-GCM with PBKDF2 key derivation and distinct IVs per transaction.',
    cfgVaultAlgo: 'Vault Algorithm',
    cfgVaultSig: 'Digital Signature',
    cfgVaultMasking: 'PII Masking',
    cfgVaultMaskingActive: 'Active in Audit Trail',
  },
  es: {
    // Brand & Header
    appTitle: 'Factura Electrónica CR',
    appSubtitle: 'Ministerio de Hacienda · Sistema Oficial de Emisión y Recepción v4.3 / v4.4',
    versionBadge: 'DGT Hacienda',
    versionSwitcherLabel: 'Versión Esquema',
    compareVersionsBtn: 'Comparar v4.3 vs v4.4',
    version43Label: 'v4.3 Previo (DGT-R-033-2019)',
    version44Label: 'v4.4 Vigente (TRIBU-CR / REP)',
    versionModalTitle: 'Factura Electrónica Costa Rica: Comparativa de Especificación v4.3 vs v4.4',
    versionModalSubtitle: 'Guía técnica y normativa del Ministerio de Hacienda & Dirección General de Tributación',
    switchSuccessToast: 'Versión de esquema tributario cambiada exitosamente a',
    sandboxMode: 'Modo Sandbox',
    sandboxLive: 'Sandbox ATV En Vivo (stag)',
    sandboxSim: 'Sandbox Simulador Inteligente',
    vaultEncrypted: 'Bóveda AES-256-GCM',
    xadesSignature: 'XAdES-EPES PKCS#12',
    themeToggle: 'Cambiar a Tema Claro / Oscuro',
    languageToggle: 'English',
    currentCompany: 'Empresa Activa',
    switchCompany: 'Cambiar Empresa',
    registerCompany: 'Registrar Nueva Empresa',
    signIn: 'Iniciar Sesión',
    signUp: 'Registrarse',
    signOut: 'Cerrar Sesión',
    welcomeUser: 'Bienvenido',
    roleAdmin: 'Super Administrador',
    roleAccountant: 'Contador Público / Privado (CPA)',
    roleLawyer: 'Abogado / Asesor Legal Tributario',

    // Tabs
    tabInvoicing: '1. Emisión & Cola de Envíos',
    tabB2BReception: '2. Recepción B2B (Compras)',
    tabBulk: '3. Procesamiento Masivo (Bulk)',
    tabAudit: '4. Auditoría y Bitácora Oficial',
    tabAccountantDesk: 'Despacho Contable',
    tabLawyerDesk: 'Despacho Legal',
    tabAdminHub: 'Panel Multi-Empresa Admin',

    // Stats
    statIssued: 'Comprobantes Emitidos',
    statApproved: 'Aprobados Hacienda',
    statPending: 'En Cola / Validación',
    statTaxBalance: 'IVA Fiscal por Declarar',
    statSuccessRate: 'Tasa Aprobación',
    statAvgLatency: 'latencia prom.',
    statDebit: 'IVA Débito',
    statCredit: 'IVA Crédito',
    statRejected: 'rechazados',

    // Step Guide Banner
    guideTitle: 'Asistente Tributario Guiado · Sugerencia de Siguiente Paso',
    guideDismiss: 'Ocultar',
    stepGenCompleted: 'Paso 1 Completado: Comprobante electrónico generado localmente con clave de 50 dígitos.',
    stepGenNextAction: 'Siguiente Paso: Firmar digitalmente con XAdES-EPES PKCS#12 y transmitir a Sandbox Hacienda.',
    stepSubCompleted: 'Paso 2 y 3 Completado: Documento enviado a cola de validación de Hacienda (HTTP 202).',
    stepSubNextAction: 'Siguiente Paso: Consultar estado asíncrono para verificar autorización oficial.',
    stepAppCompleted: 'Paso 4 Completado: Documento ACEPTADO y autorizado oficialmente por Hacienda.',
    stepAppNextAction: 'Siguiente Paso: Inspeccionar XML firmado con QR oficial o registrar facturas de proveedores en Recepción B2B.',
    stepRecCompleted: 'Paso 5 Completado: Mensaje Receptor B2B procesado para deducción fiscal.',
    stepRecNextAction: 'Siguiente Paso: Revisar la acreditación del IVA en la declaración Formulario D-104 en el Despacho Contable.',
    stepErrDetected: 'Alerta de Transmisión: El comprobante presentó un error o rechazo de validación.',
    stepErrNextAction: 'Siguiente Paso: Revisar diagnóstico de error, verificar cédula/CABYS o activar reintento exponencial.',

    // Invoicing Form & Validations
    formNewDocTitle: 'Emisión de Comprobante Electrónico v4.3',
    formDocType: 'Tipo de Comprobante',
    formCurrency: 'Moneda',
    formExchangeRate: 'Tipo de Cambio (BCCR)',
    formSaleCondition: 'Condición de Venta',
    formPaymentMethod: 'Medio de Pago',
    formCreditTerm: 'Plazo Crédito (Días)',
    formDays: 'Días',
    customerData: 'Datos del Cliente / Receptor',
    customerName: 'Nombre / Razón Social Cliente',
    customerIdType: 'Tipo Identificación',
    customerIdNumber: 'Número de Cédula',
    customerEmail: 'Correo para Notificación XML',
    lineItems: 'Líneas de Detalle (Catálogo Oficial CABYS v4.3)',
    addLine: 'Agregar Línea',
    cabysCode: 'Código CABYS (13 dígitos)',
    itemDetail: 'Detalle del Servicio / Bien',
    itemQty: 'Cant.',
    itemUnitPrice: 'Precio Unit.',
    itemVatRate: 'Tarifa IVA',
    itemVatAmount: 'Impuesto',
    itemTotal: 'Total Línea',
    subtotalNet: 'Subtotal Neto',
    totalVat: 'Total IVA',
    totalInvoice: 'Total Comprobante',
    btnSignAndSubmit: 'Firmar Digitalmente y Transmitir a Hacienda',
    btnSigning: 'Firmando y Transmitiendo...',
    searchCabys: 'Buscar en Catálogo CABYS',

    // Validation Hints
    hintDocType: '01: Factura (contribuyente con cédula). 04: Tiquete (consumidor final). 03: Nota Crédito (devoluciones/anulaciones). 08: Factura Compra (compras a régimen simplificado). 09: Factura Exportación (0% IVA).',
    hintClave50: 'Clave numérica de 50 dígitos: Código país 506 + Fecha (DDMMAA) + 12 dígitos cédula + 20 dígitos consecutivo + 1 dígito situación + 8 dígitos seguridad.',
    hintCedula: 'Física: 9 dígitos (ej: 101230456). Jurídica: 10 dígitos (ej: 3101123456). DIMEX: 11-12 dígitos extranjeros. NITE: 10 dígitos tributarios.',
    hintCabys: 'Código obligatorio de 13 dígitos establecido por el BCCR y Hacienda que categoriza el bien o servicio y determina su tarifa tributaria.',
    hintVatRates: '13% General estándar. 8% Turismo registrado en ICT. 4% Servicios de Salud privados. 2% Educación. 1% Canasta Básica. 0% Exento.',
    hintSaleCondition: '01: Contado (pago inmediato). 02: Crédito (especificar días de plazo). 03: Consignación.',
    hintPaymentMethod: '04: Transferencia bancaria / SINPE Móvil. 02: Tarjeta crédito/débito. 01: Efectivo. 03: Cheque.',
    hintB2BMensaje: '05: Aceptado (100% deducible). 06: Aceptado Parcialmente. 07: Rechazado (impugnación comercial o datos tributarios erróneos).',
    hintTaxCredit: 'Indica si aplica crédito fiscal pleno (01), parcial (02), bienes de capital (03), gasto corriente no deducible (04) o proporcionalidad (05).',

    // Queue
    queueTitle: 'Cola de Envío y Validación Asíncrona',
    queueSubtitle: 'Monitoreo en tiempo real de estados de recepción, respuestas oficiales de Hacienda y reintentos automatizados.',
    filterAllStatus: 'Todos los Estados',
    filterAccepted: 'Aceptados por Hacienda',
    filterProcessing: 'En Validación Asíncrona',
    filterRejected: 'Rechazados por Hacienda',
    filterError: 'Error de Red / En Reintento',
    searchPlaceholder: 'Buscar por clave, consecutivo o cliente...',
    colTypeSeq: 'Tipo / Consecutivo',
    colClave: 'Clave Numérica (50d)',
    colCustomer: 'Cliente / Receptor',
    colDate: 'Fecha Emisión',
    colTotal: 'Monto Total',
    colHaciendaStatus: 'Estado Hacienda',
    colActions: 'Acciones',
    actionDetails: 'Detalle & XML',
    actionRetry: 'Reintentar',
    actionCheckStatus: 'Consultar Estado',

    // B2B Reception
    b2bTitle: 'B2B Recepción de Comprobantes (Mensaje Receptor)',
    b2bSubtitle: 'Genera MensajeReceptor v4.3 (Códigos 05, 06, 07) para deducir compras y aplicar crédito fiscal de IVA ante Hacienda.',
    b2bClaveInput: 'Clave Numérica de Factura del Proveedor (50 dígitos) *',
    b2bDecision: 'Decisión del Receptor (Código Hacienda)',
    b2bDecision05: '05 - Aceptado (Aceptación Total / Crédito)',
    b2bDecision06: '06 - Aceptado Parcialmente',
    b2bDecision07: '07 - Rechazado (Rechazo Total)',
    b2bSupplierName: 'Razón Social del Proveedor',
    b2bSupplierId: 'Cédula del Proveedor',
    b2bInvoiceTotal: 'Total Factura Proveedor',
    b2bVatTotal: 'Monto Total IVA Proveedor',
    b2bTaxCondition: 'Condición Impuesto (D-104)',
    b2bCreditAmount: 'Monto IVA a Acreditar',
    b2bDetailNote: 'Motivo / Detalle del Mensaje Receptor',
    b2bSubmitBtn: 'Firmar y Enviar Mensaje Receptor a Hacienda',
    b2bSampleBtn: 'Generar Clave Proveedor de Prueba',
    b2bHistoryTitle: 'Historial de Comprobantes Recibidos de Proveedores',

    // Bulk Processing
    bulkTitle: 'Procesamiento Masivo de Comprobantes (Bulk Processing)',
    bulkSubtitle: 'Genera lotes masivos de comprobantes electrónicos, firma digitalmente en paralelo y transmite a la cola de Hacienda.',
    bulkBatchSize: 'Tamaño del Lote',
    bulkRegime: 'Régimen Tributario',
    bulkAvgAmount: 'Monto Promedio Factura',
    bulkPipelineDesc: 'Pipeline: 1. Asignación de 50-digit Claves · 2. Firma XAdES-EPES PKCS#12 · 3. Envío HTTP 202 a Sandbox',
    bulkExecuteBtn: 'Generar y Transmitir Lote',
    bulkProcessingText: 'Procesando Lote Concurrente...',

    // Audit Logs
    auditTitle: 'Pistas de Auditoría y Bitácora de Transmisiones',
    auditSubtitle: 'Registro inmutable de firmas criptográficas, peticiones HTTP, tiempos de respuesta y respuestas de Hacienda.',
    auditExportCsv: 'Exportar CSV',
    auditExportJson: 'Exportar JSON',
    auditFilterStep: 'Filtrar Paso',
    auditFilterStatus: 'Filtrar Estado',
    auditColTime: 'Hora',
    auditColStep: 'Paso del Proceso',
    auditColStatus: 'Estado',
    auditColHttp: 'HTTP',
    auditColLatency: 'Latencia',
    auditColDetail: 'Detalle y Mensaje de Auditoría',
    auditColClave: 'Clave Asociada',

    // Accountant Desk
    accountantTitle: 'Despacho Contable & Cumplimiento Tributario',
    accountantSubtitle: 'Conciliación mensual de IVA, preparación del Formulario D-104, clasificación CABYS y libros oficiales.',
    accountantDuties: 'Responsabilidades del Contador: Emitir facturación en representación de clientes, conciliar IVA Cobrado (Débito) vs IVA Pagado (Crédito), elaborar la declaración mensual D-104, clasificar gastos y aprobar mensajes de recepción.',
    accountantD104Title: 'Declaración Mensual de IVA (Formulario D-104)',
    accountantReconcileTitle: 'Conciliación IVA Débito vs Crédito Fiscal',
    accountantExpenseCat: 'Auditoría y Clasificación de Gastos CABYS',
    accountantSalesLedger: 'Libro Oficial de Ventas (Ingresos)',
    accountantPurchasesLedger: 'Libro Oficial de Compras (Crédito Fiscal)',
    accountantExportReports: 'Exportar Paquete Contable Completo',
    accountantGenerateD104: 'Emitir Reporte Oficial D-104',

    // Lawyer Desk
    lawyerTitle: 'Despacho Legal & Validez Criptográfica',
    lawyerSubtitle: 'Auditoría legal según Ley 8454 de Firma Digital, vigencia de certificados, personería y litigios fiscales.',
    lawyerDuties: 'Responsabilidades del Abogado: Certificar la validez de la personería jurídica, auditar el cumplimiento de la Ley 8454 de Firma Digital y certificados PKCS#12, fundamentar legalmente anulaciones con Notas de Crédito y emitir sellos de certificación legal.',
    lawyerCertAuditTitle: 'Auditoría de Certificados Ley 8454 de Costa Rica',
    lawyerLegalStamp: 'Sello de Certificación Legal Tributaria',
    lawyerPersoneriaTitle: 'Registro y Estado de Personería Jurídica',
    lawyerCreditNoteLegal: 'Fundamentación Legal de Notas de Crédito / Débito',
    lawyerDisputeTitle: 'Gestión de Controversias y Facturas Impugnadas',
    lawyerIssueCert: 'Emitir Certificación de Cumplimiento Legal',

    // Admin Hub
    adminTitle: 'Panel de Control Multi-Empresa (Admin Hub)',
    adminSubtitle: 'Supervisión integral de todas las empresas inscritas, reportes contables consolidados y gestión de roles.',
    adminCompanyList: 'Empresas Clientes Inscritas',
    adminAllReports: 'Generar Todos los Reportes Contables de una Empresa',
    adminRegisterCompBtn: 'Inscribir Nueva Empresa',
    adminEnrollUser: 'Asignar Contadores y Abogados a Empresas',
    adminTotalCompanies: 'Total Empresas Activas',
    adminGlobalVat: 'IVA Global Administrado',
    adminConsolidatedReport: 'Paquete Consolidado Contable & Legal',

    // Modals & Common
    close: 'Cerrar',
    save: 'Guardar Cambios',
    cancel: 'Cancelar',
    download: 'Descargar',
    copy: 'Copiar',
    copied: '¡Copiado!',
    print: 'Imprimir',
    testScenariosBtn: 'Escenarios Sandbox',
    reportsD104Btn: 'Reporte D-104',

    // Notifications & Header
    notificationsTitle: 'Notificaciones',
    notificationsClear: 'Limpiar',
    notificationsEmpty: 'No hay notificaciones pendientes.',
    settingsTooltip: 'Configuración de Hacienda y Certificado .p12',

    // Footer
    footerAuthority: 'Ministerio de Hacienda de Costa Rica · Dirección General de Tributación · Formato v4.3 / v4.4',
    footerSecurity: 'Firma XAdES-EPES · Ley 8454 · Bóveda Cifrada AES-256-GCM',

    // Sandbox & Vault Settings Modal
    cfgModalTitle: 'Configuración del Sandbox Ministerio de Hacienda & Bóveda Criptográfica',
    cfgModalSubtitle: 'Parámetros oficiales de conexión ATV, llave criptográfica .p12 y escenarios tributarios.',
    cfgTabHacienda: 'Credenciales Sandbox & Certificado .p12',
    cfgTabScenarios: 'Escenarios Tributarios Preconfigurados',
    cfgTabVault: 'Seguridad Bóveda AES-256-GCM',
    cfgVersionTitle: 'Versión de Factura Electrónica (Ministerio de Hacienda)',
    cfgV44Title: 'Versión 4.4 (TRIBU-CR / Vigente)',
    cfgV44Badge: 'Recomendado',
    cfgV44Desc: 'Esquemas XML v4.4, Recibo Electrónico de Pago (REP), soporte dedicado para SINPE Móvil, y desglose de "No Sujeto" vs "Exento".',
    cfgV43Title: 'Versión 4.3 (Estándar Previo / ATV)',
    cfgV43Badge: 'Legacy',
    cfgV43Desc: 'Esquemas XML v4.3 (Resolución DGT-R-033-2019), Factura tradicional, Notas de Crédito/Débito y Tiquetes sin REP.',
    cfgSandboxModeTitle: 'Modalidad de Sandbox Tributario',
    cfgSimTitle: 'Sandbox Simulador Inteligente',
    cfgSimDesc: 'Emula 100% de la API de Hacienda v4.3 & v4.4, valida firmas XAdES-EPES, genera RespuestaHacienda oficial, y permite probar de inmediato sin esperar credenciales ATV.',
    cfgLiveTitle: 'Sandbox en Vivo ATV (Staging)',
    cfgLiveDesc: 'Conecta vía proxy a idp.comprobanteselectronicos.go.cr y api.comprobanteselectronicos.go.cr/recepcion-sandbox/v1/ con tus credenciales reales.',
    cfgTaxpayerName: 'Nombre / Razón Social Contribuyente',
    cfgTaxpayerId: 'Cédula del Emisor',
    cfgEconomicCode: 'Código de Actividad Económica (6 dígitos)',
    cfgTaxRegime: 'Régimen Tributario',
    cfgRegimeTraditional: 'Régimen Tradicional (General)',
    cfgRegimeSimplified: 'Régimen de Tributación Simplificada',
    cfgRegimeFreeZone: 'Régimen de Zona Franca',
    cfgRegimeAgro: 'Régimen Agropecuario',
    cfgAtvTitle: 'Credenciales de API ATV (Ministerio de Hacienda)',
    cfgAtvUsername: 'Usuario ATV (IDP Stag)',
    cfgAtvPassword: 'Contraseña API ATV',
    cfgAtvEncryptedPass: '•••••••••••• (Cifrada en bóveda)',
    cfgAtvEnterPass: 'Ingresa contraseña API',
    cfgP12Title: 'Certificado Criptográfico PKCS#12 (.p12)',
    cfgP12Badge: 'Firma XAdES-EPES',
    cfgP12Pin: 'PIN de la Llave Criptográfica',
    cfgP12PinPlaceholder: 'PIN de 4 dígitos (ej: 1234)',
    cfgP12Upload: 'Subir Archivo .p12',
    cfgP12SelectFile: 'Seleccionar .p12 oficial',
    cfgBtnSave: 'Guardar y Asegurar en Bóveda',
    cfgBtnSaving: 'Guardando en Bóveda...',
    cfgScenariosDesc: 'Ejecuta con un clic los escenarios de prueba oficiales requeridos por el Ministerio de Hacienda para certificar sistemas de facturación:',
    cfgScen1Title: '1. Venta General 13% IVA',
    cfgScen1Desc: 'Régimen Tradicional, factura estándar con IVA general (Tarifa 08).',
    cfgScen2Title: '2. Servicios de Salud 4% IVA',
    cfgScen2Desc: 'Tarifa Reducida según Art. 26 Ley 9635 para servicios médicos.',
    cfgScen3Title: '3. Servicios de Turismo 8% IVA',
    cfgScen3Desc: 'Tarifa Transitoria Ley 9882 para hospedaje y agencias registradas ante ICT.',
    cfgScen4Title: '4. Factura Exportación (FEE 09)',
    cfgScen4Desc: 'Servicios exportados en USD, tarifa 0% Exento a cliente no residente.',
    cfgScen5Title: '5. Factura de Compra (FEC 08)',
    cfgScen5Desc: 'Compra a proveedor en Régimen de Tributación Simplificada.',
    cfgScen6Title: '6. Prueba Clave Duplicada (Rechazo)',
    cfgScen6Desc: 'Simula rechazo 400 de Hacienda por clave previamente registrada.',
    cfgScen7Title: '7. Prueba Firma Inválida (Rechazo)',
    cfgScen7Desc: 'Simulates rejection for untrusted certificate or corrupt digest.',
    cfgScen8Title: '8. Prueba Caída 503 & Reintento',
    cfgScen8Desc: 'Simula caída transitoria HTTP 503 y activa cola de reintentos exponenciales.',
    cfgBtnTest: 'Probar',
    cfgVaultTitle: 'Bóveda de Seguridad Criptográfica y Registros Financieros',
    cfgVaultDesc: 'Para cumplir con la directriz de seguridad de datos tributarios, todos los registros financieros, certificados PKCS#12, llaves privadas y credenciales del Ministerio de Hacienda se resguardan mediante cifrado autenticado AES-256-GCM con derivación PBKDF2 y vectores de inicialización (IV) criptográficamente seguros por cada transacción.',
    cfgVaultAlgo: 'Algoritmo Bóveda',
    cfgVaultSig: 'Firma Digital',
    cfgVaultMasking: 'Enmascaramiento',
    cfgVaultMaskingActive: 'Activo en Auditoría',
  },
};

/**
 * Helper to localize notification title and message dynamically if emitted in Spanish.
 */
export function localizeNotification(lang: Language, title: string, message: string): { title: string; message: string } {
  if (lang === 'es') return { title, message };

  let locTitle = title;
  let locMsg = message;

  if (title.includes('Lote de Facturación Masiva')) locTitle = 'Bulk Invoicing Batch';
  else if (title.includes('Versión de Esquema Actualizada')) locTitle = 'Schema Version Updated';
  else if (title.includes('Nueva empresa registrada')) locTitle = 'New Company Registered';
  else if (title.includes('Comprobante')) locTitle = 'Electronic Document';
  else if (title.includes('Firma')) locTitle = 'Cryptographic Signature';
  else if (title.includes('Hacienda')) locTitle = 'Tax Authority Update';

  if (message.includes('Se emitieron y firmaron')) {
    locMsg = message.replace(/Se emitieron y firmaron (\d+) comprobantes para (.+)/, 'Generated and digitally signed $1 documents for $2');
  } else if (message.includes('ahora opera bajo la especificación')) {
    locMsg = message.replace(/La empresa (.+) ahora opera bajo la especificación v([\d.]+) del Ministerio de Hacienda\./, 'Company $1 now operates under Ministerio de Hacienda v$2 specification.');
  }

  return { title: locTitle, message: locMsg };
}
