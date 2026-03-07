/**
 * Calcula o valor do INSS progressivo com base no salário bruto.
 * 
 * Tabela INSS 2025:
 * - 1ª faixa: até R$ 1.518,00 -> 7,5%
 * - 2ª faixa: de R$ 1.518,01 até R$ 2.793,88 -> 9%
 * - 3ª faixa: de R$ 2.793,89 até R$ 4.190,83 -> 12%
 * - 4ª faixa: de R$ 4.190,84 até R$ 8.157,41 -> 14%
 * 
 * @param salarioBruto - O salário bruto do trabalhador
 * @returns O valor do INSS a ser descontado
 */
export function calcularValorInss(salarioBruto: number, ehClt: boolean): number {
	if (!ehClt) {
		return 0;
	}
	let inss = 0;
	const salario = salarioBruto;

	const faixa1 = 1518.0;
	const faixa2 = 2793.88;
	const faixa3 = 4190.83;
	const teto = 8157.41;

	if (salario > teto) {
		// Calculando teto exato:
		// 1518 * 0.075 = 113.85
		// (2793.88 - 1518) * 0.09 = 1275.88 * 0.09 = 114.8292
		// (4190.83 - 2793.88) * 0.12 = 1396.95 * 0.12 = 167.634
		// (8157.41 - 4190.83) * 0.14 = 3966.58 * 0.14 = 555.3212
		// Total = 113.85 + 114.83 + 167.63 + 555.32 = 951.63
		return 951.63;
	}

	if (salario <= faixa1) {
		return salario * 0.075;
	} else {
		inss += faixa1 * 0.075;
	}

	if (salario <= faixa2) {
		inss += (salario - faixa1) * 0.09;
		return inss;
	} else {
		inss += (faixa2 - faixa1) * 0.09;
	}

	if (salario <= faixa3) {
		inss += (salario - faixa2) * 0.12;
		return inss;
	} else {
		inss += (faixa3 - faixa2) * 0.12;
	}

	if (salario <= teto) {
		inss += (salario - faixa3) * 0.14;
		return inss;
	}

	return inss;
}
