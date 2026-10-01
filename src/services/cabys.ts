/**
 * @file src/services/cabys.ts
 * @description Catalog of official CABYS (Catálogo de Bienes y Servicios) codes
 * published by Banco Central de Costa Rica (BCCR) & Ministerio de Hacienda.
 * Used for electronic invoice validation according to resolution DGT-R-033-2019.
 */

import { CabysItem } from '../types';

export const CABYS_CATALOG: CabysItem[] = [
  // Tecnología y Servicios Profesionales
  {
    codigo: '8314100000000',
    descripcion: 'Servicios de consultoría en tecnología de la información e ingeniería de software',
    tarifaIva: 13,
    codigoTarifa: '08',
    categoria: 'Tecnología',
  },
  {
    codigo: '8314200000000',
    descripcion: 'Servicios de soporte técnico, mantenimiento de sistemas y servidores cloud',
    tarifaIva: 13,
    codigoTarifa: '08',
    categoria: 'Tecnología',
  },
  {
    codigo: '8311100000000',
    descripcion: 'Servicios de contabilidad, auditoría tributaria y teneduría de libros',
    tarifaIva: 13,
    codigoTarifa: '08',
    categoria: 'Servicios Profesionales',
  },
  {
    codigo: '8311200000000',
    descripcion: 'Servicios de asesoría jurídica, legal y notarial',
    tarifaIva: 13,
    codigoTarifa: '08',
    categoria: 'Servicios Profesionales',
  },
  // Salud y Medicina (Tarifa Reducida 4% Art. 26 Ley 9635)
  {
    codigo: '9312100000000',
    descripcion: 'Servicios de consulta médica general y medicina especializada (Tarifa Reducida 4%)',
    tarifaIva: 4,
    codigoTarifa: '04',
    categoria: 'Salud (4% IVA)',
  },
  {
    codigo: '9312200000000',
    descripcion: 'Servicios de odontología y salud bucodental integral (Tarifa Reducida 4%)',
    tarifaIva: 4,
    codigoTarifa: '04',
    categoria: 'Salud (4% IVA)',
  },
  {
    codigo: '9319900000000',
    descripcion: 'Servicios de análisis clínicos, laboratorio y diagnóstico médico (Tarifa Reducida 4%)',
    tarifaIva: 4,
    codigoTarifa: '04',
    categoria: 'Salud (4% IVA)',
  },
  // Turismo (Tarifa Reducida 8% Ley 9882)
  {
    codigo: '6411000000000',
    descripcion: 'Servicios de alojamiento y hospedaje turístico registrado ante el ICT (Tarifa 8%)',
    tarifaIva: 8,
    codigoTarifa: '07',
    categoria: 'Turismo (8% IVA)',
  },
  {
    codigo: '6421000000000',
    descripcion: 'Servicios de operadores y agencias de viajes turísticos receptivos (Tarifa 8%)',
    tarifaIva: 8,
    codigoTarifa: '07',
    categoria: 'Turismo (8% IVA)',
  },
  // Educación
  {
    codigo: '9290000000000',
    descripcion: 'Servicios de capacitación profesional y cursos de educación continua (Tarifa 2%)',
    tarifaIva: 2,
    codigoTarifa: '03',
    categoria: 'Educación (2% IVA)',
  },
  // Canasta Básica Tributaria (Tarifa Reducida 1%)
  {
    codigo: '2111100000000',
    descripcion: 'Arroz pilado nacional incluido en la Canasta Básica Tributaria (Tarifa 1%)',
    tarifaIva: 1,
    codigoTarifa: '02',
    categoria: 'Canasta Básica (1% IVA)',
  },
  {
    codigo: '2111200000000',
    descripcion: 'Frijoles negros y rojos en grano para consumo (Tarifa 1%)',
    tarifaIva: 1,
    codigoTarifa: '02',
    categoria: 'Canasta Básica (1% IVA)',
  },
  // Bienes Industriales y Mercancías (13%)
  {
    codigo: '4521100000000',
    descripcion: 'Equipos de cómputo, laptops, servidores y accesorios de hardware',
    tarifaIva: 13,
    codigoTarifa: '08',
    categoria: 'Bienes y Hardware',
  },
  {
    codigo: '2399901000000',
    descripcion: 'Suministros de empaque, cajas corrugadas y material de embalaje industrial',
    tarifaIva: 13,
    codigoTarifa: '08',
    categoria: 'Manufactura',
  },
  // Exportaciones y Bienes Exentos (0% IVA)
  {
    codigo: '8314900000000',
    descripcion: 'Exportación de software, hosting y servicios digitales para no residentes (0% Exento)',
    tarifaIva: 0,
    codigoTarifa: '01',
    categoria: 'Exportación (0% Exento)',
  },
];

/**
 * Searches CABYS catalog by text or numeric code.
 * @param {string} query - Keyword or code prefix.
 * @returns {CabysItem[]} Matched items.
 */
export function searchCabys(query: string): CabysItem[] {
  if (!query || !query.trim()) return CABYS_CATALOG.slice(0, 10);
  const q = query.toLowerCase().trim();
  return CABYS_CATALOG.filter(
    (item) => item.codigo.includes(q) || item.descripcion.toLowerCase().includes(q) || item.categoria.toLowerCase().includes(q)
  );
}
