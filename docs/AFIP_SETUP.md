# Configuración AFIP - Sistema BDN Importación

## 🎯 Introducción

Este documento explica cómo configurar la integración con AFIP para facturación electrónica.

## 📋 Prerrequisitos

1. **CUIT de la empresa** registrado en AFIP
2. **Certificado digital** para facturación electrónica
3. **Punto de venta** habilitado en AFIP
4. **Acceso a Web Services** de AFIP

## 🔧 Configuración Paso a Paso

### 1. Generar Certificado Digital

```bash
# Generar clave privada
openssl genrsa -out afip-testing.key 2048

# Generar solicitud de certificado
openssl req -new -key afip-testing.key -out afip-testing.csr

# Datos a completar:
# Country Name: AR
# State: [Tu provincia]
# City: [Tu ciudad]
# Organization: [Nombre de tu empresa]
# Organizational Unit: [Departamento]
# Common Name: [Tu CUIT]
# Email: [Tu email]
```

### 2. Subir Certificado a AFIP

1. Ir a https://auth.afip.gob.ar/contribuyente_/
2. Administrador de Relaciones de Clave Fiscal → Certificados Digitales
3. Subir el archivo `.csr` generado
4. Descargar el certificado `.crt` aprobado

### 3. Configurar Variables de Entorno

```env
# AFIP Configuration
AFIP_ENVIRONMENT=testing        # testing | production
AFIP_CUIT=20123456789          # Tu CUIT
AFIP_CERT_PATH=./certs/afip-testing.crt
AFIP_KEY_PATH=./certs/afip-testing.key
AFIP_PASSPHRASE=               # Si tu clave tiene passphrase
```

### 4. Colocar Certificados

```bash
# Copiar certificados a la carpeta correcta
cp path/to/your/afip-testing.crt ./certs/
cp path/to/your/afip-testing.key ./certs/

# Verificar permisos
chmod 600 ./certs/afip-testing.key
chmod 644 ./certs/afip-testing.crt
```

### 5. Configurar Puntos de Venta en AFIP

1. Ir a https://serviciosweb.afip.gob.ar/
2. Mis Aplicaciones → Comprobantes en línea
3. Administrar puntos de venta
4. Configurar punto de venta (ej: 0001)

## 🧪 Testing

### Probar Conexión

```bash
# Ejecutar script de prueba
npx tsx scripts/test-afip-connection.ts
```

### Datos de Testing AFIP

- **CUIT de prueba**: 20123456789
- **Punto de venta**: 1
- **Ambiente**: Testing (homologación)

### Certificados de Testing

Para testing, AFIP proporciona certificados preconfigurados. Contacta al soporte de AFIP para obtenerlos.

## 🔄 Flujo de Facturación

### 1. Automática (Recomendado)

Las ventas marcadas como "en blanco" se facturan automáticamente al ser confirmadas.

### 2. Manual

```javascript
// Via API
POST /api/sales/afip
{
  "saleId": "id-de-la-venta"
}

// Via Service
import { getAfipService } from '@/services/afip-service';
const result = await getAfipService().generateInvoiceForSale(saleId);
```

## 📊 Códigos AFIP Importantes

### Tipos de Comprobante
- **1**: Factura A
- **6**: Factura B  
- **11**: Factura C
- **3**: Nota de Crédito A
- **8**: Nota de Crédito B

### Tipos de Documento
- **80**: CUIT (Responsable Inscripto)
- **86**: CUIL (Monotributo)
- **99**: Sin identificar (Consumidor Final)

### Tipos de IVA
- **2**: Exento
- **3**: 0%
- **4**: 10.5%
- **5**: 21%
- **6**: 27%

## 🚨 Troubleshooting

### Error: "Certificado no válido"
- Verificar que el certificado esté vigente
- Confirmar que el CUIT coincida
- Revisar que el certificado esté habilitado en AFIP

### Error: "Punto de venta no autorizado"
- Verificar configuración en AFIP Web
- Confirmar que el punto de venta esté activo
- Revisar permisos del certificado

### Error: "Datos de comprobante inválidos"
- Verificar que los montos cuadren
- Confirmar que el cliente tenga CUIT válido
- Revisar tipos de IVA de los productos

## 📞 Soporte

### AFIP
- **Teléfono**: 0800-222-AFIP (2347)
- **Web**: https://www.afip.gob.ar/
- **Mesa de ayuda**: https://serviciosweb.afip.gob.ar/

### Sistema BDN
- Revisar logs en la consola del servidor
- Ejecutar script de diagnóstico
- Verificar variables de entorno

## 🔄 Migración a Producción

### 1. Certificado de Producción
- Generar nuevo certificado para producción
- Subirlo a AFIP en ambiente productivo

### 2. Variables de Entorno
```env
AFIP_ENVIRONMENT=production
AFIP_CERT_PATH=./certs/afip-production.crt
AFIP_KEY_PATH=./certs/afip-production.key
```

### 3. Validación
- Probar con facturas de bajo monto
- Verificar numeración secuencial
- Confirmar CAE válidos

## 📈 Monitoreo

### Métricas Clave
- Facturas exitosas vs fallidas
- Tiempo promedio de respuesta AFIP
- Errores más frecuentes

### Logs
```bash
# Ver logs de AFIP
tail -f logs/afip.log

# Buscar errores
grep "Error" logs/afip.log
``` 