// src/shared/entities.ts
// ======================================
// ARQUIVO CENTRALIZADO DE ENTIDADES
// ======================================
//
// 🎯 COMO USAR:
// 1. Crie sua nova entidade (@Entity)
// 2. Adicione ela no array 'entities' abaixo
// 3. Pronto! Ela será automaticamente incluída em:
//    - Transport hooks (serialização automática)
//    - API do Remult (CRUD endpoints)

import type { ClassType } from 'remult';
import { Despesa } from './despesa.model';
import { Pessoa } from './pessoa.model';

import { DespesaFixa } from './despesa-fixa.model';
import { Usuario } from './usuario.model';

// 📝 Array centralizado de todas as entidades do sistema
// Adicione novas entidades aqui e elas serão automaticamente registradas
export const entities: ClassType<unknown>[] = [Usuario, Despesa, Pessoa, DespesaFixa];

// Função helper para obter a lista de entidades (opcional, para melhor tipagem)
export function getEntities() {
	return entities;
}
