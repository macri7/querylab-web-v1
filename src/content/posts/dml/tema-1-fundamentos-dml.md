---
title: "Tema 1 · Fundamentos de DML"
published: 2026-06-20
description: "Qué es el DML y cómo INSERT, UPDATE y DELETE mueven los datos de una base. El WHERE como red de seguridad y las transacciones (COMMIT/ROLLBACK). Acompaña al Video 1 de la Unidad 2."
tags: ["SQL", "DML", "Oracle"]
category: "DML"
---

> Esta lectura acompaña al **Video 1** de la Unidad 2. Aquí tienes el mismo contenido para repasar a tu ritmo, con el SQL listo para copiar.

En la Unidad 1 construimos el **molde** con DDL (`CREATE`, `ALTER`, `DROP`). Ahora toca **llenarlo y mantenerlo**: eso es DML.

## ¿Dónde encaja el DML?

| Familia | Significa | Comandos | ¿Qué toca? |
|---|---|---|---|
| DDL | *Data Definition Language* | `CREATE`, `ALTER`, `DROP` | La **estructura** |
| **DML** | *Data Manipulation Language* | `INSERT`, `UPDATE`, `DELETE` | Los **datos** (las filas) |
| DQL | *Data Query Language* | `SELECT` | La **consulta** |
| DCL | *Data Control Language* | `GRANT`, `REVOKE` | Los **permisos** |

La idea clave: **DML no cambia la forma de la tabla, cambia lo que hay dentro de ella.**

## Los tres verbos del dato

- `INSERT` — **nace** una fila nueva.
- `UPDATE` — **cambia** filas que ya existen.
- `DELETE` — **se va** una o más filas.

## INSERT: dar de alta una fila

Crear datos es respetar las reglas que el DDL ya dejó codificadas (NOT NULL, CHECK, FOREIGN KEY).

```sql
INSERT INTO funcion (pelicula, precio)
VALUES ('Duna 2', 25.00);
```

Si la tabla tiene una `CHECK (precio > 0)`, un `INSERT` con `precio = 0` será **rechazado**: el dato no entra. El INSERT no puede saltarse las reglas de la estructura.

## UPDATE: el comando más peligroso

`UPDATE` cambia los datos de filas existentes. Su poder —y su riesgo— está en el `WHERE`.

```sql
-- ✓ CON WHERE: cambia solo Duna 2
UPDATE funcion
SET precio = 30
WHERE pelicula = 'Duna 2';
```

```sql
-- ✗ SIN WHERE: cambia TODAS las películas
UPDATE funcion
SET precio = 30;
```

El `WHERE` no es opcional: es lo que separa *"corregí un precio"* de *"rompí toda la cartelera"*. La regla profesional: **escribe primero el `WHERE`, después el `SET`.**

## DELETE: borrar filas (no la tabla)

`DELETE` elimina filas. La tabla **sigue existiendo**.

```sql
DELETE FROM venta
WHERE id_venta = 102;
```

Aquí está la confusión que más cuesta dinero:

- `DELETE FROM venta;` → **DML**: borra *filas*, la tabla `venta` sigue ahí (vacía).
- `DROP TABLE venta;` → **DDL**: borra la *tabla completa*, deja de existir.

DELETE **vacía**; DROP hace **desaparecer**.

## La red de seguridad: transacciones

¿Y si ejecuto un `UPDATE` o `DELETE` y me equivoco? Para eso existen las **transacciones**: agrupan cambios que puedes **confirmar** o **deshacer** en bloque.

```sql
BEGIN;                                      -- empieza la transacción
  UPDATE funcion SET precio = precio * 1.5; -- aplico un cambio masivo
  SELECT pelicula, precio FROM funcion;     -- reviso: ¡quedó carísimo!
ROLLBACK;                                   -- me arrepiento: deshago todo
```

- `ROLLBACK` → **deshace** los cambios de la transacción, como si nada hubiera pasado.
- `COMMIT` → **confirma** los cambios; recién ahí son permanentes.

```sql
BEGIN;
  UPDATE funcion SET precio = precio * 1.1 WHERE pelicula = 'Duna 2';
COMMIT;   -- ahora sí: el nuevo precio queda guardado
```

> **Detalle clave de Oracle:** los comandos **DDL** hacen `COMMIT` implícito (no se pueden deshacer con `ROLLBACK`). Las transacciones son la herramienta del **DML**, no del DDL.

## En una frase

DML es el lenguaje de los **datos**: das de alta (`INSERT`), corriges (`UPDATE`), retiras (`DELETE`) — siempre preguntándote *¿a cuántas filas afecto?* y *¿puedo deshacerlo?*. En el [Tema 2](/unidad-2/dml-en-la-practica/) lo llevamos a la operación real de una cadena de cines en Oracle.
