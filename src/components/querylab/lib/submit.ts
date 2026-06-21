// Helpers compartidos por los formularios y el sandbox de Query Lab.

/** Correo institucional de estudiante: termina en @aloe.ulima.edu.pe. */
export function validateUlimaEmail(email: string): boolean {
	return /^[^@\s]+@aloe\.ulima\.edu\.pe$/i.test((email || "").trim());
}

/** Normaliza el correo para que sirva como llave estable (minúsculas, sin espacios). */
export function normalizeEmail(email: string): string {
	return (email || "").trim().toLowerCase();
}

/** Respuestas de un cuestionario (pre o post). */
export interface RespuestasCuestionario {
	/** Texto de la opción elegida por pregunta (q1..q5). Para leer en la hoja. */
	respuestas: Record<string, string>;
	/** Índice de la opción elegida por pregunta. El backend calcula el puntaje con esto. */
	indices: Record<string, number>;
}

/**
 * Envío único y consolidado que se manda al terminar la unidad (form final).
 * Reúne identidad + pre-test + ejercicios + post-test + satisfacción en una sola fila.
 */
export interface FinalPayload {
	tipo: "final";
	unidad: number;
	nombre: string;
	correo: string;
	/** Respuestas del diagnóstico inicial (capturadas localmente, sin correo). */
	pre: RespuestasCuestionario;
	/** Respuestas de la evaluación final. */
	post: RespuestasCuestionario;
	/** Resultado de los ejercicios del sandbox de esta unidad: id -> aprobado. */
	ejercicios: Record<string, boolean>;
	satisfaccion: number;
	recomienda: string;
	comentarios: string;
}

export interface SubmitResult {
	ok: boolean;
	demo?: boolean;
	error?: string;
}

/**
 * POST único en modo no-cors al Web App de Apps Script (Google Sheet).
 *
 * El Web App NO devuelve cabeceras CORS: con un fetch normal el doPost escribiría
 * la fila pero la lectura fallaría y un retry la duplicaría. Por eso un solo POST
 * "no-cors" (respuesta opaca, la fila se escribe una vez y asumimos éxito).
 * Content-Type text/plain => petición simple, sin preflight.
 * Sin endpoint configurado => modo demo (no guarda).
 */
async function enviar(payload: object): Promise<SubmitResult> {
	const endpoint = import.meta.env.PUBLIC_FORM_ENDPOINT as string | undefined;

	if (!endpoint) {
		console.warn(
			"[Query Lab] PUBLIC_FORM_ENDPOINT vacío — modo demo: no se guarda.",
		);
		await new Promise((r) => setTimeout(r, 400));
		return { ok: true, demo: true };
	}

	try {
		await fetch(endpoint, {
			method: "POST",
			mode: "no-cors",
			headers: { "Content-Type": "text/plain;charset=utf-8" },
			body: JSON.stringify(payload),
		});
		return { ok: true };
	} catch (err) {
		return { ok: false, error: String(err) };
	}
}

/** Envía la fila consolidada de la unidad al backend. */
export function submitFinal(payload: FinalPayload): Promise<SubmitResult> {
	return enviar(payload);
}
