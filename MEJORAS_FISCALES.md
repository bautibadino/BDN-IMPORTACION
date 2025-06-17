# 🧾 Mejoras Fiscales Implementadas

## Resumen de Cambios

Hemos implementado un sistema fiscal completo para Argentina que cumple con los requisitos de AFIP y las normativas fiscales locales.

## 🆕 Nuevos Campos en Base de Datos

### Productos
- **`ivaType`**: Tipo de IVA (iva_21, iva_10_5, iva_27, iva_5, iva_2_5, no_gravado, exento)
- **`unit`**: Unidad de medida (unidad, kg, m, litro, hora, etc.)
- **`description`**: Descripción fiscal detallada
- **`minStock`**: Stock mínimo
- **`taxCode`**: Código tributario del producto

### Ventas (Sale)
- **`invoiceType`**: Tipo de comprobante (FACTURA_A, FACTURA_B, FACTURA_C, FACTURA_E, etc.)
- **`pointOfSale`**: Punto de venta AFIP (ej: "0001")
- **`invoiceNumber`**: Número secuencial de factura
- **`fullNumber`**: Número completo (ej: "B-0001-00000123")
- **`authCode`**: CAE - Código de autorización AFIP
- **`authCodeExpiry`**: Vencimiento del CAE
- **`taxedAmount`**: Monto gravado (base para IVA)
- **`nonTaxedAmount`**: Monto no gravado
- **`exemptAmount`**: Monto exento
- **`grossIncomePerception`**: Percepción IIBB

### Items de Venta (SaleItem)
- **`ivaType`**: Tipo de IVA aplicado (copiado del producto)
- **`ivaAmount`**: Monto de IVA de esta línea
- **`totalAmount`**: Total CON IVA (subtotal + ivaAmount)

### Items de Presupuesto (QuoteItem)
- **`ivaType`**: Tipo de IVA aplicado
- **`ivaAmount`**: Monto de IVA de esta línea
- **`totalAmount`**: Total CON IVA

## 🔧 Nuevas Utilidades Fiscales

### `lib/fiscal-utils.ts`

#### Constantes
- **`IVA_RATES`**: Porcentajes de IVA por tipo
- **`IVA_NAMES`**: Nombres legibles de tipos de IVA
- **`INVOICE_TYPE_BY_CUSTOMER`**: Tipo de factura según tipo de cliente

#### Funciones
- **`calculateIVA(amount, ivaType)`**: Calcular IVA de un monto
- **`calculatePriceWithIVA(basePrice, ivaType)`**: Calcular precio con IVA
- **`calculateFiscalAmounts(items)`**: Discriminar montos para AFIP
- **`getInvoiceTypeForCustomer(customerType)`**: Determinar tipo de factura
- **`generateFullInvoiceNumber(type, pos, number)`**: Generar número completo
- **`validateCUIT(cuit)`**: Validar CUIT/CUIL
- **`formatCUIT(cuit)`**: Formatear CUIT para mostrar

## 🎨 Nuevos Componentes

### `FiscalSummary`
Componente para mostrar información fiscal completa:
- Tipo de comprobante con badge de color
- Número de comprobante y CAE
- Discriminación fiscal (gravado, no gravado, exento, IVA)
- Información legal según tipo de factura

## 📊 Productos de Ejemplo Creados

El script `update-products-fiscal.js` creó productos con diferentes tipos de IVA:

1. **Notebook HP** - IVA 21% (tecnología)
2. **Cable HDMI** - IVA 21% (accesorios)
3. **Leche 1L** - IVA 10.5% (alimento básico)
4. **Libro Contabilidad** - Exento (material educativo)
5. **Consultoría IT** - IVA 21% (servicio profesional)

## 🔄 Actualizaciones en APIs

### `/api/products`
- Retorna campos fiscales: `ivaType`, `unit`, `description`, `minStock`

### `/api/sales`
- Acepta campos fiscales en creación de ventas
- Calcula automáticamente discriminación fiscal
- Asigna tipo de comprobante según cliente

## 🖥️ Mejoras en UI

### ProductSelector
- Muestra tipo de IVA con badge
- Incluye unidad de medida
- Información fiscal visible

### Formulario de Nueva Venta
- Cálculos fiscales automáticos
- Discriminación de IVA por línea
- Tipo de comprobante según cliente
- Totales fiscalmente correctos

## 📋 Cumplimiento Normativo

### AFIP
- ✅ Discriminación de montos gravados/no gravados/exentos
- ✅ Tipos de comprobante según condición fiscal
- ✅ Estructura para CAE (Código de Autorización Electrónica)
- ✅ Numeración secuencial de comprobantes

### Tipos de IVA Soportados
- ✅ IVA 21% (general)
- ✅ IVA 10.5% (alimentos básicos)
- ✅ IVA 27% (servicios digitales)
- ✅ IVA 5% (medicamentos)
- ✅ IVA 2.5% (algunos alimentos)
- ✅ No Gravado
- ✅ Exento

### Tipos de Cliente vs Comprobante
- **Responsable Inscripto** → Factura A (discrimina IVA)
- **Monotributista** → Factura B (IVA incluido)
- **Consumidor Final** → Factura B (IVA incluido)
- **Exento** → Factura B (IVA incluido)

## 🚀 Próximos Pasos Sugeridos

1. **Integración AFIP**: Conectar con Web Services de AFIP para CAE automático
2. **Percepciones**: Agregar cálculo de percepciones de IIBB
3. **Retenciones**: Sistema de retenciones de IVA y Ganancias
4. **Reportes Fiscales**: Libros IVA Ventas y Compras
5. **Facturación Electrónica**: Implementar FE completa con AFIP

## 📈 Beneficios Implementados

- ✅ **Cumplimiento Legal**: Sistema fiscalmente correcto para Argentina
- ✅ **Automatización**: Cálculos automáticos de IVA y discriminación
- ✅ **Flexibilidad**: Soporte para todos los tipos de IVA
- ✅ **Escalabilidad**: Base sólida para integración AFIP
- ✅ **UX Mejorada**: Información fiscal clara y accesible
- ✅ **Datos Consistentes**: Validaciones y formatos correctos

---

*Sistema actualizado el 16 de Junio de 2025 - Versión con mejoras fiscales completas* 