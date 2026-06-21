// Helper de progreso del curso (localStorage). Lo usan tanto los islands React
// como el script cliente de la sidebar. Seguro en SSR (guarda con typeof).
//
// Flujo de métricas: el diagnóstico inicial y los ejercicios se guardan AQUÍ
// (sin pedir correo). Recién en la evaluación final se pide el correo y se
// consolida todo en un único envío al backend.

const KEY = "querylab:unidad1";

export interface PreData {
	respuestas: Record<string, string>;
	indices: Record<string, number>;
}

export interface Progreso {
	completed: string[];
	correo: string;
	nombre: string;
	ejercicios: Record<string, boolean>;
	/** Respuestas del diagnóstico inicial, por unidad (clave = número de unidad). */
	pre: Record<string, PreData>;
}

const vacio: Progreso = { completed: [], correo: "", nombre: "", ejercicios: {}, pre: {} };

export function leerProgreso(): Progreso {
	if (typeof localStorage === "undefined") return { ...vacio, pre: {} };
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...vacio, pre: {} };
		const p = JSON.parse(raw);
		return {
			completed: Array.isArray(p.completed) ? p.completed : [],
			correo: typeof p.correo === "string" ? p.correo : "",
			nombre: typeof p.nombre === "string" ? p.nombre : "",
			ejercicios: p.ejercicios && typeof p.ejercicios === "object" ? p.ejercicios : {},
			pre: p.pre && typeof p.pre === "object" ? p.pre : {},
		};
	} catch {
		return { ...vacio, pre: {} };
	}
}

function guardar(p: Progreso) {
	if (typeof localStorage === "undefined") return;
	localStorage.setItem(KEY, JSON.stringify(p));
	// Avisar a otros componentes/sidebar en la misma página.
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent("querylab:progreso"));
	}
}

export function marcarLeccion(slug: string) {
	const p = leerProgreso();
	if (!p.completed.includes(slug)) {
		p.completed.push(slug);
		guardar(p);
	}
}

export function leccionCompletada(slug: string): boolean {
	return leerProgreso().completed.includes(slug);
}

export function setCorreo(correo: string) {
	const p = leerProgreso();
	p.correo = correo;
	guardar(p);
}

export function setNombre(nombre: string) {
	const p = leerProgreso();
	p.nombre = nombre;
	guardar(p);
}

export function marcarEjercicio(id: string, aprobado: boolean) {
	const p = leerProgreso();
	p.ejercicios[id] = aprobado;
	guardar(p);
}

/** Guarda las respuestas del diagnóstico inicial de una unidad (sin enviar nada). */
export function guardarPre(unidad: number, data: PreData) {
	const p = leerProgreso();
	p.pre[String(unidad)] = data;
	guardar(p);
}

/** Lee las respuestas del diagnóstico inicial de una unidad (vacío si no hay). */
export function leerPre(unidad: number): PreData {
	const pre = leerProgreso().pre[String(unidad)];
	return pre ?? { respuestas: {}, indices: {} };
}

/** Porcentaje 0–100 de lecciones completadas sobre el total de la unidad. */
export function porcentaje(totalLecciones: number): number {
	if (totalLecciones <= 0) return 0;
	return Math.round((leerProgreso().completed.length / totalLecciones) * 100);
}
