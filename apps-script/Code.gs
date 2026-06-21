/**
 * Query Lab — Backend de respuestas (Google Apps Script)
 * ------------------------------------------------------
 * Recibe el envío consolidado de cada unidad y lo guarda como filas en una
 * Google Sheet. La hoja es el "ERP": cuentas participantes, ves quién terminó
 * (correo @aloe.ulima.edu.pe), comparas pre vs post y revisas qué ejercicios
 * resolvió cada quien. Pestañas: Pre, Post, Ejercicios.
 *
 * Flujo nuevo: el front captura el diagnóstico inicial y los ejercicios en el
 * navegador (sin correo) y, al terminar la unidad (evaluación final), manda UN
 * solo POST con todo: { tipo:"final", unidad, nombre, correo, pre, post,
 * ejercicios, satisfaccion, recomienda, comentarios }. Aquí se reparte en las
 * tres pestañas. Se mantiene compatibilidad con los envíos antiguos
 * (tipo "pre" / "post" / "ejercicios") por si quedan páginas en caché.
 *
 * El puntaje de los tests (0–5) se calcula AQUÍ (no en el navegador) para que
 * la clave de respuestas no se filtre.
 *
 * Despliegue: ver apps-script/README.md
 */

var CAMPOS = {
	pre: ['q1', 'q2', 'q3', 'q4', 'q5'],
	post: ['q1', 'q2', 'q3', 'q4', 'q5'],
};

// Clave de respuestas correctas (índice 0-based) POR UNIDAD.
// Mantener en sincronía con src/components/querylab/surveyData.ts
//   Unidad 1 = DDL  ·  Unidad 2 = DML
var CLAVE = {
	1: { pre: [1, 2, 0, 1, 3], post: [3, 2, 2, 1, 1] }, // DDL
	2: { pre: [1, 1, 2, 0, 1], post: [2, 2, 0, 2, 1] }, // DML
};

function clavePara(unidad, tipo) {
	var u = CLAVE[Number(unidad)] || CLAVE[1];
	return u[tipo] || [];
}

function calcularPuntaje(unidad, tipo, indices) {
	if (!indices) return '';
	var clave = clavePara(unidad, tipo);
	var campos = CAMPOS[tipo] || [];
	var puntaje = 0;
	for (var i = 0; i < campos.length; i++) {
		if (Number(indices[campos[i]]) === clave[i]) puntaje++;
	}
	return puntaje;
}

function hojaCon(tab, header) {
	var ss = SpreadsheetApp.getActiveSpreadsheet();
	var sheet = ss.getSheetByName(tab);
	if (!sheet) sheet = ss.insertSheet(tab);
	if (sheet.getLastRow() === 0) sheet.appendRow(header);
	return sheet;
}

function correoNorm(c) {
	return String(c || '').trim().toLowerCase();
}

// --- Escritura por pestaña -------------------------------------------------

/** Escribe una fila de cuestionario (pre o post) en su pestaña. */
function escribirTest(tipo, unidad, nombre, correo, cuestionario, extras) {
	var tab = tipo === 'post' ? 'Post' : 'Pre';
	var campos = CAMPOS[tipo];
	var sheet = hojaCon(
		tab,
		['timestamp', 'unidad', 'nombre', 'correo', 'puntaje']
			.concat(campos)
			.concat(['comentarios', 'recomienda', 'satisfaccion']),
	);

	cuestionario = cuestionario || {};
	var respuestas = cuestionario.respuestas || {};
	var puntaje = calcularPuntaje(unidad, tipo, cuestionario.indices);
	extras = extras || {};

	var fila = [
		new Date(),
		unidad || 1,
		nombre || '',
		correoNorm(correo),
		puntaje,
	];
	campos.forEach(function (k) {
		fila.push(respuestas[k] != null ? respuestas[k] : '');
	});
	fila.push(extras.comentarios || '');
	fila.push(extras.recomienda || '');
	fila.push(extras.satisfaccion || '');
	sheet.appendRow(fila);
	return puntaje;
}

/** Escribe una fila por ejercicio en la pestaña Ejercicios. */
function escribirEjercicio(unidad, correo, ejercicioId, aprobado) {
	var sheet = hojaCon('Ejercicios', [
		'timestamp', 'unidad', 'correo', 'ejercicio_id', 'aprobado',
	]);
	sheet.appendRow([
		new Date(),
		unidad || 1,
		correoNorm(correo),
		ejercicioId || '',
		aprobado ? 'SI' : 'NO',
	]);
}

// --- Manejadores por tipo de payload --------------------------------------

/** Envío consolidado de toda la unidad (nuevo flujo). */
function guardarFinal(data) {
	var unidad = data.unidad || 1;
	var nombre = data.nombre || '';
	var correo = data.correo;

	var puntajePre = escribirTest('pre', unidad, nombre, correo, data.pre, {});
	var puntajePost = escribirTest('post', unidad, nombre, correo, data.post, {
		comentarios: data.comentarios,
		recomienda: data.recomienda,
		satisfaccion: data.satisfaccion,
	});

	var ejercicios = data.ejercicios || {};
	Object.keys(ejercicios).forEach(function (id) {
		escribirEjercicio(unidad, correo, id, ejercicios[id]);
	});

	return { pre: puntajePre, post: puntajePost };
}

/** Compatibilidad: envío de un solo test suelto (flujo antiguo). */
function guardarTest(data) {
	var tipo = data.tipo === 'post' ? 'post' : 'pre';
	return escribirTest(
		tipo,
		data.unidad || data.sprint || 1,
		data.nombre || '',
		data.correo,
		{ respuestas: data.respuestas, indices: data.indices },
		{
			comentarios: data.comentarios,
			recomienda: data.recomienda,
			satisfaccion: data.satisfaccion,
		},
	);
}

function doPost(e) {
	try {
		var data = JSON.parse(e.postData.contents);

		if (data.tipo === 'final') {
			var puntajes = guardarFinal(data);
			return ContentService
				.createTextOutput(JSON.stringify({ ok: true, puntajes: puntajes }))
				.setMimeType(ContentService.MimeType.JSON);
		}

		// --- Compatibilidad con el flujo antiguo ---
		if (data.tipo === 'ejercicios') {
			escribirEjercicio(data.unidad || 1, data.correo, data.ejercicio_id, data.aprobado);
			return ContentService
				.createTextOutput(JSON.stringify({ ok: true }))
				.setMimeType(ContentService.MimeType.JSON);
		}

		var puntaje = guardarTest(data);
		return ContentService
			.createTextOutput(JSON.stringify({ ok: true, puntaje: puntaje }))
			.setMimeType(ContentService.MimeType.JSON);
	} catch (err) {
		return ContentService
			.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
			.setMimeType(ContentService.MimeType.JSON);
	}
}

function doGet() {
	return ContentService.createTextOutput('Query Lab endpoint OK');
}
