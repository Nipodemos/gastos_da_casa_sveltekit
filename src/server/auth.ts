import jwt from 'jsonwebtoken';
import { AUTH_SECRET } from '$env/static/private';

interface DadosJWT {
	logado: boolean;
}

export function createSessionToken(): string {
	const dados: DadosJWT = { logado: true };
	return jwt.sign(dados, AUTH_SECRET, { expiresIn: '24h' });
}

export function verifySessionToken(token: string): DadosJWT | null {
	try {
		const payload = jwt.verify(token, AUTH_SECRET);
		if (typeof payload !== 'object' || !payload) {
			return null;
		}

		return payload as DadosJWT;
	} catch (error) {
		return null;
	}
}
