import type { SQLiteDatabase } from 'expo-sqlite';
import type { Piece } from '../types/models';
import { getPieces } from '../database/repositories';
export const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
// Camada simulada de consumo assíncrono, desacoplada da UI.
// Futuramente substituível por GET /pecas da API central.
export async function fetchCatalog(db:SQLiteDatabase, fail=false):Promise<Piece[]>{
 await sleep(430);
 if(fail) throw new Error('Não foi possível carregar o catálogo. Tente novamente.');
 return getPieces(db);
}
