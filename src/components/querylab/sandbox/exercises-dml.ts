// Ejercicios DML de la Unidad 2 (INSERT, UPDATE, DELETE y transacciones).
// Mismo caso de negocio que los videos: una cadena de cines (funcion + venta).
// El motor (engine.ts) recrea el schema `academico` limpio en cada ejecución,
// corre setupSQL y luego el SQL del estudiante; `validar` consulta el estado final.

import type { PGlite } from "@electric-sql/pglite";
import type { Exercise, Validacion, Vista } from "./exercises";

async function rows(db: PGlite, sql: string): Promise<Record<string, unknown>[]> {
	return (await db.query(sql)).rows as Record<string, unknown>[];
}

async function num(db: PGlite, sql: string): Promise<number> {
	const r = await rows(db, sql);
	const v = r[0] ? Object.values(r[0])[0] : 0;
	return Number(v);
}

// --- Tablas del cine (prerequisitos reutilizables) ---
const T_FUNCION = `CREATE TABLE academico.funcion (
  id_funcion INT PRIMARY KEY,
  pelicula   VARCHAR(100) NOT NULL,
  precio     NUMERIC(6,2) NOT NULL CHECK (precio > 0)
);`;

const T_VENTA = `CREATE TABLE academico.venta (
  id_venta   INT PRIMARY KEY,
  id_funcion INT NOT NULL REFERENCES academico.funcion(id_funcion),
  butaca     VARCHAR(5) NOT NULL,
  cliente    VARCHAR(100) NOT NULL,
  CONSTRAINT uq_butaca UNIQUE (id_funcion, butaca)
);`;

const D_FUNCION = `INSERT INTO academico.funcion (id_funcion, pelicula, precio) VALUES
 (1, 'Duna 2', 25.00),
 (2, 'Intensamente 2', 22.00),
 (3, 'Deadpool 3', 28.00);`;

const D_VENTA = `INSERT INTO academico.venta (id_venta, id_funcion, butaca, cliente) VALUES
 (100, 1, 'F12', 'Alvaro'),
 (101, 1, 'F13', 'Sofia'),
 (102, 2, 'A1', 'Luis');`;

const CINE = `${T_FUNCION}\n${T_VENTA}\n${D_FUNCION}\n${D_VENTA}`;
const SOLO_FUNCION = `${T_FUNCION}\n${D_FUNCION}`;

// Vistas reutilizables
const V_FUNCION: Vista = {
	label: "academico.funcion",
	sql: "SELECT id_funcion, pelicula, precio FROM academico.funcion ORDER BY id_funcion",
};
const V_VENTA: Vista = {
	label: "academico.venta",
	sql: "SELECT id_venta, id_funcion, butaca, cliente FROM academico.venta ORDER BY id_venta",
};
const V_TABLAS: Vista = {
	label: "Tablas en el esquema academico",
	sql: "SELECT table_name AS tabla FROM information_schema.tables WHERE table_schema='academico' ORDER BY table_name",
};

const aprox = (a: number, b: number) => Math.abs(a - b) < 0.01;

export const EJERCICIOS_DML: Exercise[] = [
	{
		id: "dml-01-insert",
		titulo: "1 · Dar de alta una fila (INSERT)",
		enunciado:
			"Agrega una nueva función a **academico.funcion**: `id_funcion` = 4, `pelicula` = 'Avatar 3', `precio` = 30.00.",
		setupSQL: SOLO_FUNCION,
		starter:
			"INSERT INTO academico.funcion (id_funcion, pelicula, precio)\nVALUES ( /* completa */ );",
		solucion:
			"INSERT INTO academico.funcion (id_funcion, pelicula, precio) VALUES (4, 'Avatar 3', 30.00);",
		mostrar: [V_FUNCION],
		validar: async (db): Promise<Validacion> => {
			const r = await rows(
				db,
				"SELECT pelicula, precio FROM academico.funcion WHERE id_funcion = 4",
			);
			if (!r.length) return { aprobado: false, detalle: "No se insertó la función con id_funcion = 4." };
			if (String(r[0].pelicula) !== "Avatar 3")
				return { aprobado: false, detalle: "La película debe ser 'Avatar 3'." };
			if (!aprox(Number(r[0].precio), 30))
				return { aprobado: false, detalle: "El precio debe ser 30.00." };
			return { aprobado: true };
		},
	},
	{
		id: "dml-02-insert-fk",
		titulo: "2 · Vender una entrada (INSERT con FK)",
		enunciado:
			"Registra una venta en **academico.venta**: `id_venta` = 103, para la función `id_funcion` = 2, `butaca` = 'A2', `cliente` = 'Mara'. La FOREIGN KEY exige que la función exista.",
		setupSQL: CINE,
		starter:
			"INSERT INTO academico.venta (id_venta, id_funcion, butaca, cliente)\nVALUES ( /* completa */ );",
		solucion:
			"INSERT INTO academico.venta (id_venta, id_funcion, butaca, cliente) VALUES (103, 2, 'A2', 'Mara');",
		mostrar: [V_VENTA],
		validar: async (db): Promise<Validacion> => {
			const r = await rows(
				db,
				"SELECT id_funcion, butaca, cliente FROM academico.venta WHERE id_venta = 103",
			);
			if (!r.length) return { aprobado: false, detalle: "No se registró la venta 103." };
			if (Number(r[0].id_funcion) !== 2 || String(r[0].butaca) !== "A2" || String(r[0].cliente) !== "Mara")
				return { aprobado: false, detalle: "Revisa id_funcion (2), butaca ('A2') y cliente ('Mara')." };
			return { aprobado: true };
		},
	},
	{
		id: "dml-03-update-where",
		titulo: "3 · Corregir un precio (UPDATE + WHERE)",
		enunciado:
			"Sube el precio de **'Duna 2'** a 30.00. Usa `WHERE` para no tocar las demás películas.",
		setupSQL: SOLO_FUNCION,
		starter: "UPDATE academico.funcion\nSET precio = 30\nWHERE /* completa */ ;",
		solucion: "UPDATE academico.funcion SET precio = 30 WHERE pelicula = 'Duna 2';",
		mostrar: [V_FUNCION],
		validar: async (db): Promise<Validacion> => {
			const duna = await num(db, "SELECT precio FROM academico.funcion WHERE pelicula = 'Duna 2'");
			if (!aprox(duna, 30)) return { aprobado: false, detalle: "Duna 2 debe quedar en 30.00." };
			const otras = await num(
				db,
				"SELECT COUNT(*) FROM academico.funcion WHERE pelicula <> 'Duna 2' AND precio = 30",
			);
			if (otras > 0)
				return { aprobado: false, detalle: "Cambiaste otras películas: faltó el WHERE correcto." };
			return { aprobado: true };
		},
	},
	{
		id: "dml-04-update-calculo",
		titulo: "4 · Aplicar un descuento solo a una película",
		enunciado:
			"**Deadpool 3** está en oferta: baja su precio a 20.00, **sin** afectar a Duna 2 (25.00) ni Intensamente 2 (22.00).",
		setupSQL: SOLO_FUNCION,
		starter: "UPDATE academico.funcion\nSET precio = 20\nWHERE /* completa */ ;",
		solucion: "UPDATE academico.funcion SET precio = 20 WHERE pelicula = 'Deadpool 3';",
		mostrar: [V_FUNCION],
		validar: async (db): Promise<Validacion> => {
			const dp = await num(db, "SELECT precio FROM academico.funcion WHERE pelicula = 'Deadpool 3'");
			if (!aprox(dp, 20)) return { aprobado: false, detalle: "Deadpool 3 debe quedar en 20.00." };
			const duna = await num(db, "SELECT precio FROM academico.funcion WHERE pelicula = 'Duna 2'");
			const int2 = await num(db, "SELECT precio FROM academico.funcion WHERE pelicula = 'Intensamente 2'");
			if (!aprox(duna, 25) || !aprox(int2, 22))
				return { aprobado: false, detalle: "Tocaste otras películas: el WHERE debe filtrar solo Deadpool 3." };
			return { aprobado: true };
		},
	},
	{
		id: "dml-05-delete-where",
		titulo: "5 · Anular una venta (DELETE + WHERE)",
		enunciado:
			"El cliente de la venta **id_venta = 102** se arrepintió. Elimínala. Las otras dos ventas deben permanecer.",
		setupSQL: CINE,
		starter: "DELETE FROM academico.venta\nWHERE /* completa */ ;",
		solucion: "DELETE FROM academico.venta WHERE id_venta = 102;",
		mostrar: [V_VENTA],
		validar: async (db): Promise<Validacion> => {
			const existe = await num(db, "SELECT COUNT(*) FROM academico.venta WHERE id_venta = 102");
			if (existe > 0) return { aprobado: false, detalle: "La venta 102 todavía existe." };
			const total = await num(db, "SELECT COUNT(*) FROM academico.venta");
			if (total !== 2)
				return { aprobado: false, detalle: `Deben quedar 2 ventas; hay ${total}. ¿Borraste de más? Faltó el WHERE.` };
			return { aprobado: true };
		},
	},
	{
		id: "dml-06-delete-no-drop",
		titulo: "6 · Vaciar la tabla sin destruirla (DELETE, no DROP)",
		enunciado:
			"Cierra la jornada: elimina **todas** las ventas, pero la tabla `venta` debe **seguir existiendo** para mañana. Usa `DELETE`, no `DROP`.",
		setupSQL: CINE,
		starter: "DELETE FROM academico.venta;",
		solucion: "DELETE FROM academico.venta;",
		mostrar: [V_VENTA, V_TABLAS],
		validar: async (db): Promise<Validacion> => {
			const existeTabla = await num(
				db,
				"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='academico' AND table_name='venta'",
			);
			if (existeTabla === 0)
				return {
					aprobado: false,
					detalle: "La tabla venta dejó de existir: usaste DROP. DELETE vacía las filas pero conserva la tabla.",
				};
			const filas = await num(db, "SELECT COUNT(*) FROM academico.venta");
			if (filas > 0) return { aprobado: false, detalle: `La tabla aún tiene ${filas} filas; debe quedar vacía.` };
			return { aprobado: true };
		},
	},
	{
		id: "dml-07-rollback",
		titulo: "7 · Deshacer un error (transacción + ROLLBACK)",
		enunciado:
			"Te piden simular un alza del 50% en **todos** los precios. Hazlo dentro de una transacción (`BEGIN`), pero como es solo una prueba, **deshazlo con `ROLLBACK`**. Al final los precios deben quedar como al inicio.",
		setupSQL: SOLO_FUNCION,
		starter:
			"BEGIN;\n  UPDATE academico.funcion SET precio = precio * 1.5;\n  -- era solo una prueba:\nROLLBACK;",
		solucion:
			"BEGIN;\n  UPDATE academico.funcion SET precio = precio * 1.5;\nROLLBACK;",
		mostrar: [V_FUNCION],
		validar: async (db): Promise<Validacion> => {
			const duna = await num(db, "SELECT precio FROM academico.funcion WHERE pelicula = 'Duna 2'");
			const dp = await num(db, "SELECT precio FROM academico.funcion WHERE pelicula = 'Deadpool 3'");
			if (!aprox(duna, 25) || !aprox(dp, 28))
				return {
					aprobado: false,
					detalle: "Los precios cambiaron: faltó el ROLLBACK (o se confirmó con COMMIT). Deben volver a 25.00 y 28.00.",
				};
			return { aprobado: true };
		},
	},
	{
		id: "dml-08-commit",
		titulo: "8 · Confirmar un cambio (transacción + COMMIT)",
		enunciado:
			"Ahora sí: dentro de una transacción, sube **10%** el precio de **'Duna 2'** y confírmalo con `COMMIT`. Debe quedar en 27.50.",
		setupSQL: SOLO_FUNCION,
		starter:
			"BEGIN;\n  UPDATE academico.funcion SET precio = precio * 1.1 WHERE pelicula = 'Duna 2';\nCOMMIT;",
		solucion:
			"BEGIN;\n  UPDATE academico.funcion SET precio = precio * 1.1 WHERE pelicula = 'Duna 2';\nCOMMIT;",
		mostrar: [V_FUNCION],
		validar: async (db): Promise<Validacion> => {
			const duna = await num(db, "SELECT precio FROM academico.funcion WHERE pelicula = 'Duna 2'");
			if (!aprox(duna, 27.5))
				return { aprobado: false, detalle: "Duna 2 debe quedar en 27.50 (25.00 × 1.1) y confirmado con COMMIT." };
			const int2 = await num(db, "SELECT precio FROM academico.funcion WHERE pelicula = 'Intensamente 2'");
			if (!aprox(int2, 22))
				return { aprobado: false, detalle: "Solo debías subir Duna 2: el WHERE debe filtrar esa película." };
			return { aprobado: true };
		},
	},
];
