import { useEffect, useMemo, useRef, useState } from "react";
import { enviarEjercicio } from "./lib/submit";
import "./sandbox/sandbox.css";
import { type EvalResult, evaluar } from "./sandbox/engine";
import { EJERCICIOS } from "./sandbox/exercises";
import {
	leerProgreso,
	marcarEjercicio,
	marcarLeccion,
} from "../../scripts/progreso";

// Formatea **negrita** y `código` del enunciado (texto de confianza, escapado).
function fmt(s: string): string {
	const esc = s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
	return esc
		.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
		.replace(/`([^`]+)`/g, "<code>$1</code>");
}

function celda(v: unknown): string {
	if (v === null || v === undefined) return "NULL";
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	return String(v);
}

export default function Sandbox() {
	const [idx, setIdx] = useState(0);
	const [code, setCode] = useState(EJERCICIOS[0].starter);
	const [result, setResult] = useState<EvalResult | null>(null);
	const [corriendo, setCorriendo] = useState(false);
	const [verSolucion, setVerSolucion] = useState(false);
	const [aprobados, setAprobados] = useState<Record<string, boolean>>({});
	const primerRun = useRef(true);
	const [primeraVez, setPrimeraVez] = useState(true);

	const ex = EJERCICIOS[idx];
	const totalAprobados = useMemo(
		() => EJERCICIOS.filter((e) => aprobados[e.id]).length,
		[aprobados],
	);

	useEffect(() => {
		setAprobados(leerProgreso().ejercicios || {});
	}, []);

	function irA(i: number) {
		setIdx(i);
		setCode(EJERCICIOS[i].starter);
		setResult(null);
		setVerSolucion(false);
	}

	async function ejecutar() {
		setCorriendo(true);
		setResult(null);
		if (primerRun.current) {
			primerRun.current = false;
		}
		const r = await evaluar(ex, code);
		setPrimeraVez(false);
		setResult(r);
		setCorriendo(false);

		if (r.aprobado && !aprobados[ex.id]) {
			marcarEjercicio(ex.id, true);
			const next = { ...aprobados, [ex.id]: true };
			setAprobados(next);
			// Registrar en el backend (no bloqueante).
			const correo = leerProgreso().correo;
			enviarEjercicio(correo, ex.id, true);
			// Si ya están los 10, marcar la lección de práctica como completada.
			if (EJERCICIOS.every((e) => next[e.id])) marcarLeccion("practica");
		}
	}

	return (
		<div className="sbx">
			<div className="sbx-head">
				<div className="sbx-progress">
					<span>
						Ejercicios resueltos: <strong>{totalAprobados}/{EJERCICIOS.length}</strong>
					</span>
					<div className="sbx-bar">
						<div
							className="sbx-bar-fill"
							style={{ width: `${(totalAprobados / EJERCICIOS.length) * 100}%` }}
						/>
					</div>
				</div>
				<div className="sbx-chips">
					{EJERCICIOS.map((e, i) => (
						<button
							type="button"
							key={e.id}
							className={`sbx-chip ${i === idx ? "is-active" : ""} ${aprobados[e.id] ? "is-done" : ""}`}
							onClick={() => irA(i)}
							aria-label={`Ejercicio ${i + 1}`}
						>
							{aprobados[e.id] ? "✓" : i + 1}
						</button>
					))}
				</div>
			</div>

			<div className="sbx-card">
				<h3 className="sbx-titulo">{ex.titulo}</h3>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: texto de confianza, escapado en fmt() */}
				<p className="sbx-enunciado" dangerouslySetInnerHTML={{ __html: fmt(ex.enunciado) }} />

				<label className="sbx-editor-label" htmlFor="sbx-editor">
					Tu SQL
				</label>
				<textarea
					id="sbx-editor"
					className="sbx-editor"
					value={code}
					spellCheck={false}
					onChange={(e) => setCode(e.target.value)}
					rows={Math.max(6, code.split("\n").length + 1)}
				/>

				<div className="sbx-acciones">
					<button
						type="button"
						className="sbx-btn sbx-btn-run"
						onClick={ejecutar}
						disabled={corriendo}
					>
						{corriendo
							? primeraVez
								? "Cargando motor SQL…"
								: "Ejecutando…"
							: "▶ Ejecutar"}
					</button>
					<button
						type="button"
						className="sbx-btn sbx-btn-ghost"
						onClick={() => setCode(ex.starter)}
					>
						Reiniciar
					</button>
					<button
						type="button"
						className="sbx-btn sbx-btn-ghost"
						onClick={() => setVerSolucion((v) => !v)}
					>
						{verSolucion ? "Ocultar solución" : "Ver solución"}
					</button>
				</div>

				{verSolucion && (
					<pre className="sbx-solucion">{ex.solucion}</pre>
				)}

				{result && (
					<div className="sbx-resultado">
						{!result.corrio ? (
							<div className="sbx-feedback sbx-error">
								<strong>✗ Error al ejecutar</strong>
								<pre>{result.error}</pre>
							</div>
						) : (
							<>
								<div
									className={`sbx-feedback ${result.aprobado ? "sbx-ok" : "sbx-warn"}`}
								>
									<strong>
										{result.aprobado ? "✓ ¡Correcto!" : "Casi… revisa de nuevo"}
									</strong>
									{!result.aprobado && result.detalle && <span>{result.detalle}</span>}
								</div>

								{result.tablas?.map((t, ti) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: vistas de solo lectura
									<div className="sbx-tabla-wrap" key={ti}>
										<div className="sbx-tabla-cap">{t.label}</div>
										<table className="sbx-tabla">
											<thead>
												<tr>
													{t.columns.map((c) => (
														<th key={c}>{c}</th>
													))}
												</tr>
											</thead>
											<tbody>
												{t.rows.length > 0 ? (
													t.rows.map((row, i) => (
														// biome-ignore lint/suspicious/noArrayIndexKey: filas de solo lectura
														<tr key={i}>
															{row.map((v, j) => (
																// biome-ignore lint/suspicious/noArrayIndexKey: celdas de solo lectura
																<td key={j} className={v === null ? "is-null" : ""}>
																	{celda(v)}
																</td>
															))}
														</tr>
													))
												) : (
													<tr>
														<td className="sbx-vacio" colSpan={Math.max(1, t.columns.length)}>
															(sin filas)
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
								))}
							</>
						)}
					</div>
				)}

				<div className="sbx-nav">
					<button
						type="button"
						className="sbx-btn sbx-btn-ghost"
						onClick={() => irA(Math.max(0, idx - 1))}
						disabled={idx === 0}
					>
						← Anterior
					</button>
					<button
						type="button"
						className="sbx-btn sbx-btn-ghost"
						onClick={() => irA(Math.min(EJERCICIOS.length - 1, idx + 1))}
						disabled={idx === EJERCICIOS.length - 1}
					>
						Siguiente →
					</button>
				</div>

				{totalAprobados === EJERCICIOS.length && (
					<div className="sbx-completo">
						🎉 ¡Resolviste los {EJERCICIOS.length} ejercicios! Ya puedes pasar a la evaluación final.
					</div>
				)}
			</div>
		</div>
	);
}
