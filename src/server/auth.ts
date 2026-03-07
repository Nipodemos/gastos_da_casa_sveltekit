import jwt from 'jsonwebtoken';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { AUTH_SECRET } from '$env/static/private';

interface DadosJWT {
	user: {
		id: string;
		name: string;
	};
}

/**
 * Remove espaços extras do código de acesso antes de qualquer comparação.
 */
export function normalizarCodigoDeAcesso(codigoDeAcesso: string) {
	return codigoDeAcesso.trim();
}

/**
 * Gera o hash persistido do código de acesso usando `scrypt` com sal aleatório.
 */
export function gerarHashDoCodigoDeAcesso(codigoDeAcesso: string) {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(normalizarCodigoDeAcesso(codigoDeAcesso), salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

/**
 * Compara um código de acesso em texto puro com o hash armazenado do usuário.
 */
export function verificarCodigoDeAcesso(codigoDeAcesso: string, hashArmazenado: string) {
	const [salt, hash] = hashArmazenado.split(':');
	if (!salt || !hash) {
		return false;
	}

	const calculatedHash = scryptSync(normalizarCodigoDeAcesso(codigoDeAcesso), salt, 64);
	const storedHashBuffer = Buffer.from(hash, 'hex');
	if (storedHashBuffer.length !== calculatedHash.length) {
		return false;
	}

	return timingSafeEqual(storedHashBuffer, calculatedHash);
}

/**
 * Cria o token JWT persistido no cookie da sessão autenticada.
 */
export function criarTokenDaSessao(usuario: DadosJWT['user']): string {
	return jwt.sign({ user: usuario }, AUTH_SECRET, { expiresIn: '35d' });
}

/**
 * Valida o token JWT da sessão e retorna o payload quando ele é válido.
 */
export function verificarTokenDaSessao(token: string): DadosJWT | null {
	try {
		const payload = jwt.verify(token, AUTH_SECRET);
		if (typeof payload !== 'object' || !payload) {
			return null;
		}

		return payload as DadosJWT;
	} catch {
		return null;
	}
}

/**
 * Extrai o usuário autenticado a partir do token armazenado no cookie da sessão.
 */
export function obterUsuarioDaSessao(token?: string) {
	if (!token) {
		return undefined;
	}

	return verificarTokenDaSessao(token)?.user;
}
