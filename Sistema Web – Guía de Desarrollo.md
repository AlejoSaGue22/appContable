# Sistema Contable Web – Guía de Desarrollo Completa

## 1. Objetivo del sistema

Construir un **sistema web contable y financiero** que permita a una persona o empresa:

* Registrar **ingresos y gastos**
* Emitir **facturas de venta** (incluyendo electrónicas)
* Registrar **compras y gastos operativos**
* Obtener **resultados financieros** (ganancias/pérdidas)
* Mantener **trazabilidad contable real**

Stack:

* **Frontend:** Angular
* **Backend:** NestJS
* **DB:** PostgreSQL / MySQL / Oracle

---

## 2. Flujo general del sistema (visión macro)

```
Configuración inicial
   ↓
Catálogos base (una sola vez)
   ↓
Operaciones diarias
   ↓
Procesos contables automáticos
   ↓
Reportes financieros
```

---

## 3. Módulos principales del sistema

### 3.1 Configuración (Setup inicial)

Este módulo se ejecuta **antes de operar**.

* Empresa
* Usuarios y roles
* Plan de cuentas contables
* Impuestos
* Artículos (ventas y compras)
* Clientes
* Proveedores

👉 Sin esto, **no se puede facturar**.

---

## 4. Flujo operativo REAL (día a día)

### 4.1 Factura de venta

```
Cliente
   ↓
Selecciona artículos de venta
   ↓
Sistema calcula impuestos
   ↓
Se guarda factura
   ↓
Se genera asiento contable
   ↓
Actualiza ingresos
```

**Resultado contable:**

* Aumenta ingresos
* Aumenta cuentas por cobrar o caja

---

### 4.2 Factura de venta electrónica

```
Factura validada
   ↓
Generar XML/JSON
   ↓
Enviar a proveedor electrónico
   ↓
Respuesta (aprobada / rechazada)
   ↓
Guardar estado fiscal
```

---

### 4.3 Registro de gasto

```
Proveedor
   ↓
Selecciona artículo de gasto
   ↓
Sistema usa cuenta contable
   ↓
Se registra gasto
   ↓
Se genera asiento
```

**Resultado contable:**

* Aumenta gastos
* Disminuye caja o genera cuentas por pagar

---

## 5. Lógica contable automática (clave del sistema)

⚠️ **El usuario NO elige cuentas contables en documentos**

Todo sale desde:

* Artículos
* Impuestos

Ejemplo:

* Artículo: Papelería
* Cuenta: 5105
* IVA: 2408

Al usarlo → el sistema **sabe qué asiento generar**.

---

## 6. Modelo de base de datos (núcleo)

### 6.1 Usuarios y empresa

```sql
EMPRESA(id, nombre, nit, moneda)
USUARIO(id, empresa_id, nombre, email, rol)
```

---

### 6.2 Plan de cuentas

```sql
CUENTA_CONTABLE(
  id,
  codigo,
  nombre,
  tipo, -- ACTIVO, PASIVO, INGRESO, GASTO
  naturaleza -- DEBITO / CREDITO
)
```

---

### 6.3 Artículos (ventas / compras)

```sql
ARTICULO(
  id,
  codigo,
  nombre,
  tipo, -- VENTA, GASTO, INVENTARIO
  cuenta_contable_id,
  cuenta_iva_id,
  afecta_inventario BOOLEAN,
  estado
)
```

👉 **Este es el corazón del sistema**

---

### 6.4 Clientes y proveedores

```sql
CLIENTE(id, nombre, documento, email)
PROVEEDOR(id, nombre, documento, email)
```

---

### 6.5 Facturas de venta

```sql
FACTURA_VENTA(
  id,
  cliente_id,
  fecha,
  total,
  estado
)

FACTURA_VENTA_DETALLE(
  id,
  factura_id,
  articulo_id,
  cantidad,
  precio,
  impuesto
)
```

---

### 6.6 Gastos

```sql
GASTO(
  id,
  proveedor_id,
  fecha,
  total
)

GASTO_DETALLE(
  id,
  gasto_id,
  articulo_id,
  valor
)
```

---

### 6.7 Contabilidad (asientos)

```sql
ASIENTO(
  id,
  fecha,
  referencia,
  tipo
)

ASIENTO_DETALLE(
  id,
  asiento_id,
  cuenta_id,
  debito,
  credito
)
```

---

## 7. Flujo de generación de asientos

### Factura de venta

```
Caja / CxC      D
   Ingresos          C
   IVA por pagar     C
```

### Gasto

```
Gasto            D
IVA crédito      D
   Caja / CxP        C
```

---

## 8. Reportes financieros

### Estado de resultados

```
Ingresos
- Costos
----------------
Utilidad bruta
- Gastos
----------------
Utilidad neta
```

### Flujo de caja

* Entradas
* Salidas

---

## 9. Arquitectura NestJS sugerida

```
modules/
  auth/
  users/
  company/
  accounts/
  articles/
  invoices/
  expenses/
  accounting/
  reports/
```

Cada módulo:

* controller
* service
* entity
* dto

---

## 10. Flujo Angular recomendado

```
/login
/dashboard
/configuracion
/compras
/ventas
/gastos
/reportes
```

---

## 11. Roadmap para terminar el sistema

1️⃣ Plan de cuentas + artículos
2️⃣ Clientes / proveedores
3️⃣ Factura de venta normal
4️⃣ Asientos automáticos
5️⃣ Registro de gastos
6️⃣ Reportes financieros
7️⃣ Facturación electrónica

---

## 12. Regla de oro

> **Si un sistema contable no genera asientos automáticos, NO es contable**

---

Si quieres, en el siguiente paso puedo:

* Diseñarte los **DTOs NestJS**
* Crear los **servicios de asientos automáticos**
* Mostrar el **flujo exacto Angular → API → DB**
* Armar el **checklist para producción**
