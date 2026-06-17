// Motor del sandbox SQL: PostgreSQL real en el navegador (PGlite, WASM).
// Tolera sintaxis Oracle traduciéndola a Postgres antes de ejecutar.

import type { PGlite } from "@electric-sql/pglite";
import type { Exercise } from "./exercises";

let dbPromise: Promise<PGlite> | null = null;

async function getDb(): Promise<PGlite> {
	if (!dbPromise) {
		dbPromise = (async () => {
			const { PGlite } = await import("@electric-sql/pglite");
			return new PGlite(); // en memoria
		})();
	}
	return dbPromise;
}

/** Traduce los Oracle-ismos más comunes a su equivalente PostgreSQL. */
export function normalizeOracle(sql: string): string {
	return sql
		.replace(/\bVARCHAR2\s*\(/gi, "VARCHAR(")
		.replace(/\bNUMBER\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi, "NUMERIC($1,$2)")
		.replace(/\bNUMBER\s*\(\s*(\d+)\s*\)/gi, "NUMERIC($1)")
		.replace(/\bNUMBER\b/gi, "NUMERIC")
		.replace(/GENERATED\s+BY\s+DEFAULT\s+AS\s+IDENTITY/gi, "GENERATED ALWAYS AS IDENTITY");
}

function msg(e: unknown): string {
	const m = (e as { message?: string })?.message ?? String(e);
	return m.replace(/^ERROR:\s*/i, "");
}

export interface TablaResult {
	label: string;
	columns: string[];
	rows: unknown[][];
}

export interface EvalResult {
	/** El SQL del estudiante corrió sin error de sintaxis/ejecución. */
	corrio: boolean;
	/** La validación del ejercicio pasó. */
	aprobado: boolean;
	error?: string;
	detalle?: string;
	/** Una o más vistas del resultado (p. ej. varias tablas creadas). */
	tablas?: TablaResult[];
}

/** Ejecuta el SQL del estudiante en un workspace limpio y valida el ejercicio. */
export async function evaluar(
	ex: Exercise,
	studentSQL: string,
): Promise<EvalResult> {
	const db = await getDb();

	// Workspace limpio por ejecución (aislamiento entre intentos).
	try {
		await db.exec(
			"DROP SCHEMA IF EXISTS academico CASCADE; CREATE SCHEMA academico;",
		);
		if (ex.setupSQL?.trim()) await db.exec(normalizeOracle(ex.setupSQL));
	} catch (e) {
		return { corrio: false, aprobado: false, error: `Error de preparación: ${msg(e)}` };
	}

	// SQL del estudiante.
	try {
		await db.exec(normalizeOracle(studentSQL));
	} catch (e) {
		return { corrio: false, aprobado: false, error: msg(e) };
	}

	// Vistas del resultado (una o más tablas/consultas).
	const tablas: TablaResult[] = [];
	for (const vista of ex.mostrar || []) {
		try {
			const r = await db.query(vista.sql);
			const fields = (r.fields ?? []) as { name: string }[];
			const columns = fields.map((f) => f.name);
			const rows = (r.rows as Record<string, unknown>[]).map((row) =>
				columns.map((c) => row[c]),
			);
			tablas.push({ label: vista.label, columns, rows });
		} catch {
			/* una vista puede fallar si el alumno no creó esa tabla */
		}
	}

	// Validación.
	try {
		const v = await ex.validar(db);
		return { corrio: true, aprobado: v.aprobado, detalle: v.detalle, tablas };
	} catch (e) {
		return { corrio: true, aprobado: false, detalle: msg(e), tablas };
	}
}

/** Helper para validadores: devuelve las filas de una consulta. */
export async function q(
	db: PGlite,
	sql: string,
): Promise<Record<string, unknown>[]> {
	const r = await db.query(sql);
	return r.rows as Record<string, unknown>[];
}
