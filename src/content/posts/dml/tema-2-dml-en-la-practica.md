---
title: "Tema 2 · DML en la práctica (cadena de cines)"
published: 2026-06-20
description: "La operación diaria del cine en Oracle: vender entradas (INSERT), corregir precios (UPDATE con WHERE), anular ventas (DELETE) y deshacer errores con transacciones. Acompaña al Video 2 de la Unidad 2."
tags: ["SQL", "DML", "Oracle"]
category: "DML"
---

> Esta lectura acompaña al **Video 2** de la Unidad 2. Reproduce el mismo ejercicio que puedes correr en [Oracle Live SQL](https://livesql.oracle.com).

En la Unidad 1 **creamos** las tablas del cine (`funcion` y `venta`). Ahora el cine ya abrió: toca **operarlas** con DML.

Partimos de la cartelera ya cargada:

```sql
-- Cartelera inicial (ya existe)
INSERT INTO funcion (id_funcion, pelicula, precio) VALUES (1, 'Duna 2', 25.00);
INSERT INTO funcion (id_funcion, pelicula, precio) VALUES (2, 'Intensamente 2', 22.00);
INSERT INTO funcion (id_funcion, pelicula, precio) VALUES (3, 'Deadpool 3', 28.00);
```

## 1) Vender una entrada (INSERT)

Cada venta es una fila nueva en `venta`. La `FOREIGN KEY` obliga a que la función exista, y la `UNIQUE (id_funcion, butaca)` impide vender dos veces la misma butaca.

```sql
INSERT INTO venta (id_funcion, butaca, cliente)
VALUES (1, 'F12', 'Alvaro');   -- entrada para Duna 2
```

```text
1 row created.
```

Si intentáramos vender la misma butaca otra vez, la restricción heredada del DDL nos frena:

```text
ORA-00001: unique constraint (UQ_BUTACA) violated
```

El INSERT **respeta el molde**: no puede saltarse las reglas de la estructura.

## 2) Corregir un precio (UPDATE con WHERE)

Sube la entrada de *Duna 2* a 30. Lo importante es el `WHERE`: sin él, cambiarías el precio de **toda** la cartelera.

```sql
UPDATE funcion
SET precio = 30
WHERE pelicula = 'Duna 2';
```

```text
1 row updated.
```

| id_funcion | pelicula | precio |
|---|---|---|
| 1 | Duna 2 | **30.00** ← cambió |
| 2 | Intensamente 2 | 22.00 |
| 3 | Deadpool 3 | 28.00 |

> **El error de S/ millones:** `UPDATE funcion SET precio = 30;` (sin `WHERE`) deja las tres películas a 30. Escribe siempre el `WHERE` primero.

## 3) Anular una venta (DELETE con WHERE)

Un cliente se arrepiente. Borramos **esa** venta, no la tabla:

```sql
DELETE FROM venta
WHERE id_venta = 102;
```

```text
1 row deleted.
```

La tabla `venta` sigue existiendo y con el resto de ventas intactas. Borrar la tabla completa sería `DROP TABLE venta;` — otra cosa, y de la familia DDL.

## 4) Subir precios… y arrepentirse (transacción + ROLLBACK)

Gerencia pide simular un alza del 50%. Lo hacemos dentro de una transacción para poder **revisar antes de confirmar**:

```sql
BEGIN;
  UPDATE funcion SET precio = precio * 1.5;     -- alza masiva
  SELECT pelicula, precio FROM funcion;         -- revisamos: quedó carísimo
ROLLBACK;                                        -- se descarta: todo vuelve atrás
```

Después del `ROLLBACK`, los precios quedan **exactamente como estaban** (Duna 2 a 25, Deadpool 3 a 28). Nada se guardó.

Cuando el cambio sí es correcto, se confirma con `COMMIT`:

```sql
BEGIN;
  UPDATE funcion SET precio = precio * 1.1 WHERE pelicula = 'Duna 2';
COMMIT;   -- el nuevo precio (27.50) queda permanente
```

> **Recuerda:** en Oracle, un comando **DDL** (`ALTER`, `DROP`…) hace `COMMIT` implícito y cerraría la transacción. Las transacciones son la herramienta del **DML**.

## La lección de la unidad

DML no es solo escribir comandos: es operar el negocio sin romperlo.

- Con `INSERT`, los datos **nacen respetando las reglas**.
- Con `UPDATE` + `WHERE`, corriges **exactamente lo que debes**.
- Con `DELETE` + `WHERE`, retiras **una fila**, no la tabla.
- Con **transacciones**, todo cambio riesgoso es **reversible** hasta el `COMMIT`.

¿Listo? Vuelve a la [Unidad 2](/unidad-2/) y resuelve los ejercicios del **sandbox**, luego cierra con la **evaluación final**.
