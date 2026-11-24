import { STORAGE_KEYS } from '../data/constants.js';
import { seedSchedule } from '../data/seeds.js';
import { uid } from '../utils/id.js';
import { normalizeScheduleInput, sortBlocks, validateScheduleInput } from '../utils/schedule.js';
import { storage } from './storage.js';

/**
 * Horario personal del estudiante o docente.
 *
 * A diferencia de los módulos comunitarios, el horario no se comparte con la
 * API: cada persona puede ajustar sus bloques y estos viven en su navegador.
 * El servicio centraliza la validación para que la vista y las pruebas usen
 * exactamente las mismas reglas.
 */

export class ScheduleValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.name = 'ScheduleValidationError';
    this.fields = fields;
  }
}

function readBlocks() {
  if (!storage.has(STORAGE_KEYS.schedule)) {
    storage.set(STORAGE_KEYS.schedule, seedSchedule());
  }
  const blocks = storage.get(STORAGE_KEYS.schedule, []);
  return Array.isArray(blocks) ? blocks : [];
}

function writeBlocks(blocks) {
  const sorted = sortBlocks(blocks);
  storage.set(STORAGE_KEYS.schedule, sorted);
  return sorted;
}

function assertValid(input, blocks, excludeId = null) {
  const errors = validateScheduleInput(input, blocks, excludeId);
  if (Object.keys(errors).length) {
    throw new ScheduleValidationError('Revisa los datos del bloque de horario.', errors);
  }
  return normalizeScheduleInput(input);
}

export function listScheduleBlocks() {
  return sortBlocks(readBlocks());
}

export function scheduleValidation(input, excludeId = null) {
  return validateScheduleInput(input, readBlocks(), excludeId);
}

export function createScheduleBlock(input) {
  const blocks = readBlocks();
  const data = assertValid(input, blocks);
  const block = {
    id: uid('block'),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeBlocks([...blocks, block]);
  return block;
}

export function updateScheduleBlock(id, input) {
  const blocks = readBlocks();
  const current = blocks.find((block) => block.id === id);
  if (!current) throw new Error('El bloque que intentas editar ya no existe.');

  const data = assertValid({ ...current, ...input }, blocks, id);
  const updated = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeBlocks(blocks.map((block) => (block.id === id ? updated : block)));
  return updated;
}

export function deleteScheduleBlock(id) {
  const blocks = readBlocks();
  writeBlocks(blocks.filter((block) => block.id !== id));
  return true;
}

export function resetScheduleBlocks() {
  storage.remove(STORAGE_KEYS.schedule);
  return listScheduleBlocks();
}
