import type { Case, CaseEvent, Space, Technician } from '../data/mockData'

// Declaracion de tipos del modulo mappers.js: define el contrato de
// traduccion entre la API (snake_case) y los componentes (Case/Space).

export const ESTADO_DISPLAY: Record<string, string>
export const PRIORIDAD_DISPLAY: Record<string, string>
export const TIPO_ESPACIO_DISPLAY: Record<string, string>

export function mapEspacio(e: unknown): Space | null
export function tipoEspacioAApi(tipoDisplay: string): string | undefined
export function mapTecnico(u: unknown): Technician | null

export interface HistorialItemMapeado {
  id: string
  time: string
  action: string
  actor: string
  target: string
  role: string
  type: string
}

export function mapCaso(c: unknown): Case | null
export function mapCasoResumen(c: unknown): Case | null
export function mapHistorialGlobal(h: unknown): HistorialItemMapeado | null
