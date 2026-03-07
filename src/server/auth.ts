import jwt from 'jsonwebtoken';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { AUTH_SECRET } from '$env/static/private';

interface DadosJWT {
	user: {
		id: string;
		name: string;
	};
}

export function normalizeAccessCode(accessCode: string) {
	return accessCode.trim();
}

export function hashAccessCode(accessCode: string) {
	const salt = randomBytes(16).toString('hex');
	const hash = scryptSync(normalizeAccessCode(accessCode), salt, 64).toString('hex');
	return `${salt}:${hash}`;
}

export function verifyAccessCode(accessCode: string, storedHash: string) {
	const [salt, hash] = storedHash.split(':');
	if (!salt || !hash) {
		return false;
	}

	const calculatedHash = scryptSync(normalizeAccessCode(accessCode), salt, 64);
	const storedHashBuffer = Buffer.from(hash, 'hex');
	if (storedHashBuffer.length !== calculatedHash.length) {
		return false;
	}

	return timingSafeEqual(storedHashBuffer, calculatedHash);
}

export function createSessionToken(user: DadosJWT['user']): string {
	return jwt.sign({ user }, AUTH_SECRET, { expiresIn: '35d' });
}

export function verifySessionToken(token: string): DadosJWT | null {
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
