// Preguntas reconstruidas a partir de los Google Forms originales del curso
// (Formulario Pre - Test / Formulario Post - Test). Todas son de opción única.
//
// NOTA DE SEGURIDAD: la clave de respuestas correctas NO vive aquí (este archivo se
// envía al navegador del alumno). El puntaje se calcula en el backend (apps-script/Code.gs)
// a partir del índice de la opción elegida, para que la medición pre/post sea confiable.

export interface Question {
	id: string;
	prompt: string;
	code?: string; // bloque SQL opcional, se muestra monoespaciado
	options: string[];
}

export const PRE_QUESTIONS: Question[] = [
	{
		id: "q1",
		prompt: "Observa el siguiente bloque SQL. ¿Qué opción clasifica correctamente los comandos usados?",
		code: `CREATE TABLE libro (
  id_libro NUMBER PRIMARY KEY,
  titulo VARCHAR2(150) NOT NULL,
  anio NUMBER CHECK (anio > 1450)
);

INSERT INTO libro VALUES (1, 'Don Quijote', 1605);
SELECT * FROM libro;`,
		options: [
			"CREATE es DML, INSERT es DDL y SELECT es DCL.",
			"CREATE es DDL, INSERT es DML y SELECT es DQL.",
			"CREATE es DCL, INSERT es DQL y SELECT es DML.",
			"Los tres comandos pertenecen a DDL porque trabajan con tablas.",
		],
	},
	{
		id: "q2",
		prompt: "Un estudiante quiere crear una tabla LIBRO donde cada libro tenga un autor existente en la tabla AUTOR. ¿Cuál fragmento representa mejor esa regla?",
		options: [
			"id_autor NUMBER NOT NULL",
			"id_autor NUMBER CHECK (id_autor > 0)",
			"id_autor NUMBER REFERENCES autor(id_autor)",
			"id_autor NUMBER PRIMARY KEY",
		],
	},
	{
		id: "q3",
		prompt: "Si se ejecuta el siguiente comando en Oracle, ¿cuál afirmación es correcta?",
		code: "ALTER TABLE libro ADD genero VARCHAR2(50);",
		options: [
			"Es DDL porque modifica la estructura de una tabla existente.",
			"Es DML porque inserta un nuevo registro en la tabla.",
			"Es DQL porque permite visualizar una nueva columna.",
			"Es DCL porque cambia los permisos de la tabla.",
		],
	},
	{
		id: "q4",
		prompt: "En una tabla AUTOR, la columna id_autor es PRIMARY KEY. Luego, en la tabla LIBRO, id_autor aparece como FOREIGN KEY. ¿Qué significa esto?",
		options: [
			"Que id_autor en LIBRO debe ser único en todos los libros.",
			"Que id_autor en LIBRO debe coincidir con un autor existente en AUTOR.",
			"Que id_autor en AUTOR puede quedar vacío.",
			"Que id_autor en LIBRO elimina automáticamente autores duplicados.",
		],
	},
	{
		id: "q5",
		prompt: "¿Cuál de los siguientes escenarios corresponde claramente a DDL y no a DML?",
		options: [
			"Agregar un nuevo libro a la tabla LIBRO.",
			"Cambiar el título de un libro ya registrado.",
			"Eliminar un registro específico de la tabla LIBRO.",
			"Eliminar completamente la tabla LIBRO de la base de datos.",
		],
	},
];

export const POST_QUESTIONS: Question[] = [
	{
		id: "q1",
		prompt: "Un desarrollador ejecuta el siguiente comando. ¿A qué categoría de SQL pertenece esta instrucción?",
		code: `CREATE TABLE autor(
    id_autor NUMBER PRIMARY KEY,
    nombre VARCHAR2(100) NOT NULL
);`,
		options: ["DML", "DQL", "DCL", "DDL"],
	},
	{
		id: "q2",
		prompt: "Considere la siguiente definición. ¿Qué garantiza esta restricción?",
		code: "id_autor NUMBER REFERENCES AUTOR(id_autor)",
		options: [
			"Que el valor no sea nulo.",
			"Que cada libro tenga un identificador único.",
			"Que el autor exista previamente en la tabla AUTOR.",
			"Que el valor sea mayor que cero.",
		],
	},
	{
		id: "q3",
		prompt: "Una tabla LIBRO ya existe y se necesita agregar una columna llamada genero. ¿Cuál es la instrucción más adecuada?",
		options: [
			"CREATE TABLE LIBRO",
			"INSERT INTO LIBRO",
			"ALTER TABLE LIBRO ADD genero VARCHAR2(50)",
			"DROP TABLE LIBRO",
		],
	},
	{
		id: "q4",
		prompt: "Observe la siguiente restricción. ¿Cuál es su propósito?",
		code: "CHECK (anio > 1450)",
		options: [
			"Verificar que cada libro tenga un autor.",
			"Restringir los valores permitidos para el año.",
			"Evitar valores duplicados.",
			"Asignar permisos sobre la tabla.",
		],
	},
	{
		id: "q5",
		prompt: "Un usuario ejecuta el siguiente comando. ¿Cuál será el resultado?",
		code: "DROP TABLE LIBRO;",
		options: [
			"Se eliminarán únicamente los registros de la tabla.",
			"Se eliminará la tabla y toda la información almacenada en ella.",
			"Se eliminará únicamente la clave primaria.",
			"La tabla quedará vacía, pero seguirá existiendo.",
		],
	},
];

// ─────────────────────── Unidad 2 · DML ───────────────────────
// Reconstruido del documento "Preguntas Sprint 2" (PRE / POST) del curso.

export const PRE_QUESTIONS_DML: Question[] = [
	{
		id: "q1",
		prompt:
			"Observa estas acciones sobre una base de datos de cine: I. Crear la tabla funciones. II. Registrar una nueva venta. III. Cambiar el precio de una función existente. IV. Eliminar una columna de la tabla ventas. ¿Cuáles modifican datos almacenados y no la estructura?",
		options: ["I y IV", "II y III", "I y II", "III y IV"],
	},
	{
		id: "q2",
		prompt:
			"¿Cuál sería el efecto más probable de este comando si la tabla funciones tiene varias filas?",
		code: "UPDATE funciones\nSET precio = 30;",
		options: [
			"Solo se modifica la función más reciente.",
			"Se modifica el precio de todas las funciones.",
			"Oracle ejecuta el comando solo si existe una clave primaria.",
			"Se crea una nueva columna llamada precio.",
		],
	},
	{
		id: "q3",
		prompt: "¿Cuál es el propósito principal del comando UPDATE?",
		options: [
			"Crear una nueva tabla",
			"Eliminar una tabla existente",
			"Modificar datos ya almacenados",
			"Consultar información",
		],
	},
	{
		id: "q4",
		prompt: "¿Cuál de las siguientes opciones diferencia correctamente DELETE y DROP?",
		options: [
			"DELETE elimina registros de una tabla; DROP elimina la tabla completa.",
			"DELETE elimina la estructura; DROP elimina solo los datos.",
			"Ambos eliminan únicamente registros, pero DROP necesita WHERE.",
			"Ambos pertenecen a DML porque eliminan información.",
		],
	},
	{
		id: "q5",
		prompt:
			"Una empresa ejecuta una modificación de precios y revisa que el resultado fue incorrecto antes de hacerlo permanente. ¿Qué acción debería permitirle deshacer el cambio?",
		options: ["COMMIT", "ROLLBACK", "INSERT", "DROP"],
	},
];

export const POST_QUESTIONS_DML: Question[] = [
	{
		id: "q1",
		prompt: "¿Qué hace este comando?",
		code: "UPDATE funciones\nSET precio = 30\nWHERE pelicula = 'Duna 2';",
		options: [
			"Crea una nueva tabla llamada funciones.",
			"Inserta una nueva función de cine.",
			"Cambia el precio solo de las filas que cumplen la condición indicada.",
			"Elimina todas las funciones con precio 30.",
		],
	},
	{
		id: "q2",
		prompt: "¿Cuál es el principal riesgo de ejecutar un UPDATE sin WHERE?",
		options: [
			"Que Oracle no permita ejecutar el comando.",
			"Que se cree una nueva columna automáticamente.",
			"Que se modifiquen todas las filas de la tabla.",
			"Que se elimine la tabla completa.",
		],
	},
	{
		id: "q3",
		prompt: "¿Qué diferencia se establece entre DELETE y DROP?",
		options: [
			"DELETE elimina registros dentro de una tabla; DROP elimina la tabla completa con su estructura.",
			"DELETE elimina columnas; DROP elimina solo registros.",
			"DELETE crea tablas; DROP inserta registros.",
			"No existe diferencia, ambos hacen exactamente lo mismo.",
		],
	},
	{
		id: "q4",
		prompt: "¿Para qué sirve ROLLBACK en una transacción?",
		options: [
			"Para confirmar definitivamente los cambios realizados.",
			"Para crear una nueva tabla después de un error.",
			"Para deshacer cambios antes de hacerlos permanentes.",
			"Para consultar los datos de una tabla.",
		],
	},
	{
		id: "q5",
		prompt:
			"En una empresa real, ¿por qué conviene trabajar con transacciones al modificar o eliminar datos?",
		options: [
			"Porque las transacciones reemplazan la necesidad de escribir SQL.",
			"Porque permiten ejecutar cambios, verificarlos y deshacerlos si algo salió mal.",
			"Porque convierten comandos DML en comandos DDL.",
			"Porque evitan que se puedan insertar datos nuevos.",
		],
	},
];
