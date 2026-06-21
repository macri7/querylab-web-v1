import { useEffect, useState } from "react";
import {
	guardarPre,
	leerPre,
	leerProgreso,
	marcarLeccion,
	setCorreo as guardarCorreo,
	setNombre as guardarNombre,
} from "../../scripts/progreso";
import {
	type FinalPayload,
	normalizeEmail,
	submitFinal,
	validateUlimaEmail,
} from "./lib/submit";
import type { Question } from "./surveyData";

interface Props {
	tipo: "pre" | "post";
	questions: Question[];
	lessonSlug: string;
	/** Número de unidad — etiqueta los datos y agrupa las métricas correctas. */
	unidad: number;
}

type Estado = "idle" | "sending" | "error" | "done";

// Prefijo de los ejercicios del sandbox por unidad (para consolidar solo los de esta unidad).
const PREFIJO_EJERCICIOS: Record<number, string> = { 1: "ddl-", 2: "dml-" };

export default function QuizForm({ tipo, questions, lessonSlug, unidad }: Props) {
	const [nombre, setNombre] = useState("");
	const [correo, setCorreo] = useState("");
	const [answers, setAnswers] = useState<Record<string, number>>({});
	const [satisfaccion, setSatisfaccion] = useState<number>(0);
	const [recomienda, setRecomienda] = useState<string>("");
	const [comentarios, setComentarios] = useState("");
	const [estado, setEstado] = useState<Estado>("idle");
	const [errorMsg, setErrorMsg] = useState("");

	const esPost = tipo === "post";

	useEffect(() => {
		// El nombre se captura en el diagnóstico inicial; se reutiliza en el final.
		const p = leerProgreso();
		if (p.nombre) setNombre(p.nombre);
		if (p.correo) setCorreo(p.correo);
		if (p.completed.includes(lessonSlug)) setEstado("done");
	}, [lessonSlug]);

	function setAnswer(qid: string, idx: number) {
		setAnswers((prev) => ({ ...prev, [qid]: idx }));
	}

	function recolectar(): { respuestas: Record<string, string>; indices: Record<string, number> } {
		const respuestas: Record<string, string> = {};
		const indices: Record<string, number> = {};
		for (const q of questions) {
			respuestas[q.id] = q.options[answers[q.id]];
			indices[q.id] = answers[q.id];
		}
		return { respuestas, indices };
	}

	function validar(): string | null {
		if (!nombre.trim()) return "Ingresa tu nombre completo.";
		for (const q of questions) {
			if (answers[q.id] == null)
				return "Responde todas las preguntas antes de enviar.";
		}
		if (esPost) {
			if (!validateUlimaEmail(correo))
				return "Usa tu correo institucional que termina en @aloe.ulima.edu.pe.";
			if (satisfaccion === 0) return "Indica tu nivel de satisfacción con la unidad.";
		}
		return null;
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const err = validar();
		if (err) {
			setErrorMsg(err);
			setEstado("error");
			return;
		}

		// DIAGNÓSTICO INICIAL: solo se guarda localmente (sin correo, sin red).
		if (!esPost) {
			guardarNombre(nombre.trim());
			guardarPre(unidad, recolectar());
			marcarLeccion(lessonSlug);
			setEstado("done");
			return;
		}

		// EVALUACIÓN FINAL: se consolidan todas las métricas y se envía una sola fila.
		setEstado("sending");
		setErrorMsg("");

		const correoNorm = normalizeEmail(correo);
		const post = recolectar();
		const pre = leerPre(unidad);

		// Ejercicios del sandbox de ESTA unidad (por prefijo de id).
		const prefijo = PREFIJO_EJERCICIOS[unidad] ?? "";
		const todos = leerProgreso().ejercicios;
		const ejercicios: Record<string, boolean> = {};
		for (const [id, ok] of Object.entries(todos)) {
			if (!prefijo || id.startsWith(prefijo)) ejercicios[id] = ok;
		}

		const payload: FinalPayload = {
			tipo: "final",
			unidad,
			nombre: nombre.trim(),
			correo: correoNorm,
			pre,
			post,
			ejercicios,
			satisfaccion,
			recomienda,
			comentarios: comentarios.trim(),
		};

		const result = await submitFinal(payload);
		if (result.ok) {
			guardarCorreo(correoNorm);
			guardarNombre(nombre.trim());
			marcarLeccion(lessonSlug);
			setEstado("done");
		} else {
			setErrorMsg(
				"No pudimos guardar tus resultados. Revisa tu conexión e inténtalo de nuevo.",
			);
			setEstado("error");
		}
	}

	if (estado === "done") {
		return (
			<div className="ql-done">
				<span className="ql-done-ico">✓</span>
				<div>
					<strong>
						{esPost
							? "¡Evaluación final enviada! Completaste la Unidad."
							: "¡Listo! Registramos tu diagnóstico inicial."}
					</strong>
					<p>
						{esPost
							? "Tus respuestas, ejercicios y diagnóstico quedaron guardados juntos."
							: "Tus respuestas se guardaron en este dispositivo. Continúa con la siguiente lección; el correo se pedirá al final."}
					</p>
				</div>
			</div>
		);
	}

	const correoInvalido = esPost && estado === "error" && !validateUlimaEmail(correo);

	return (
		<form onSubmit={handleSubmit} className="ql-quiz" noValidate>
			<div className="ql-fields">
				<label className="ql-field">
					<span>Nombre completo</span>
					<input
						type="text"
						value={nombre}
						onChange={(e) => setNombre(e.target.value)}
						placeholder="Ej. Ana Pérez"
						autoComplete="name"
						required
					/>
				</label>
				{esPost && (
					<label className="ql-field">
						<span>Correo institucional (@aloe.ulima.edu.pe)</span>
						<input
							type="email"
							value={correo}
							onChange={(e) => setCorreo(e.target.value)}
							placeholder="codigo@aloe.ulima.edu.pe"
							autoComplete="email"
							inputMode="email"
							required
							aria-invalid={correoInvalido}
						/>
					</label>
				)}
			</div>

			{!esPost && (
				<p className="ql-hint">
					Tu correo se pedirá una sola vez al final de la unidad, junto con todos tus resultados.
				</p>
			)}

			<ol className="ql-questions">
				{questions.map((q, i) => {
					const labelId = `${tipo}-${q.id}-label`;
					return (
						<li key={q.id} className="ql-question">
							<p className="ql-q-prompt" id={labelId}>
								<span className="ql-q-num">{i + 1}.</span> {q.prompt}
							</p>
							{q.code && <pre className="ql-q-code">{q.code}</pre>}
							<div className="ql-options" role="radiogroup" aria-labelledby={labelId}>
								{q.options.map((opt, idx) => (
									<label
										key={idx}
										className={`ql-option ${answers[q.id] === idx ? "is-selected" : ""}`}
									>
										<input
											type="radio"
											name={`${tipo}-${q.id}`}
											checked={answers[q.id] === idx}
											onChange={() => setAnswer(q.id, idx)}
										/>
										<span className="ql-option-mark" aria-hidden="true"></span>
										<span>{opt}</span>
									</label>
								))}
							</div>
						</li>
					);
				})}
			</ol>

			{esPost && (
				<div className="ql-extra">
					<fieldset className="ql-field">
						<legend>¿Qué tan satisfecho quedaste con la unidad? (1 a 5)</legend>
						<div className="ql-scale">
							{[1, 2, 3, 4, 5].map((n) => (
								<button
									type="button"
									key={n}
									className={`ql-scale-btn ${satisfaccion === n ? "is-selected" : ""}`}
									onClick={() => setSatisfaccion(n)}
									aria-pressed={satisfaccion === n}
									aria-label={`${n} de 5`}
								>
									{n}
								</button>
							))}
						</div>
					</fieldset>
					<fieldset className="ql-field">
						<legend>¿Recomendarías este curso a otro estudiante?</legend>
						<div className="ql-yesno" role="radiogroup">
							{["Sí", "No"].map((v) => (
								<label
									key={v}
									className={`ql-option ql-option-inline ${recomienda === v ? "is-selected" : ""}`}
								>
									<input
										type="radio"
										name="recomienda"
										checked={recomienda === v}
										onChange={() => setRecomienda(v)}
									/>
									<span className="ql-option-mark" aria-hidden="true"></span>
									<span>{v}</span>
								</label>
							))}
						</div>
					</fieldset>
					<label className="ql-field">
						<span>Comentarios (opcional)</span>
						<textarea
							value={comentarios}
							onChange={(e) => setComentarios(e.target.value)}
							rows={3}
							placeholder="¿Qué mejorarías? ¿Qué te gustó?"
						/>
					</label>
				</div>
			)}

			{estado === "error" && (
				<p className="ql-error" role="alert">
					{errorMsg}
				</p>
			)}

			<button type="submit" className="ql-submit" disabled={estado === "sending"}>
				{estado === "sending"
					? "Enviando…"
					: esPost
						? "Enviar y finalizar la unidad"
						: "Guardar y continuar"}
			</button>
		</form>
	);
}
