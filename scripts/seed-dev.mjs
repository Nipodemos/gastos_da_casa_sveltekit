import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { createClient } from '@libsql/client';

try {
	process.loadEnvFile('.env');
} catch {
	// .env é opcional para o seed local
}

const databaseUrl = process.env.LOCAL_DATABASE_URL || 'file:mydb.sqlite';

if (!databaseUrl.startsWith('file:')) {
	console.error(
		`[seed-dev] Abortado por segurança: LOCAL_DATABASE_URL precisa ser um arquivo SQLite local (file:...). Valor recebido: ${databaseUrl}`
	);
	process.exit(1);
}

function criarHashSenha(senha) {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(senha, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

function calcularPorcentagemInss(salarioBruto, clt) {
	if (!clt || salarioBruto <= 0) return 0;
	if (salarioBruto <= 1518) return 0.075;
	if (salarioBruto <= 2793.88) return 0.09;
	if (salarioBruto <= 4190.83) return 0.12;
	return 0.14;
}

const client = createClient({ url: databaseUrl });

const agora = Date.now();
const hoje = new Date();
const anoAtual = hoje.getUTCFullYear();
const mesAtual = hoje.getUTCMonth(); // 0-indexed

const dataUtc = (ano, mesZeroBased, dia = 1) => Date.UTC(ano, mesZeroBased, dia);

async function recriarTabelas() {
	await client.execute('DROP TABLE IF EXISTS despesas');
	await client.execute('DROP TABLE IF EXISTS despesasFixas');
	await client.execute('DROP TABLE IF EXISTS pessoas');
	await client.execute('DROP TABLE IF EXISTS usuarios');

	await client.execute(`
		CREATE TABLE usuarios (
			id text default '' not null primary key,
			nome text default '' not null,
			senhaHash text default '' not null,
			createdAt integer,
			updatedAt integer
		)
	`);

	await client.execute(`
		CREATE TABLE pessoas (
			id text default '' not null primary key,
			nome text default '' not null,
			salarioBruto numeric default 0 not null,
			bonus numeric default 0 not null,
			porcentagemTaxaAlimentacao numeric default 0 not null,
			porcentagemTaxaInss numeric default 0 not null,
			porcentagemTaxaPassagem numeric default 0 not null,
			valorTicketAlimentacao numeric default 0 not null,
			clt integer default 0 not null,
			usuarioId text default '' not null,
			createdAt integer,
			updatedAt integer
		)
	`);

	await client.execute(`
		CREATE TABLE despesasFixas (
			id text default '' not null primary key,
			descricao text default '' not null,
			valor numeric default 0 not null,
			diaVencimento integer default 0 not null,
			ativa integer default 0 not null,
			inicio integer,
			usuarioId text default '' not null,
			createdAt integer,
			updatedAt integer
		)
	`);

	await client.execute(`
		CREATE TABLE despesas (
			id text default '' not null primary key,
			descricao text default '' not null,
			valor numeric default 0 not null,
			data integer,
			paga integer default 0 not null,
			fixa integer default 0 not null,
			despesaFixaId text default '' not null,
			excluida integer default 0 not null,
			usuarioId text default '' not null,
			createdAt integer,
			updatedAt integer
		)
	`);
}

async function popularDados() {
	const senhaAdmin = process.env.SENHA_LOGIN?.trim() || 'admin123';
	const senhaSecundaria = 'teste123';

	const adminId = randomUUID();
	const secundarioId = randomUUID();

	// 1. Usuários
	await client.execute({
		sql: 'INSERT INTO usuarios (id, nome, senhaHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
		args: [adminId, 'Administrador', criarHashSenha(senhaAdmin), agora, agora]
	});

	await client.execute({
		sql: 'INSERT INTO usuarios (id, nome, senhaHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
		args: [secundarioId, 'Casa Secundária', criarHashSenha(senhaSecundaria), agora + 1, agora + 1]
	});

	// 2. Pessoas (Admin)
	const pessoasAdmin = [
		{
			nome: 'Ana Silva',
			salarioBruto: 5200,
			bonus: 350,
			porcentagemTaxaAlimentacao: 0.05,
			porcentagemTaxaPassagem: 0.06,
			valorTicketAlimentacao: 850,
			clt: true
		},
		{
			nome: 'Bruno Costa',
			salarioBruto: 3600,
			bonus: 0,
			porcentagemTaxaAlimentacao: 0.04,
			porcentagemTaxaPassagem: 0.06,
			valorTicketAlimentacao: 600,
			clt: true
		},
		{
			nome: 'Carla Mendes',
			salarioBruto: 2900,
			bonus: 200,
			porcentagemTaxaAlimentacao: 0,
			porcentagemTaxaPassagem: 0,
			valorTicketAlimentacao: 0,
			clt: false
		}
	];

	for (const p of pessoasAdmin) {
		await client.execute({
			sql: `INSERT INTO pessoas (
				id, nome, salarioBruto, bonus,
				porcentagemTaxaAlimentacao, porcentagemTaxaInss, porcentagemTaxaPassagem,
				valorTicketAlimentacao, clt, usuarioId, createdAt, updatedAt
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [
				randomUUID(),
				p.nome,
				p.salarioBruto,
				p.bonus,
				p.porcentagemTaxaAlimentacao,
				calcularPorcentagemInss(p.salarioBruto, p.clt),
				p.porcentagemTaxaPassagem,
				p.valorTicketAlimentacao,
				p.clt ? 1 : 0,
				adminId,
				agora,
				agora
			]
		});
	}

	// Pessoa (Usuário secundário)
	await client.execute({
		sql: `INSERT INTO pessoas (
			id, nome, salarioBruto, bonus,
			porcentagemTaxaAlimentacao, porcentagemTaxaInss, porcentagemTaxaPassagem,
			valorTicketAlimentacao, clt, usuarioId, createdAt, updatedAt
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		args: [
			randomUUID(),
			'Diego Rocha',
			4100,
			0,
			0.03,
			calcularPorcentagemInss(4100, true),
			0.06,
			700,
			1,
			secundarioId,
			agora,
			agora
		]
	});

	// 3. Despesas Fixas (Admin)
	const inicioFixas = dataUtc(anoAtual, mesAtual - 1, 1);
	const fixasAdmin = [
		{ id: randomUUID(), descricao: 'Aluguel', valor: 1800, diaVencimento: 5, ativa: true },
		{ id: randomUUID(), descricao: 'Condomínio', valor: 420, diaVencimento: 10, ativa: true },
		{ id: randomUUID(), descricao: 'Internet Fibra', valor: 119.9, diaVencimento: 12, ativa: true },
		{ id: randomUUID(), descricao: 'Energia Elétrica', valor: 235.5, diaVencimento: 15, ativa: true },
		{ id: randomUUID(), descricao: 'Água e Saneamento', valor: 98.4, diaVencimento: 18, ativa: true },
		{
			id: randomUUID(),
			descricao: 'Streaming (Pausado)',
			valor: 55.9,
			diaVencimento: 20,
			ativa: false
		}
	];

	for (const f of fixasAdmin) {
		await client.execute({
			sql: `INSERT INTO despesasFixas (
				id, descricao, valor, diaVencimento, ativa, inicio, usuarioId, createdAt, updatedAt
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [
				f.id,
				f.descricao,
				f.valor,
				f.diaVencimento,
				f.ativa ? 1 : 0,
				inicioFixas,
				adminId,
				agora,
				agora
			]
		});
	}

	// 4. Despesas do mês atual e parcelas futuras (Admin)
	const despesasAdmin = [
		// Algumas fixas já marcadas como pagas no mês atual
		{
			descricao: fixasAdmin[0].descricao,
			valor: fixasAdmin[0].valor,
			data: dataUtc(anoAtual, mesAtual, fixasAdmin[0].diaVencimento),
			paga: true,
			fixa: true,
			despesaFixaId: fixasAdmin[0].id
		},
		{
			descricao: fixasAdmin[2].descricao,
			valor: fixasAdmin[2].valor,
			data: dataUtc(anoAtual, mesAtual, fixasAdmin[2].diaVencimento),
			paga: true,
			fixa: true,
			despesaFixaId: fixasAdmin[2].id
		},
		// Despesas variáveis do mês atual
		{
			descricao: 'Supermercado do mês',
			valor: 980.45,
			data: dataUtc(anoAtual, mesAtual, 1),
			paga: true,
			fixa: false,
			despesaFixaId: ''
		},
		{
			descricao: 'Feira e hortifruti',
			valor: 185.2,
			data: dataUtc(anoAtual, mesAtual, 1),
			paga: true,
			fixa: false,
			despesaFixaId: ''
		},
		{
			descricao: 'Farmácia',
			valor: 124.8,
			data: dataUtc(anoAtual, mesAtual, 1),
			paga: false,
			fixa: false,
			despesaFixaId: ''
		},
		{
			descricao: 'Ração e pet shop',
			valor: 160.0,
			data: dataUtc(anoAtual, mesAtual, 1),
			paga: false,
			fixa: false,
			despesaFixaId: ''
		},
		{
			descricao: 'Manutenção chuveiro',
			valor: 95.0,
			data: dataUtc(anoAtual, mesAtual, 1),
			paga: true,
			fixa: false,
			despesaFixaId: ''
		},
		// Exemplo de despesa parcelada em 3x
		{
			descricao: 'Liquidificador 01/03',
			valor: 110.0,
			data: dataUtc(anoAtual, mesAtual, 1),
			paga: true,
			fixa: false,
			despesaFixaId: ''
		},
		{
			descricao: 'Liquidificador 02/03',
			valor: 110.0,
			data: dataUtc(anoAtual, mesAtual + 1, 1),
			paga: false,
			fixa: false,
			despesaFixaId: ''
		},
		{
			descricao: 'Liquidificador 03/03',
			valor: 110.0,
			data: dataUtc(anoAtual, mesAtual + 2, 1),
			paga: false,
			fixa: false,
			despesaFixaId: ''
		}
	];

	for (const d of despesasAdmin) {
		await client.execute({
			sql: `INSERT INTO despesas (
				id, descricao, valor, data, paga, fixa, despesaFixaId, excluida, usuarioId, createdAt, updatedAt
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [
				randomUUID(),
				d.descricao,
				d.valor,
				d.data,
				d.paga ? 1 : 0,
				d.fixa ? 1 : 0,
				d.despesaFixaId,
				0,
				adminId,
				agora,
				agora
			]
		});
	}

	// Despesas do usuário secundário
	const despesasSecundario = [
		{ descricao: 'Aluguel Kitnet', valor: 1150, paga: true },
		{ descricao: 'Mercado Semanal', valor: 320.5, paga: false }
	];

	for (const d of despesasSecundario) {
		await client.execute({
			sql: `INSERT INTO despesas (
				id, descricao, valor, data, paga, fixa, despesaFixaId, excluida, usuarioId, createdAt, updatedAt
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			args: [
				randomUUID(),
				d.descricao,
				d.valor,
				dataUtc(anoAtual, mesAtual, 1),
				d.paga ? 1 : 0,
				0,
				'',
				0,
				secundarioId,
				agora,
				agora
			]
		});
	}

	console.log(`[seed-dev] Banco local populado com sucesso em ${databaseUrl}`);
	console.log(
		`[seed-dev] Conta Admin: "Administrador" (senha: ${process.env.SENHA_LOGIN?.trim() ? 'SENHA_LOGIN do .env' : 'admin123'})`
	);
	console.log(`[seed-dev] Conta Teste: "Casa Secundária" (senha: ${senhaSecundaria})`);
}

await recriarTabelas();
await popularDados();
client.close();
