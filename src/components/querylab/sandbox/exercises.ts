// Los 10 ejercicios DDL (basados en el repo patrickleon2401/Query-Lab, PostgreSQL).
// Cada uno crea sus prerequisitos en setupSQL; `validar` confirma el resultado
// consultando el catálogo real de PostgreSQL (information_schema / pg_*).
// `mostrar` define una o más vistas del resultado (tablas, estructura, restricciones).

import type { PGlite } from "@electric-sql/pglite";

export interface Validacion {
	aprobado: boolean;
	detalle?: string;
}

export interface Vista {
	/** Título de la vista de resultado. */
	label: string;
	/** Consulta que produce la tabla a mostrar. */
	sql: string;
}

export interface Exercise {
	id: string;
	titulo: string;
	enunciado: string;
	/** SQL de prerequisitos (se corre antes que el del estudiante, en un schema limpio). */
	setupSQL: string;
	/** Código inicial mostrado en el editor. */
	starter: string;
	/** Solución de referencia. */
	solucion: string;
	/** Una o más vistas para renderizar el resultado (tablas, estructura, restricciones…). */
	mostrar: Vista[];
	validar: (db: PGlite) => Promise<Validacion>;
}

async function rows(db: PGlite, sql: string): Promise<Record<string, unknown>[]> {
	return (await db.query(sql)).rows as Record<string, unknown>[];
}

// --- Tablas reutilizables (prerequisitos) ---
const T_ALUMNOS = `CREATE TABLE academico.alumnos (
  id_alumno      INT PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  apellido       VARCHAR(100) NOT NULL,
  edad           INT,
  correo         VARCHAR(150),
  fecha_registro DATE
);`;

const T_CURSOS = `CREATE TABLE academico.cursos (
  id_curso   INT PRIMARY KEY,
  nombre     VARCHAR(100) NOT NULL,
  creditos   INT NOT NULL
);`;

const T_MATRICULAS = `CREATE TABLE academico.matriculas (
  id_matricula INT PRIMARY KEY,
  id_alumno    INT NOT NULL,
  id_curso     INT NOT NULL,
  fecha_matricula DATE NOT NULL,
  CONSTRAINT fk_matricula_alumno FOREIGN KEY (id_alumno) REFERENCES academico.alumnos(id_alumno),
  CONSTRAINT fk_matricula_curso  FOREIGN KEY (id_curso)  REFERENCES academico.cursos(id_curso)
);`;

const DATA = `INSERT INTO academico.alumnos (id_alumno,nombre,apellido,edad,correo,fecha_registro) VALUES
 (1,'Ana','Pérez',20,'ana@ulima.edu.pe',DATE '2026-03-01'),
 (2,'Luis','Gómez',22,'luis@ulima.edu.pe',DATE '2026-03-02');
INSERT INTO academico.cursos (id_curso,nombre,creditos) VALUES
 (10,'Base de Datos',4),(20,'Algoritmos',3);
INSERT INTO academico.matriculas (id_matricula,id_alumno,id_curso,fecha_matricula) VALUES
 (100,1,10,DATE '2026-03-10'),(101,2,20,DATE '2026-03-11');`;

// Vistas reutilizables
const V_ALUMNOS: Vista = { label: "academico.alumnos", sql: "SELECT * FROM academico.alumnos" };
const V_ESTRUCTURA_ALUMNOS: Vista = {
	label: "Estructura de academico.alumnos",
	sql: "SELECT column_name AS columna, data_type AS tipo, character_maximum_length AS longitud, is_nullable AS acepta_null FROM information_schema.columns WHERE table_schema='academico' AND table_name='alumnos' ORDER BY ordinal_position",
};
const V_RESTRICCIONES_ALUMNOS: Vista = {
	label: "Restricciones de academico.alumnos",
	sql: "SELECT tc.constraint_type AS tipo, tc.constraint_name AS nombre, kcu.column_name AS columna FROM information_schema.table_constraints tc LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema WHERE tc.table_schema='academico' AND tc.table_name='alumnos' ORDER BY tc.constraint_type",
};
const V_TABLAS: Vista = {
	label: "Tablas en el esquema academico",
	sql: "SELECT table_name AS tabla FROM information_schema.tables WHERE table_schema='academico' ORDER BY table_name",
};

const colNames = (r: Record<string, unknown>[]) =>
	r.map((x) => String(x.column_name));

export const EJERCICIOS: Exercise[] = [
	{
		id: "ddl-01-create-table",
		titulo: "1 · Crear una tabla",
		enunciado:
			"Crea la tabla **academico.alumnos** con: `id_alumno` (entero, clave primaria), `nombre` (texto 100, obligatorio), `apellido` (texto 100, obligatorio), `edad` (entero), `correo` (texto 150) y `fecha_registro` (fecha).",
		setupSQL: "",
		starter: "CREATE TABLE academico.alumnos (\n  -- completa las columnas\n);",
		solucion: T_ALUMNOS,
		mostrar: [V_ALUMNOS, V_ESTRUCTURA_ALUMNOS],
		validar: async (db) => {
			const cols = colNames(
				await rows(
					db,
					"SELECT column_name FROM information_schema.columns WHERE table_schema='academico' AND table_name='alumnos'",
				),
			);
			const req = ["id_alumno", "nombre", "apellido", "edad", "correo", "fecha_registro"];
			const faltan = req.filter((c) => !cols.includes(c));
			if (faltan.length) return { aprobado: false, detalle: `Faltan columnas: ${faltan.join(", ")}` };
			const pk = await rows(
				db,
				"SELECT 1 FROM information_schema.table_constraints WHERE table_schema='academico' AND table_name='alumnos' AND constraint_type='PRIMARY KEY'",
			);
			if (!pk.length) return { aprobado: false, detalle: "Falta la clave primaria (PRIMARY KEY)." };
			return { aprobado: true };
		},
	},
	{
		id: "ddl-02-foreign-key",
		titulo: "2 · Clave foránea (FK)",
		enunciado:
			"Crea **academico.cursos** (`id_curso` PK, `nombre` texto NOT NULL, `creditos` entero NOT NULL) y **academico.matriculas** (`id_matricula` PK, `id_alumno`, `id_curso`, `fecha_matricula`) con dos **FOREIGN KEY**: una a `alumnos` y otra a `cursos`.",
		setupSQL: T_ALUMNOS,
		starter:
			"CREATE TABLE academico.cursos (\n  -- ...\n);\n\nCREATE TABLE academico.matriculas (\n  -- ... con FOREIGN KEY a alumnos y a cursos\n);",
		solucion: `${T_CURSOS}\n\n${T_MATRICULAS}`,
		mostrar: [
			{ label: "academico.cursos (creada)", sql: "SELECT * FROM academico.cursos" },
			{ label: "academico.matriculas (creada)", sql: "SELECT * FROM academico.matriculas" },
			{
				label: "Claves foráneas de matriculas",
				sql: "SELECT tc.constraint_name AS fk, kcu.column_name AS columna, ccu.table_name AS referencia_tabla, ccu.column_name AS referencia_columna FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name WHERE tc.table_schema='academico' AND tc.table_name='matriculas' AND tc.constraint_type='FOREIGN KEY'",
			},
		],
		validar: async (db) => {
			const cursos = await rows(
				db,
				"SELECT 1 FROM information_schema.tables WHERE table_schema='academico' AND table_name='cursos'",
			);
			if (!cursos.length) return { aprobado: false, detalle: "Falta crear la tabla cursos." };
			const fks = await rows(
				db,
				"SELECT 1 FROM information_schema.table_constraints WHERE table_schema='academico' AND table_name='matriculas' AND constraint_type='FOREIGN KEY'",
			);
			if (fks.length < 2)
				return { aprobado: false, detalle: `matriculas debe tener 2 FOREIGN KEY (encontradas: ${fks.length}).` };
			return { aprobado: true };
		},
	},
	{
		id: "ddl-03-alter-add",
		titulo: "3 · Agregar una columna",
		enunciado:
			"Agrega la columna **telefono** (texto 20) a la tabla **academico.alumnos** usando `ALTER TABLE`.",
		setupSQL: T_ALUMNOS,
		starter: "ALTER TABLE academico.alumnos\n  ADD ...;",
		solucion: "ALTER TABLE academico.alumnos ADD telefono VARCHAR(20);",
		mostrar: [V_ESTRUCTURA_ALUMNOS, V_ALUMNOS],
		validar: async (db) => {
			const cols = colNames(
				await rows(
					db,
					"SELECT column_name FROM information_schema.columns WHERE table_schema='academico' AND table_name='alumnos'",
				),
			);
			return cols.includes("telefono")
				? { aprobado: true }
				: { aprobado: false, detalle: "No se agregó la columna telefono." };
		},
	},
	{
		id: "ddl-04-alter-type",
		titulo: "4 · Modificar el tipo de una columna",
		enunciado:
			"La columna **telefono** existe como texto(20). Cámbiala a **texto(30)**. (En PostgreSQL: `ALTER TABLE ... ALTER COLUMN ... TYPE ...`.)",
		setupSQL: `${T_ALUMNOS}\nALTER TABLE academico.alumnos ADD telefono VARCHAR(20);`,
		starter: "ALTER TABLE academico.alumnos\n  ALTER COLUMN telefono TYPE VARCHAR(30);",
		solucion: "ALTER TABLE academico.alumnos ALTER COLUMN telefono TYPE VARCHAR(30);",
		mostrar: [V_ESTRUCTURA_ALUMNOS],
		validar: async (db) => {
			const r = await rows(
				db,
				"SELECT character_maximum_length AS len FROM information_schema.columns WHERE table_schema='academico' AND table_name='alumnos' AND column_name='telefono'",
			);
			if (!r.length) return { aprobado: false, detalle: "No existe la columna telefono." };
			return Number(r[0].len) === 30
				? { aprobado: true }
				: { aprobado: false, detalle: `telefono mide ${r[0].len}; debe ser 30.` };
		},
	},
	{
		id: "ddl-05-unique",
		titulo: "5 · Restricción UNIQUE",
		enunciado:
			"Agrega una restricción **UNIQUE** sobre la columna **correo** de **academico.alumnos** (para que no se repitan correos).",
		setupSQL: T_ALUMNOS,
		starter: "ALTER TABLE academico.alumnos\n  ADD CONSTRAINT uq_alumnos_correo UNIQUE (correo);",
		solucion: "ALTER TABLE academico.alumnos ADD CONSTRAINT uq_alumnos_correo UNIQUE (correo);",
		mostrar: [V_RESTRICCIONES_ALUMNOS],
		validar: async (db) => {
			const r = await rows(
				db,
				"SELECT 1 FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema WHERE tc.table_schema='academico' AND tc.table_name='alumnos' AND tc.constraint_type='UNIQUE' AND kcu.column_name='correo'",
			);
			return r.length
				? { aprobado: true }
				: { aprobado: false, detalle: "Falta la restricción UNIQUE en correo." };
		},
	},
	{
		id: "ddl-06-check",
		titulo: "6 · Restricción CHECK",
		enunciado:
			"Agrega una restricción **CHECK** a **academico.alumnos** que valide que **edad >= 0**.",
		setupSQL: T_ALUMNOS,
		starter: "ALTER TABLE academico.alumnos\n  ADD CONSTRAINT chk_alumnos_edad CHECK (edad >= 0);",
		solucion: "ALTER TABLE academico.alumnos ADD CONSTRAINT chk_alumnos_edad CHECK (edad >= 0);",
		mostrar: [
			{
				label: "Restricciones CHECK de academico.alumnos",
				sql: "SELECT cc.constraint_name AS restriccion, cc.check_clause AS condicion FROM information_schema.check_constraints cc JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name=ccu.constraint_name AND cc.constraint_schema=ccu.constraint_schema WHERE ccu.table_schema='academico' AND ccu.table_name='alumnos' AND cc.check_clause NOT LIKE '%IS NOT NULL%'",
			},
		],
		validar: async (db) => {
			const r = await rows(
				db,
				"SELECT cc.check_clause AS clause FROM information_schema.check_constraints cc JOIN information_schema.constraint_column_usage ccu ON cc.constraint_name=ccu.constraint_name AND cc.constraint_schema=ccu.constraint_schema WHERE ccu.table_schema='academico' AND ccu.table_name='alumnos' AND ccu.column_name='edad'",
			);
			const ok = r.some((row) => {
				const c = String(row.clause);
				return /edad/i.test(c) && /(>=|>)/.test(c) && !/IS NOT NULL/i.test(c);
			});
			return ok
				? { aprobado: true }
				: { aprobado: false, detalle: "Falta un CHECK que valide la edad (>= 0)." };
		},
	},
	{
		id: "ddl-07-index",
		titulo: "7 · Crear un índice",
		enunciado:
			"Crea un **índice** sobre la columna **apellido** de **academico.alumnos** (para acelerar búsquedas por apellido).",
		setupSQL: T_ALUMNOS,
		starter: "CREATE INDEX idx_alumnos_apellido\n  ON academico.alumnos(apellido);",
		solucion: "CREATE INDEX idx_alumnos_apellido ON academico.alumnos(apellido);",
		mostrar: [
			{
				label: "Índices de academico.alumnos",
				sql: "SELECT indexname AS indice, indexdef AS definicion FROM pg_indexes WHERE schemaname='academico' AND tablename='alumnos'",
			},
		],
		validar: async (db) => {
			const r = await rows(
				db,
				"SELECT indexdef FROM pg_indexes WHERE schemaname='academico' AND tablename='alumnos'",
			);
			const ok = r.some((row) => /\(apellido\)|\bapellido\b/i.test(String(row.indexdef)));
			return ok
				? { aprobado: true }
				: { aprobado: false, detalle: "No se encontró un índice sobre apellido." };
		},
	},
	{
		id: "ddl-08-view",
		titulo: "8 · Crear una vista",
		enunciado:
			"Crea la vista **academico.vw_alumnos_matriculados** que muestre `id_alumno`, `nombre`, `apellido`, el nombre del curso (como **curso**) y `fecha_matricula`, uniendo `alumnos`, `matriculas` y `cursos`.",
		setupSQL: `${T_ALUMNOS}\n${T_CURSOS}\n${T_MATRICULAS}\n${DATA}`,
		starter:
			"CREATE VIEW academico.vw_alumnos_matriculados AS\nSELECT ...\nFROM academico.alumnos a\nJOIN academico.matriculas m ON ...\nJOIN academico.cursos c ON ...;",
		solucion: `CREATE VIEW academico.vw_alumnos_matriculados AS
SELECT a.id_alumno, a.nombre, a.apellido, c.nombre AS curso, m.fecha_matricula
FROM academico.alumnos a
JOIN academico.matriculas m ON a.id_alumno = m.id_alumno
JOIN academico.cursos c ON m.id_curso = c.id_curso;`,
		mostrar: [
			{ label: "academico.vw_alumnos_matriculados", sql: "SELECT * FROM academico.vw_alumnos_matriculados" },
		],
		validar: async (db) => {
			const cols = colNames(
				await rows(
					db,
					"SELECT column_name FROM information_schema.columns WHERE table_schema='academico' AND table_name='vw_alumnos_matriculados'",
				),
			);
			if (!cols.length) return { aprobado: false, detalle: "No existe la vista vw_alumnos_matriculados." };
			const req = ["id_alumno", "nombre", "apellido", "curso", "fecha_matricula"];
			const faltan = req.filter((c) => !cols.includes(c));
			return faltan.length
				? { aprobado: false, detalle: `A la vista le faltan columnas: ${faltan.join(", ")}` }
				: { aprobado: true };
		},
	},
	{
		id: "ddl-09-rename",
		titulo: "9 · Renombrar una tabla",
		enunciado: "Renombra la tabla **academico.cursos** a **asignaturas**.",
		setupSQL: T_CURSOS,
		starter: "ALTER TABLE academico.cursos\n  RENAME TO asignaturas;",
		solucion: "ALTER TABLE academico.cursos RENAME TO asignaturas;",
		mostrar: [V_TABLAS],
		validar: async (db) => {
			const t = (
				await rows(
					db,
					"SELECT table_name FROM information_schema.tables WHERE table_schema='academico'",
				)
			).map((x) => String(x.table_name));
			if (t.includes("cursos")) return { aprobado: false, detalle: "La tabla cursos todavía existe; debe renombrarse." };
			if (!t.includes("asignaturas")) return { aprobado: false, detalle: "No existe la tabla asignaturas." };
			return { aprobado: true };
		},
	},
	{
		id: "ddl-10-drop",
		titulo: "10 · Eliminar una tabla",
		enunciado:
			"Elimina por completo la tabla **academico.matriculas** (estructura y datos) con `DROP TABLE`.",
		setupSQL: `${T_ALUMNOS}\n${T_CURSOS}\n${T_MATRICULAS}`,
		starter: "DROP TABLE academico.matriculas;",
		solucion: "DROP TABLE academico.matriculas;",
		mostrar: [V_TABLAS],
		validar: async (db) => {
			const t = await rows(
				db,
				"SELECT 1 FROM information_schema.tables WHERE table_schema='academico' AND table_name='matriculas'",
			);
			return t.length
				? { aprobado: false, detalle: "La tabla matriculas todavía existe." }
				: { aprobado: true };
		},
	},
];
