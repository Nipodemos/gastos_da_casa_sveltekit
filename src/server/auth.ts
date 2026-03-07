import { SENHA_LOGIN } from '$env/static/private';
import { scryptSync, timingSafeEqual } from 'node:crypto';

export const ID_USUARIO_ADMIN_BOOTSTRAP = '__admin_env__';
export const NOME_USUARIO_ADMIN_BOOTSTRAP = 'Administrador';

export function verificarCodigoDeAcesso(codigoDeAcesso: string, hashArmazenado: string) {
	const [salt, hash] = hashArmazenado.split(':');
	if (!salt || !hash) {
		return false;
	}

	const calculatedHash = scryptSync(codigoDeAcesso, salt, 64);
	const storedHashBuffer = Buffer.from(hash, 'hex');
	if (storedHashBuffer.length !== calculatedHash.length) {
		return false;
	}

	return timingSafeEqual(storedHashBuffer, calculatedHash);
}

export function codigoDeAcessoEhSenhaBootstrapDoAdmin(codigoDeAcesso: string) {
	return Boolean(SENHA_LOGIN) && codigoDeAcesso === SENHA_LOGIN;
}

export function usuarioEhAdminBootstrap(usuarioId: string) {
	return usuarioId === ID_USUARIO_ADMIN_BOOTSTRAP;
}
