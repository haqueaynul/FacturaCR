/**
 * @file src/components/ApiDocsModal.tsx
 * @description Interactive OpenAPI 3.0-style REST API Documentation & Live Explorer
 * for Costa Rica Ministerio de Hacienda v4.3 & v4.4 Electronic Invoicing Hub.
 * Provides interactive request execution ("Try it out"), Copy-as-cURL,
 * schema inspection, and downloadable OpenAPI specification.
 */

import React, { useState } from 'react';
import {
  X,
  Search,
  Code2,
  Copy,
  Check,
  Play,
  Terminal,
  Download,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Hash,
  AlertCircle,
} from 'lucide-react';
import { Language } from '../i18n';

interface ApiDocsModalProps {
  lang: Language;
  theme: 'dark' | 'bright';
  onClose: () => void;
}

interface ApiEndpoint {
  id: string;
  category: 'auth' | 'companies' | 'config' | 'documents' | 'reception' | 'reports' | 'sandbox';
  method: 'GET' | 'POST';
  path: string;
  titleEn: string;
  titleEs: string;
  descEn: string;
  descEs: string;
  rolesRequired: string[];
  headers?: Record<string, string>;
  queryParams?: { name: string; type: string; required: boolean; descEn: string; descEs: string }[];
  requestBodySample?: Record<string, unknown>;
  responseStatus: number;
  responseSample: Record<string, unknown> | Array<unknown>;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // 1. AUTH
  {
    id: 'auth-me',
    category: 'auth',
    method: 'GET',
    path: '/api/auth/me',
    titleEn: 'Get Current Authenticated User Session',
    titleEs: 'Obtener Sesión del Usuario Autenticado',
    descEn: 'Returns the active user profile, assigned role (Admin, Accountant, Lawyer), and permitted client companies.',
    descEs: 'Devuelve el perfil del usuario activo, rol asignado (Admin, Contador, Abogado) y empresas cliente permitidas.',
    rolesRequired: ['Public / Any'],
    responseStatus: 200,
    responseSample: {
      user: {
        id: 'USR-ADMIN',
        name: 'Carlos Solano (Super Administrador)',
        email: 'admin@hacienda-hub.cr',
        role: 'admin',
        companyIds: ['COMP-1', 'COMP-2', 'COMP-3'],
      },
    },
  },
  {
    id: 'auth-signin',
    category: 'auth',
    method: 'POST',
    path: '/api/auth/signin',
    titleEn: 'User Authentication / Login',
    titleEs: 'Autenticación / Inicio de Sesión',
    descEn: 'Authenticates a user with email and password, establishing the active session and role context.',
    descEs: 'Autentica a un usuario con correo y contraseña, estableciendo la sesión activa y el contexto de rol.',
    rolesRequired: ['Public'],
    headers: { 'Content-Type': 'application/json' },
    requestBodySample: {
      email: 'admin@hacienda-hub.cr',
      password: 'adminPassword123!',
    },
    responseStatus: 200,
    responseSample: {
      success: true,
      user: {
        id: 'USR-ADMIN',
        name: 'Carlos Solano (Super Administrador)',
        email: 'admin@hacienda-hub.cr',
        role: 'admin',
        companyIds: ['COMP-1', 'COMP-2', 'COMP-3'],
      },
    },
  },
  {
    id: 'auth-signup',
    category: 'auth',
    method: 'POST',
    path: '/api/auth/signup',
    titleEn: 'Register Professional User (CPA / Lawyer / Admin)',
    titleEs: 'Registrar Usuario Profesional (CPA / Abogado / Admin)',
    descEn: 'Enrolls a new professional with verified bar/CPA license number and assigned company access.',
    descEs: 'Inscribe a un nuevo profesional con número de colegiado CPA/Abogados y acceso a empresas.',
    rolesRequired: ['Public'],
    headers: { 'Content-Type': 'application/json' },
    requestBodySample: {
      name: 'Licda. Gabriela Méndez CPA',
      email: 'gmendez@cpacr.com',
      password: 'PasswordSecure123!',
      role: 'accountant',
      licenseNumber: 'CPA-CR-22194',
    },
    responseStatus: 201,
    responseSample: {
      success: true,
      user: {
        id: 'USR-22194',
        name: 'Licda. Gabriela Méndez CPA',
        email: 'gmendez@cpacr.com',
        role: 'accountant',
        licenseNumber: 'CPA-CR-22194',
        companyIds: ['COMP-1'],
      },
    },
  },
  {
    id: 'auth-signout',
    category: 'auth',
    method: 'POST',
    path: '/api/auth/signout',
    titleEn: 'Sign Out / Terminate Session',
    titleEs: 'Cerrar Sesión / Terminar Sesión',
    descEn: 'Clears the current session and resets context to default administrative profile.',
    descEs: 'Limpia la sesión actual y restablece el contexto al perfil administrativo predeterminado.',
    rolesRequired: ['Any authenticated user'],
    responseStatus: 200,
    responseSample: { success: true, message: 'Sesión finalizada.' },
  },

  // 2. COMPANIES
  {
    id: 'companies-list',
    category: 'companies',
    method: 'GET',
    path: '/api/companies',
    titleEn: 'List Accessible Enrolled Companies',
    titleEs: 'Listar Empresas Inscritas Accesibles',
    descEn: 'Retrieves all taxpayer entities registered in the hub. Filtered by authorized companies for Accountants/Lawyers.',
    descEs: 'Obtiene todas las entidades contribuyentes registradas. Filtrado según permisos para Contadores/Abogados.',
    rolesRequired: ['Admin', 'Accountant', 'Lawyer'],
    responseStatus: 200,
    responseSample: [
      {
        id: 'COMP-1',
        nombre: 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.',
        cedula: '3101123456',
        tipoCedula: '02',
        codigoActividad: '620101',
        regimenTributario: 'tradicional',
        schemaVersion: '4.4',
        p12Status: 'valid',
      },
    ],
  },
  {
    id: 'companies-create',
    category: 'companies',
    method: 'POST',
    path: '/api/companies',
    titleEn: 'Enroll New Taxpayer Entity',
    titleEs: 'Inscribir Nueva Empresa Contribuyente',
    descEn: 'Registers a new legal entity or individual taxpayer with branch, POS, and economic activity code.',
    descEs: 'Inscribe una nueva entidad jurídica o persona física con sucursal, punto de venta y código de actividad.',
    rolesRequired: ['Admin', 'Accountant'],
    headers: { 'Content-Type': 'application/json' },
    requestBodySample: {
      nombre: 'INNOVA CONSULTING GROUP S.A.',
      nombreComercial: 'INNOVA TECH',
      cedula: '3101999888',
      tipoCedula: '02',
      codigoActividad: '620101',
      regimenTributario: 'tradicional',
      correo: 'facturacion@innovacr.com',
      telefono: '2299-8800',
      sucursal: '001',
      puntoVenta: '00001',
    },
    responseStatus: 201,
    responseSample: {
      id: 'COMP-4',
      nombre: 'INNOVA CONSULTING GROUP S.A.',
      cedula: '3101999888',
      sucursal: '001',
      puntoVenta: '00001',
      schemaVersion: '4.4',
      p12Status: 'valid',
    },
  },
  {
    id: 'companies-activate',
    category: 'companies',
    method: 'POST',
    path: '/api/companies/:id/activate',
    titleEn: 'Switch Active Company Workspace',
    titleEs: 'Cambiar Empresa Activa de Trabajo',
    descEn: 'Sets the active company context for invoice generation, certificate signing, and tax calculations.',
    descEs: 'Establece la empresa activa para emisión de facturas, firma digital y liquidaciones tributarias.',
    rolesRequired: ['Admin', 'Accountant', 'Lawyer'],
    responseStatus: 200,
    responseSample: {
      success: true,
      activeCompany: {
        id: 'COMP-1',
        nombre: 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.',
        cedula: '3101123456',
        schemaVersion: '4.4',
      },
    },
  },

  // 3. CONFIG & SCHEMAS
  {
    id: 'config-get',
    category: 'config',
    method: 'GET',
    path: '/api/config',
    titleEn: 'Get Taxpayer Configuration & ATV Status',
    titleEs: 'Consultar Configuración del Contribuyente y Estado ATV',
    descEn: 'Retrieves active company settings, branch, ATV staging user, and cryptographic certificate expiration.',
    descEs: 'Obtiene la configuración activa, sucursal, usuario ATV sandbox y vencimiento del certificado criptográfico.',
    rolesRequired: ['Any authenticated user'],
    responseStatus: 200,
    responseSample: {
      id: 'COMP-1',
      nombre: 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.',
      cedula: '3101123456',
      schemaVersion: '4.4',
      atvUsername: 'cpf-02-3101-123456@stag.comprobanteselectronicos.go.cr',
      useLiveSandbox: false,
      p12Status: 'valid',
      p12ExpiryDate: '2028-12-31',
    },
  },
  {
    id: 'config-update',
    category: 'config',
    method: 'POST',
    path: '/api/config',
    titleEn: 'Update ATV Credentials & Encrypted PKCS#12 Vault',
    titleEs: 'Actualizar Credenciales ATV y Bóveda Cifrada PKCS#12',
    descEn: 'Stores ATV passwords and .p12 cryptographic keys using hardware-grade AES-256-GCM encryption in server memory.',
    descEs: 'Almacena contraseñas ATV y llaves criptográficas .p12 con cifrado AES-256-GCM en el servidor.',
    rolesRequired: ['Admin', 'Lawyer'],
    headers: { 'Content-Type': 'application/json' },
    requestBodySample: {
      atvPassword: 'NewSecureATVPassword2026#',
      pinP12: '1234',
      useLiveSandbox: true,
    },
    responseStatus: 200,
    responseSample: {
      success: true,
      message: 'Configuración actualizada en bóveda.',
    },
  },
  {
    id: 'config-schema-version',
    category: 'config',
    method: 'POST',
    path: '/api/config/schema-version',
    titleEn: 'Toggle Ministry of Finance Schema (v4.3 <-> v4.4)',
    titleEs: 'Alternar Esquema del Ministerio de Hacienda (v4.3 <-> v4.4)',
    descEn: 'Switches the company active schema specification between legacy v4.3 and new v4.4 (with REP and SINPE Móvil).',
    descEs: 'Alterna el esquema activo de la empresa entre la versión anterior v4.3 y la nueva v4.4 (con REP y SINPE Móvil).',
    rolesRequired: ['Admin', 'Accountant'],
    headers: { 'Content-Type': 'application/json' },
    requestBodySample: { schemaVersion: '4.4' },
    responseStatus: 200,
    responseSample: {
      success: true,
      schemaVersion: '4.4',
      company: { id: 'COMP-1', schemaVersion: '4.4' },
    },
  },

  // 4. ELECTRONIC DOCUMENTS
  {
    id: 'documents-list',
    category: 'documents',
    method: 'GET',
    path: '/api/documents',
    titleEn: 'Query Emitted Electronic Documents',
    titleEs: 'Consultar Comprobantes Electrónicos Emitidos',
    descEn: 'Lists emitted invoices, debit notes, credit notes, tickets, and REP vouchers with filtering options.',
    descEs: 'Lista facturas, notas de débito, notas de crédito, tiquetes y comprobantes REP con filtros.',
    rolesRequired: ['Any authenticated user'],
    queryParams: [
      { name: 'companyId', type: 'string', required: false, descEn: 'Filter by specific company ID', descEs: 'Filtrar por ID de empresa' },
      { name: 'estado', type: 'string', required: false, descEn: 'Filter by state (aceptado, rechazado, procesando, firmado)', descEs: 'Filtrar por estado' },
      { name: 'tipo', type: 'string', required: false, descEn: 'Filter by document type (01, 02, 03, 04, 08, 09, 10)', descEs: 'Filtrar por tipo de documento' },
    ],
    responseStatus: 200,
    responseSample: [
      {
        id: 'DOC-1001',
        clave: '50603102600310112345600100001010000000001183920194',
        consecutivo: '00100001010000000001',
        tipoDocumento: '01',
        estado: 'aceptado',
        fechaEmision: '2026-10-02T18:30:00.000Z',
        resumen: { totalComprobante: 113000, totalImpuesto: 13000 },
      },
    ],
  },
  {
    id: 'documents-create',
    category: 'documents',
    method: 'POST',
    path: '/api/documents',
    titleEn: 'Emit, Cryptographically Sign & Transmit Invoice',
    titleEs: 'Emitir, Firmar Digitalmente y Enviar Factura',
    descEn: 'Generates the 50-digit Clave, builds official XML v4.3/v4.4, signs with XAdES-EPES, and queues submission to Hacienda.',
    descEs: 'Genera la Clave de 50 dígitos, construye el XML oficial, firma con XAdES-EPES y envía a Hacienda.',
    rolesRequired: ['Admin', 'Accountant'],
    headers: { 'Content-Type': 'application/json' },
    requestBodySample: {
      tipoDocumento: '01',
      moneda: 'CRC',
      tipoCambio: 1.0,
      condicionVenta: '01',
      medioPago: '04',
      receptor: {
        nombre: 'BANCO NACIONAL DE COSTA RICA',
        cedula: '4000042139',
        tipoCedula: '02',
        correo: 'facturacion@bncr.fi.cr',
      },
      items: [
        {
          codigoCabys: '8314100000000',
          detalle: 'Servicios de Consultoría de Software',
          cantidad: 1,
          unidadMedida: 'Sp',
          precioUnitario: 100000,
          tarifaIva: 13,
          codigoTarifaIva: '08',
          montoIva: 13000,
          montoTotalLinea: 113000,
        },
      ],
      autoSubmit: true,
    },
    responseStatus: 201,
    responseSample: {
      id: 'DOC-1002',
      clave: '50603102600310112345600100001010000000002194820148',
      consecutivo: '00100001010000000002',
      estado: 'firmado',
      digestValue: '3eL8F2d18...k=',
      signatureValue: 'XAdES...Signature==',
    },
  },
  {
    id: 'documents-submit',
    category: 'documents',
    method: 'POST',
    path: '/api/documents/:id/submit',
    titleEn: 'Manual Submit / Retry Transmission',
    titleEs: 'Envío Manual / Reintento de Transmisión',
    descEn: 'Retries transmission of a signed voucher that encountered a temporary network outage or 503 error.',
    descEs: 'Reintenta la transmisión de un comprobante que experimentó una falla de red o error 503 transitorio.',
    rolesRequired: ['Admin', 'Accountant'],
    responseStatus: 200,
    responseSample: {
      success: true,
      status: 'enviado',
      message: 'Comprobante transmitido al Sandbox de Hacienda.',
    },
  },
  {
    id: 'documents-status',
    category: 'documents',
    method: 'GET',
    path: '/api/documents/:id/status',
    titleEn: 'Query Asynchronous Processing Status (Hacienda)',
    titleEs: 'Consultar Estado Asíncrono en Hacienda',
    descEn: 'Polls the DGT reception endpoint and retrieves the official RespuestaHacienda XML resolution.',
    descEs: 'Consulta el endpoint de recepción DGT y obtiene la resolución oficial RespuestaHacienda en XML.',
    rolesRequired: ['Any authenticated user'],
    responseStatus: 200,
    responseSample: {
      id: 'DOC-1001',
      estado: 'aceptado',
      mensajeHacienda: 'Comprobante 5060310... aceptado formalmente por Tributación Directa.',
      fechaRespuestaHacienda: '2026-10-02T18:30:04.000Z',
    },
  },
  {
    id: 'documents-bulk',
    category: 'documents',
    method: 'POST',
    path: '/api/documents/bulk',
    titleEn: 'High-Volume Bulk Invoicing Batch',
    titleEs: 'Lote de Facturación Masiva de Alto Volumen',
    descEn: 'Concurrently generates, signs, and dispatches batches of 10 to 100 electronic vouchers with CABYS verification.',
    descEs: 'Genera, firma y despacha concurrentemente lotes de 10 a 100 comprobantes electrónicos con validación CABYS.',
    rolesRequired: ['Admin', 'Accountant'],
    headers: { 'Content-Type': 'application/json' },
    requestBodySample: {
      batchCount: 15,
      taxRegime: 'tradicional',
      baseAmount: 75000,
    },
    responseStatus: 200,
    responseSample: {
      success: true,
      batchSize: 15,
      message: 'Lote masivo de 15 comprobantes procesado exitosamente.',
    },
  },

  // 5. B2B RECEPTION
  {
    id: 'reception-list',
    category: 'reception',
    method: 'GET',
    path: '/api/reception',
    titleEn: 'List Received B2B Confirmation Messages',
    titleEs: 'Listar Mensajes Receptores B2B Confirmados',
    descEn: 'Retrieves all official buyer confirmation vouchers (Message 05 Accepted, 06 Partially Accepted, 07 Rejected).',
    descEs: 'Obtiene los comprobantes de confirmación del comprador (Mensaje 05 Aceptado, 06 Aceptado Parcial, 07 Rechazado).',
    rolesRequired: ['Admin', 'Accountant'],
    responseStatus: 200,
    responseSample: [
      {
        id: 'REC-5001',
        tipoMensaje: '05',
        claveDocumento: '50601102600310188811100100001010000000001188888888',
        montoTotalImpuestoAcreditar: 13000,
        estado: 'aceptado',
      },
    ],
  },
  {
    id: 'reception-submit',
    category: 'reception',
    method: 'POST',
    path: '/api/reception',
    titleEn: 'Submit B2B Acceptance / Rejection Message (05/06/07)',
    titleEs: 'Enviar Mensaje Receptor B2B (05/06/07)',
    descEn: 'Generates and signs the official buyer reception XML according to DGT resolution, legally locking the VAT credit.',
    descEs: 'Genera y firma el XML de mensaje receptor oficial fijando el crédito fiscal del IVA del comprador.',
    rolesRequired: ['Admin', 'Accountant'],
    headers: { 'Content-Type': 'application/json' },
    requestBodySample: {
      claveDocumento: '50601102600310188811100100001010000000001188888888',
      emisorCedula: '3101888111',
      tipoMensaje: '05',
      detalleMensaje: 'Aceptación total de compras para deducción en Formulario D-104',
      montoTotalImpuesto: 13000,
      totalFactura: 113000,
      condicionImpuesto: '01',
      montoTotalImpuestoAcreditar: 13000,
      montoTotalDeGastoAplicable: 100000,
    },
    responseStatus: 201,
    responseSample: {
      id: 'REC-5002',
      estado: 'aceptado',
      numeroConsecutivoReceptor: '00100001050000000002',
    },
  },
  {
    id: 'reception-supplier-invoices',
    category: 'reception',
    method: 'GET',
    path: '/api/reception/supplier-invoices',
    titleEn: 'Incoming Supplier Invoices & 8-Day Deadline Status',
    titleEs: 'Facturas de Proveedores Entrantes y Plazo de 8 Días Hábiles',
    descEn: 'Computes elapsed working days, days remaining, and violation flags under Article 48 of the Tax Code.',
    descEs: 'Calcula días hábiles transcurridos, días restantes y alerta de vencimiento según Art. 48 del Código Tributario.',
    rolesRequired: ['Admin', 'Accountant'],
    responseStatus: 200,
    responseSample: [
      {
        id: 'SUP-INV-1',
        clave: '50601102600310188811100100001010000000001188888888',
        emisorNombre: 'SERVICIOS INDUSTRIALES DEL NORTE S.A.',
        totalComprobante: 113000,
        diasHabilesTranscurridos: 10,
        isViolated: true,
        estadoRecepcion: 'pendiente',
      },
    ],
  },
  {
    id: 'reception-remedy',
    category: 'reception',
    method: 'POST',
    path: '/api/reception/supplier-invoices/remedy',
    titleEn: 'Apply Legal / Accounting Remedy for Deadline Violation',
    titleEs: 'Aplicar Remedio Legal / Contable por Vencimiento de Plazo',
    descEn: 'Applies recognized solutions: Supplier Annulment (NC 03) & re-issue, CPA late acceptance (Condition 04), or Rejection (07).',
    descEs: 'Aplica remedios reconocidos: Anulación y reemisión de proveedor, Aceptación tardía CPA (Condición 04), o Rechazo formal (07).',
    rolesRequired: ['Admin', 'Accountant', 'Lawyer'],
    headers: { 'Content-Type': 'application/json' },
    requestBodySample: {
      invoiceId: 'SUP-INV-1',
      remedyType: 'supplier_reissue',
      note: 'Solicitada anulación y reemisión con fecha actual.',
    },
    responseStatus: 200,
    responseSample: {
      success: true,
      remedyType: 'supplier_reissue',
      message: 'Plazo legal reiniciado exitosamente.',
    },
  },

  // 6. REPORTS & ANALYTICS
  {
    id: 'reports-summary',
    category: 'reports',
    method: 'GET',
    path: '/api/reports/summary',
    titleEn: 'Formulario D-104 Fiscal Summary & IVA Position',
    titleEs: 'Resumen Fiscal Formulario D-104 y Posición de IVA',
    descEn: 'Calculates VAT debit, deductible input credit, net liability balance, total net sales, and API round-trip latency.',
    descEs: 'Calcula débito fiscal de IVA, crédito acreditable, balance neto a pagar, ventas netas y latencia API.',
    rolesRequired: ['Any authenticated user'],
    responseStatus: 200,
    responseSample: {
      totalEmitidos: 45,
      aceptados: 44,
      rechazados: 1,
      tasaExito: '97.8',
      ivaDebitoFiscal: 1450000,
      ivaCreditoFiscal: 890000,
      balanceIvaPagar: 560000,
      totalVentasNetas: 11153846.15,
      avgResponseTimeMs: 382,
    },
  },
  {
    id: 'reports-admin-company',
    category: 'reports',
    method: 'GET',
    path: '/api/admin/reports/:companyId',
    titleEn: 'Consolidated Company Accounting & Legal Report',
    titleEs: 'Reporte Contable y Legal Consolidado de Empresa',
    descEn: 'Produces an executive breakdown of sales, purchases, VAT balance, and CPA/Lawyer compliance certifications.',
    descEs: 'Genera un desglose ejecutivo de ventas, compras, balance de IVA y certificaciones CPA/Legal.',
    rolesRequired: ['Admin'],
    responseStatus: 200,
    responseSample: {
      company: { id: 'COMP-1', nombre: 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.' },
      salesCount: 45,
      purchasesCount: 12,
      ivaDebito: 1450000,
      ivaCredito: 890000,
      ivaBalance: 560000,
      certifiedByAccountant: 'Lic. Roberto Morales (CPA #18920)',
      certifiedByLawyer: 'Licda. Mariana Jiménez (Colegio Abogados #24105)',
    },
  },

  // 7. SANDBOX & AUDIT
  {
    id: 'logs-list',
    category: 'sandbox',
    method: 'GET',
    path: '/api/logs',
    titleEn: 'Real-Time Regulatory Audit Trail (10 Steps)',
    titleEs: 'Pista de Auditoría Regulatoria en Tiempo Real (10 Pasos)',
    descEn: 'Streams the tamper-evident log trace from XML generation, XAdES-EPES signing, transmission, to final DGT resolution.',
    descEs: 'Transmite la pista de auditoría inmutable desde la generación de XML, firma XAdES, hasta la resolución DGT.',
    rolesRequired: ['Admin', 'Lawyer', 'Accountant'],
    responseStatus: 200,
    responseSample: [
      {
        id: 'LOG-1',
        step: 'SIGNING',
        status: 'SUCCESS',
        durationMs: 34,
        message: 'Firma XAdES-EPES generada con RSA-SHA256.',
        timestamp: '2026-10-02T22:00:00.000Z',
      },
    ],
  },
  {
    id: 'sandbox-preset-scenario',
    category: 'sandbox',
    method: 'POST',
    path: '/api/sandbox/preset-scenario',
    titleEn: 'Execute Automated Regulatory Test Scenario',
    titleEs: 'Ejecutar Escenario de Prueba Regulatorio Automatizado',
    descEn: 'Triggers one of 8 pre-configured test scenarios (Standard Sale 13%, Health 4%, Tourism 8%, Export FEE, Duplicate Clave, Corrupt Signature, 503 Retry, REP v4.4).',
    descEs: 'Ejecuta uno de los 8 escenarios de prueba oficiales (Venta 13%, Salud 4%, Turismo 8%, Exportación FEE, Clave Duplicada, Firma Inválida, Reintento 503, REP v4.4).',
    rolesRequired: ['Admin', 'Accountant', 'Lawyer'],
    headers: { 'Content-Type': 'application/json' },
    requestBodySample: { scenarioKey: 'standard_sale_13' },
    responseStatus: 200,
    responseSample: {
      id: 'DOC-SCENARIO-9421',
      tipoDocumento: '01',
      estado: 'firmado',
      consecutivo: '00100001010000000099',
    },
  },
];

export const ApiDocsModal: React.FC<ApiDocsModalProps> = ({ lang, theme, onClose }) => {
  const isBright = theme === 'bright';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'endpoints' | 'standards' | 'openapi'>('endpoints');
  const [expandedEndpointId, setExpandedEndpointId] = useState<string>(API_ENDPOINTS[0].id);

  // Live Tester State
  const [executingEndpointId, setExecutingEndpointId] = useState<string | null>(null);
  const [editableBodies, setEditableBodies] = useState<Record<string, string>>({});
  const [liveResponses, setLiveResponses] = useState<Record<string, { status: number; duration: number; data: unknown }>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    { id: 'all', nameEn: 'All Endpoints', nameEs: 'Todos' },
    { id: 'auth', nameEn: 'Authentication', nameEs: 'Autenticación' },
    { id: 'companies', nameEn: 'Companies', nameEs: 'Empresas' },
    { id: 'config', nameEn: 'Config & Schemas', nameEs: 'Configuración' },
    { id: 'documents', nameEn: 'Invoicing & XAdES', nameEs: 'Facturación' },
    { id: 'reception', nameEn: 'B2B Reception', nameEs: 'Recepción B2B' },
    { id: 'reports', nameEn: 'Fiscal Reports', nameEs: 'Reportes' },
    { id: 'sandbox', nameEn: 'Sandbox & Audit', nameEs: 'Sandbox y Auditoría' },
  ];

  const filteredEndpoints = API_ENDPOINTS.filter((ep) => {
    const matchesCat = selectedCategory === 'all' || ep.category === selectedCategory;
    const matchesMethod = selectedMethod === 'all' || ep.method === selectedMethod;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ep.path.toLowerCase().includes(query) ||
      ep.titleEn.toLowerCase().includes(query) ||
      ep.titleEs.toLowerCase().includes(query) ||
      ep.descEn.toLowerCase().includes(query) ||
      ep.descEs.toLowerCase().includes(query);
    return matchesCat && matchesMethod && matchesSearch;
  });

  const getCurlSnippet = (ep: ApiEndpoint): string => {
    const bodyText = editableBodies[ep.id] ?? (ep.requestBodySample ? JSON.stringify(ep.requestBodySample, null, 2) : '');
    const baseUrl = window.location.origin;
    let cmd = `curl -X ${ep.method} "${baseUrl}${ep.path}" \\\n`;
    cmd += `  -H "Accept: application/json"`;
    if (ep.method === 'POST') {
      cmd += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyText.replace(/\n/g, '')}'`;
    }
    return cmd;
  };

  const handleCopyCurl = (ep: ApiEndpoint) => {
    const snippet = getCurlSnippet(ep);
    navigator.clipboard.writeText(snippet);
    setCopiedId(ep.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExecuteLive = async (ep: ApiEndpoint) => {
    try {
      setExecutingEndpointId(ep.id);
      const startTime = performance.now();
      const bodyText = editableBodies[ep.id] ?? (ep.requestBodySample ? JSON.stringify(ep.requestBodySample) : undefined);

      let parsedBody: unknown = undefined;
      if (ep.method === 'POST' && bodyText) {
        try {
          parsedBody = JSON.parse(bodyText);
        } catch {
          alert('JSON del cuerpo inválido. Revisa la sintaxis.');
          setExecutingEndpointId(null);
          return;
        }
      }

      // Handle path parameters like :id or :companyId
      let actualPath = ep.path;
      if (actualPath.includes(':companyId')) actualPath = actualPath.replace(':companyId', 'COMP-1');
      if (actualPath.includes(':id')) actualPath = actualPath.replace(':id', 'DOC-1001');

      const res = await fetch(actualPath, {
        method: ep.method,
        headers: {
          Accept: 'application/json',
          ...(ep.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        body: ep.method === 'POST' && parsedBody ? JSON.stringify(parsedBody) : undefined,
      });

      const endTime = performance.now();
      const data = await res.json().catch(() => ({}));

      setLiveResponses((prev) => ({
        ...prev,
        [ep.id]: {
          status: res.status,
          duration: Math.round(endTime - startTime),
          data,
        },
      }));
    } catch (err: unknown) {
      setLiveResponses((prev) => ({
        ...prev,
        [ep.id]: {
          status: 500,
          duration: 0,
          data: { error: err instanceof Error ? err.message : String(err) },
        },
      }));
    } finally {
      setExecutingEndpointId(null);
    }
  };

  const handleDownloadOpenApi = () => {
    const spec = {
      openapi: '3.0.3',
      info: {
        title: 'Costa Rica Factura Electrónica API Hub (v4.3 & v4.4)',
        description: 'OpenAPI specification for Ministerio de Hacienda de Costa Rica Electronic Invoicing, XAdES Cryptography, and B2B Reception.',
        version: '4.4.0',
        contact: {
          name: 'Ministerio de Hacienda de Costa Rica - DGT',
          url: 'https://www.hacienda.go.cr',
        },
      },
      servers: [{ url: window.location.origin, description: 'Active Environment' }],
      paths: API_ENDPOINTS.reduce((acc, ep) => {
        acc[ep.path] = acc[ep.path] || {};
        acc[ep.path][ep.method.toLowerCase()] = {
          summary: lang === 'en' ? ep.titleEn : ep.titleEs,
          description: lang === 'en' ? ep.descEn : ep.descEs,
          tags: [ep.category],
          responses: {
            [ep.responseStatus]: {
              description: 'Successful response',
              content: { 'application/json': { example: ep.responseSample } },
            },
          },
        };
        return acc;
      }, {} as Record<string, Record<string, unknown>>),
    };

    const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hacienda-cr-openapi-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-5">
      <div
        className={`border rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl transition-colors ${
          isBright ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-200'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/90 border-slate-700'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className={`font-bold text-base ${isBright ? 'text-slate-900' : 'text-white'}`}>
                  {lang === 'en' ? 'REST API Documentation & Live Explorer' : 'Documentación y Explorador de API REST'}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  v4.3 / v4.4
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'en'
                  ? 'Ministerio de Hacienda de Costa Rica Electronic Invoicing Developer Reference'
                  : 'Referencia para Desarrolladores de Facturación Electrónica de Costa Rica'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadOpenApi}
              className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Download OpenAPI 3.0 JSON specification for Postman / Swagger"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OpenAPI 3.0</span>
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isBright ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`px-4 pt-2 border-b flex space-x-4 text-xs font-semibold ${
          isBright ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`pb-2.5 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'endpoints'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>{lang === 'en' ? 'API Endpoints & Live Runner' : 'Endpoints y Ejecutor en Vivo'} ({API_ENDPOINTS.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('standards')}
            className={`pb-2.5 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'standards'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{lang === 'en' ? 'Cryptographic & 50d Clave Spec' : 'Especificación Criptográfica y Clave 50d'}</span>
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'endpoints' && (
          <div className="flex-1 overflow-hidden flex flex-col p-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'en' ? 'Search by path, title, or description...' : 'Buscar por ruta, título o descripción...'}
                  className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none ${
                    isBright ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              {/* Method Selector */}
              <div className="flex items-center space-x-1 text-xs">
                {(['all', 'GET', 'POST'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMethod(m)}
                    className={`px-2.5 py-1.5 rounded-lg border font-mono font-semibold transition-colors cursor-pointer ${
                      selectedMethod === m
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : isBright
                        ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {m.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                      : isBright
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {lang === 'en' ? cat.nameEn : cat.nameEs}
                </button>
              ))}
            </div>

            {/* Endpoints Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredEndpoints.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {lang === 'en' ? 'No endpoints matched your search filter.' : 'No se encontraron endpoints con ese filtro.'}
                </div>
              ) : (
                filteredEndpoints.map((ep) => {
                  const isExpanded = expandedEndpointId === ep.id;
                  const liveRes = liveResponses[ep.id];
                  const currentBody = editableBodies[ep.id] ?? (ep.requestBodySample ? JSON.stringify(ep.requestBodySample, null, 2) : '');

                  return (
                    <div
                      key={ep.id}
                      className={`border rounded-xl transition-all overflow-hidden ${
                        isBright ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      {/* Endpoint Accordion Header */}
                      <div
                        onClick={() => setExpandedEndpointId(isExpanded ? '' : ep.id)}
                        className={`p-3 flex items-center justify-between cursor-pointer select-none transition-colors ${
                          isBright ? 'hover:bg-slate-100' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 ${
                              ep.method === 'GET'
                                ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {ep.method}
                          </span>
                          <span className={`font-mono text-xs font-semibold truncate ${
                            isBright ? 'text-slate-900' : 'text-slate-100'
                          }`}>
                            {ep.path}
                          </span>
                          <span className="text-xs text-slate-400 truncate hidden md:inline">
                            — {lang === 'en' ? ep.titleEn : ep.titleEs}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[10px] text-slate-500 uppercase px-1.5 py-0.5 rounded bg-slate-800/50">
                            {ep.rolesRequired[0]}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Endpoint Documentation & Live Runner */}
                      {isExpanded && (
                        <div className={`p-4 border-t space-y-4 ${
                          isBright ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
                        }`}>
                          <p className="text-xs text-slate-300">
                            {lang === 'en' ? ep.descEn : ep.descEs}
                          </p>

                          {/* cURL & Quick Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCopyCurl(ep)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                            >
                              {copiedId === ep.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === ep.id ? (lang === 'en' ? 'Copied!' : '¡Copiado!') : (lang === 'en' ? 'Copy cURL' : 'Copiar cURL')}</span>
                            </button>

                            <button
                              onClick={() => handleExecuteLive(ep)}
                              disabled={executingEndpointId === ep.id}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>
                                {executingEndpointId === ep.id
                                  ? (lang === 'en' ? 'Sending...' : 'Enviando...')
                                  : (lang === 'en' ? 'Execute Live' : 'Ejecutar en Vivo')}
                              </span>
                            </button>
                          </div>

                          {/* Request Body (If POST) */}
                          {ep.method === 'POST' && (
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                  {lang === 'en' ? 'Request Body (JSON - Editable for Live Execution)' : 'Cuerpo de la Petición (JSON - Editable)'}
                                </span>
                              </div>
                              <textarea
                                rows={6}
                                value={currentBody}
                                onChange={(e) => setEditableBodies({ ...editableBodies, [ep.id]: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-emerald-400 focus:outline-none"
                              />
                            </div>
                          )}

                          {/* Live Response Panel */}
                          {liveRes && (
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[11px] font-bold uppercase text-slate-400">
                                    {lang === 'en' ? 'Live Server Response:' : 'Respuesta del Servidor:'}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      liveRes.status >= 200 && liveRes.status < 300
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    }`}
                                  >
                                    HTTP {liveRes.status}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ⚡ {liveRes.duration} ms
                                  </span>
                                </div>
                                <button
                                  onClick={() => setLiveResponses((prev) => {
                                    const next = { ...prev };
                                    delete next[ep.id];
                                    return next;
                                  })}
                                  className="text-[10px] text-slate-400 hover:text-white"
                                >
                                  {lang === 'en' ? 'Clear' : 'Limpiar'}
                                </button>
                              </div>
                              <pre className="max-h-48 overflow-y-auto text-[11px] font-mono text-emerald-300/90 whitespace-pre-wrap p-2 bg-slate-900 rounded border border-slate-800">
                                {JSON.stringify(liveRes.data, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Expected Schema Sample */}
                          <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                              {lang === 'en' ? `Default Response Specification (${ep.responseStatus} OK):` : `Especificación de Respuesta (${ep.responseStatus} OK):`}
                            </span>
                            <pre className="max-h-36 overflow-y-auto text-[11px] font-mono text-slate-400 p-2.5 bg-slate-950 rounded border border-slate-800">
                              {JSON.stringify(ep.responseSample, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Cryptographic Standards & 50-Digit Clave Spec Tab */}
        {activeTab === 'standards' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-300">
            {/* 50-Digit Clave Structure */}
            <div className={`p-4 rounded-xl border ${
              isBright ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center space-x-2 text-emerald-500 font-bold text-sm mb-3">
                <Hash className="w-4 h-4" />
                <span>
                  {lang === 'en' ? '50-Digit Numerical Clave Structure (Official DGT Algorithm)' : 'Estructura de la Clave Numérica de 50 Dígitos (DGT)'}
                </span>
              </div>
              <p className="text-xs mb-3 text-slate-400">
                {lang === 'en'
                  ? 'Every electronic voucher emitted in Costa Rica must carry a globally unique 50-digit numerical identifier structured as follows:'
                  : 'Todo comprobante electrónico emitido en Costa Rica debe portar una Clave numérica de 50 dígitos estructurada de la siguiente manera:'}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-mono border-collapse">
                  <thead>
                    <tr className={`border-b ${isBright ? 'border-slate-300 text-slate-600' : 'border-slate-800 text-slate-400'} text-left`}>
                      <th className="py-1.5 px-2">Segment</th>
                      <th className="py-1.5 px-2">Digits</th>
                      <th className="py-1.5 px-2">Description</th>
                      <th className="py-1.5 px-2">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    <tr>
                      <td className="py-1 px-2 font-bold text-blue-400">Country Code</td>
                      <td className="py-1 px-2">3 (1-3)</td>
                      <td className="py-1 px-2">Costa Rica ITU International Code (506)</td>
                      <td className="py-1 px-2">506</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-blue-400">Day / Month / Year</td>
                      <td className="py-1 px-2">6 (4-9)</td>
                      <td className="py-1 px-2">DDMMAA date of emission</td>
                      <td className="py-1 px-2">021026 (02-Oct-2026)</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-blue-400">Taxpayer ID</td>
                      <td className="py-1 px-2">12 (10-21)</td>
                      <td className="py-1 px-2">Cédula padded with leading zeros</td>
                      <td className="py-1 px-2">003101123456</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-blue-400">Branch (Sucursal)</td>
                      <td className="py-1 px-2">3 (22-24)</td>
                      <td className="py-1 px-2">Establishment branch number</td>
                      <td className="py-1 px-2">001</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-blue-400">POS (Punto de Venta)</td>
                      <td className="py-1 px-2">5 (25-29)</td>
                      <td className="py-1 px-2">Terminal or POS number</td>
                      <td className="py-1 px-2">00001</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-blue-400">Document Type</td>
                      <td className="py-1 px-2">2 (30-31)</td>
                      <td className="py-1 px-2">01 FE, 02 ND, 03 NC, 04 TE, 08 FEC, 09 FEE, 10 REP</td>
                      <td className="py-1 px-2">01</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-blue-400">Sequential Consecutivo</td>
                      <td className="py-1 px-2">10 (32-41)</td>
                      <td className="py-1 px-2">Internal sequential voucher count</td>
                      <td className="py-1 px-2">0000000001</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-blue-400">Tax Situation</td>
                      <td className="py-1 px-2">1 (42)</td>
                      <td className="py-1 px-2">1 Normal, 2 Contingency, 3 Without Internet</td>
                      <td className="py-1 px-2">1</td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 font-bold text-blue-400">Security Code</td>
                      <td className="py-1 px-2">8 (43-50)</td>
                      <td className="py-1 px-2">Pseudorandom security numerical salt</td>
                      <td className="py-1 px-2">18492018</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* XAdES-EPES Cryptography */}
            <div className={`p-4 rounded-xl border ${
              isBright ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-sm mb-3">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {lang === 'en' ? 'XAdES-EPES Digital Signature & Cryptographic Standards' : 'Firma Digital XAdES-EPES y Normativa Criptográfica'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'en'
                  ? 'Complies with Costa Rica Digital Signature Law 8454 and Central Bank of Costa Rica (BCCR) CA SINPE hierarchy:'
                  : 'Cumple con la Ley 8454 de Firma Digital y la jerarquía de certificación CA SINPE del Banco Central de Costa Rica (BCCR):'}
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-300">
                <li><strong className="text-white">Canonicalization:</strong> Canonical XML 1.0 (<code>http://www.w3.org/TR/2001/REC-xml-c14n-20010315</code>)</li>
                <li><strong className="text-white">Signature Algorithm:</strong> RSA with SHA-256 (<code>http://www.w3.org/2001/04/xmldsig-more#rsa-sha256</code>)</li>
                <li><strong className="text-white">Digest Method:</strong> SHA-256 (<code>http://www.w3.org/2001/04/xmlenc#sha256</code>)</li>
                <li><strong className="text-white">Signature Policy:</strong> Official DGT v4.3 Policy (<code>https://www.hacienda.go.cr/ATV/politicaFirma/politicaFirmaFacturaElectronicaV4.3.pdf</code>)</li>
                <li><strong className="text-white">Vault Protection:</strong> Encrypted using AES-256-GCM hardware primitives with unique initialization vectors (IV).</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`p-3 border-t text-xs flex items-center justify-between ${
          isBright ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{lang === 'en' ? 'Hacienda Sandbox API v4.3/v4.4 Online' : 'API Sandbox de Hacienda v4.3/v4.4 en Línea'}</span>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="https://www.hacienda.go.cr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500 hover:underline flex items-center space-x-1"
            >
              <span>Hacienda Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors cursor-pointer"
            >
              {lang === 'en' ? 'Close' : 'Cerrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
