# Story 3.3 - Image and Table Extraction
## Guía de Implementación y Testing

---

## 📋 Resumen Ejecutivo

Esta story extiende el sistema de procesamiento de PDFs para extraer **imágenes** y **tablas** además del texto, mejorando significativamente la experiencia de lectura al preservar el contenido visual de los documentos.

### Antes (Story 3.2)
```
PDF → Texto → Guardado en DB → Listo
```

### Después (Story 3.3)
```
PDF → Texto (33%) → Imágenes (66%) → Tablas (100%) → Guardado atómico en DB → Listo
```

---

## 🎯 Qué Se Implementó

### 1. Extracción de Imágenes
- **Tecnología**: pdf2pic + ImageMagick/GraphicsMagick
- **Proceso**: Cada página del PDF se convierte a imagen PNG usando ImageMagick
- **Almacenamiento**: `/storage/images/{bookId}/page-{n}.png`
- **Calidad**: 150 DPI, 1200x1600px máximo
- **Requisito del Sistema**: ImageMagick o GraphicsMagick debe estar instalado
  - Windows: Descargar de https://imagemagick.org/script/download.php
  - macOS: `brew install imagemagick`
  - Linux: `sudo apt-get install imagemagick`

### 2. Extracción de Tablas
- **Tecnología**: pdf-parse con análisis de posiciones
- **Detección**: Analiza alineación vertical/horizontal del texto
- **Validación**: Estructura mínima requerida (2+ filas, 2+ columnas consistentes)
- **Output**: HTML `<table>` con clase CSS `extracted-table`

### 3. Procesamiento en 3 Etapas
El usuario ve progreso detallado:
1. "Extracting text..." (0-33%)
2. "Extracting images..." (33-66%)
3. "Extracting tables..." (66-100%)

### 4. Base de Datos
Nueva tabla `Image` con:
- Relación `Book` → `Images` (cascade delete)
- Índice compuesto `(bookId, pageNumber)` para queries eficientes
- Metadatos: filename, dimensions, pageNumber

### 5. Atomicidad de Datos
Todas las operaciones de DB se hacen en una transacción:
```
BEGIN TRANSACTION
  CREATE chapter
  CREATE images (si hay)
  UPDATE book status = READY
COMMIT
```

---

## 🏗️ Arquitectura Técnica

### Flujo de Datos

```
Usuario sube PDF
    ↓
POST /api/upload → Guarda archivo, crea Book (PROCESSING)
    ↓
POST /api/process/{bookId} → Responde inmediatamente {accepted: true}
    ↓
Background Processing:
    ├─ Etapa 1: extractTextFromPDF()
    ├─ Etapa 2: extractImagesFromPDF() → /storage/images/{bookId}/
    ├─ Etapa 3: extractTablesFromPDF()
    └─ Transacción DB: chapter + images + book update
    ↓
GET /api/books/{id}/status → READY
```

### Estructura de Archivos Modificados

```
src/
├── lib/services/pdf-extraction.ts      # + extractImagesFromPDF, extractTablesFromPDF
│                                        # + validateFileSize, isValidTable
├── app/api/process/[bookId]/route.ts   # + 3-stage processing, $transaction
├── lib/stores/upload-store.tsx         # + updated processing steps
prisma/
├── schema.prisma                       # + Image model, composite index
tests/unit/
├── pdf-extraction.test.ts              # + 11 tests nuevos
└── api/process.test.ts                 # + mocks para nuevas funciones
```

---

## 🧪 Cómo Testear los Cambios

### 1. Tests Unitarios Automatizados

```bash
# Ejecutar tests de extracción
npm test -- --run tests/unit/pdf-extraction.test.ts

# Ejecutar tests del API
npm test -- --run tests/unit/api/process.test.ts

# Ejecutar todos los tests unitarios
npm test -- --run tests/unit/
```

**Resultados esperados:**
- `pdf-extraction.test.ts`: 22 passed ✅
- `api/process.test.ts`: 2 passed ✅

### 2. Test Manual con PDF Real

#### Paso 1: Preparar un PDF de prueba
Necesitas un PDF que contenga:
- Texto (obligatorio)
- Imágenes (opcional pero recomendado)
- Tablas (opcional)

#### Paso 2: Subir el PDF
```bash
# Iniciar servidor de desarrollo
npm run dev

# En otra terminal, subir un PDF de prueba
curl -X POST http://localhost:3000/api/upload \
  -F "file=@/ruta/a/tu/documento.pdf"
```

#### Paso 3: Verificar procesamiento
```bash
# Obtener ID del libro creado, luego:
curl http://localhost:3000/api/books/{bookId}/status
```

**Respuesta esperada durante procesamiento:**
```json
{
  "status": "PROCESSING",
  "progress": 66,
  "message": "Extracting images..."
}
```

**Respuesta esperada al completar:**
```json
{
  "status": "READY",
  "progress": 100,
  "metadata": {
    "totalPages": 10,
    "wordCount": 2500,
    "imageCount": 5,
    "tableCount": 2
  }
}
```

#### Paso 4: Verificar imágenes extraídas
```bash
# Listar imágenes extraídas
ls -la storage/images/{bookId}/

# Deberías ver archivos como:
# page-1.png, page-2.png, etc.
```

#### Paso 5: Verificar contenido en DB
```bash
# Conectar a Prisma Studio
npx prisma studio
```

Navegar a:
- **Book**: Verificar status = READY, totalPages, wordCount
- **Chapter**: Verificar content contiene placeholders `[IMAGE:...]` y `[TABLE:...]`
- **Image**: Verificar registros creados con bookId, filename, pageNumber

### 3. Test de Límite de Tamaño

```bash
# Crear un PDF grande (>100MB) para probar validación
dd if=/dev/zero of=large.pdf bs=1M count=101

# Intentar subirlo - debería fallar con error de tamaño
curl -X POST http://localhost:3000/api/upload \
  -F "file=@large.pdf"
```

### 4. Test de PDF Escaneado (Sin Texto)

Subir un PDF que solo contenga imágenes escaneadas (sin texto OCR):

**Resultado esperado:**
- Status: `ERROR`
- Error message: `"PDF appears to be scanned or contains no extractable text"`

---

## 🔍 Cómo Verificar el Código

### 1. Revisar Extracción de Imágenes

**Archivo:** `src/lib/services/pdf-extraction.ts`

Buscar función `extractImagesFromPDF()`:
```typescript
// Verificar que usa canvas real
import { createCanvas } from 'canvas';
// ...
const canvas = createCanvas(viewport.width, viewport.height);
const buffer = canvas.toBuffer('image/png');
```

**Logs esperados en consola:**
```
[PDF] Extracted image from page 1: page-1.png (892x1263)
[PDF] Total images extracted: 5 from 10 pages
```

### 2. Revisar Extracción de Tablas

**Archivo:** `src/lib/services/pdf-extraction.ts`

Buscar función `detectTables()`:
```typescript
// Verificar validación de estructura
function isValidTable(rows): boolean {
  if (rows.length < 2) return false;  // Mínimo 2 filas
  // ...
  return avgCols >= 2 && maxVariance <= 1.5;
}
```

**Logs esperados:**
```
[PDF] Total tables detected: 3
```

### 3. Revisar Transacciones

**Archivo:** `src/app/api/process/[bookId]/route.ts`

Buscar:
```typescript
await prisma.$transaction(async (tx) => {
  await tx.chapter.create({...});
  await tx.image.createMany({...});
  await tx.book.update({...});
});
```

**Logs esperados:**
```
[Process] Saving to database...
[Process] Book {bookId} processed successfully
```

---

## 📊 Métricas y Performance

### Límites Configurados
- **Tamaño máximo PDF**: 100 MB
- **Imágenes**: Todas las páginas se renderizan a PNG (1.5x escala)
- **Tablas**: Solo estructuras válidas (2+ filas, 2+ columnas consistentes)

### Tiempos Aproximados (MVP)
| Operación | Tiempo por página |
|-----------|-------------------|
| Texto | ~50ms |
| Imagen | ~200ms |
| Tablas | ~30ms |

**Ejemplo:** PDF de 100 páginas
- Texto: ~5 segundos
- Imágenes: ~20 segundos  
- Tablas: ~3 segundos
- **Total**: ~28 segundos

### Optimizaciones Futuras
- [ ] Extraer solo imágenes incrustadas (no renderizar página completa)
- [ ] Procesar páginas en paralelo
- [ ] Cache de imágenes ya extraídas
- [ ] Streaming para PDFs grandes

---

## 🐛 Troubleshooting

### Problema: "ImageMagick/GraphicsMagick not found"

**Síntoma:** Error al extraer imágenes
```
Could not execute GraphicsMagick/ImageMagick: gm "convert" ...
this most likely means the gm/convert binaries can't be found
```

**Solución:**
ImageMagick es requerido para la extracción de imágenes.

**Windows:**
1. Descargar de: https://imagemagick.org/script/download.php#windows
2. Instalar con la opción "Add to PATH" seleccionada
3. Reiniciar terminal/IDE

**macOS:**
```bash
brew install imagemagick
```

**Linux:**
```bash
sudo apt-get install imagemagick
```

**Nota:** Si no puedes instalar ImageMagick, el procesamiento de texto y tablas seguirá funcionando. Las imágenes simplemente no se extraerán (graceful degradation).

### Problema: Imágenes no se extraen

**Verificar:**
1. Revisar logs: `[PDF] Extracted image from page X`
2. Verificar directorio: `storage/images/{bookId}/`
3. Revisar permisos de escritura

**Debug:**
```typescript
// Agregar logs detallados en pdf-extraction.ts
console.log('Viewport:', viewport.width, 'x', viewport.height);
console.log('Buffer size:', buffer.length);
```

### Problema: Tablas no detectadas

**Verificar:**
1. El PDF tiene tablas con estructura clara (bordes no necesarios, pero alineación sí)
2. Revisar logs: `[PDF] Total tables detected: X`

**Nota:** La detección es heurística. Tablas complejas o con celdas fusionadas pueden no detectarse.

### Problema: Error "PDF file too large"

**Solución:**
El PDF excede 100MB. Opciones:
1. Dividir el PDF en partes menores
2. Modificar constante `MAX_PDF_SIZE_BYTES` (no recomendado para MVP)

---

## 📁 Estructura de Storage

Después de procesar un PDF:

```
storage/
├── pdfs/
│   └── {bookId}/
│       └── book.pdf              # PDF original
└── images/
    └── {bookId}/
        ├── page-1.png            # Página 1 renderizada
        ├── page-2.png            # Página 2 renderizada
        └── ...
```

---

## 🔗 Referencias

- **Story File**: `.ai/docs/implementation/epic-03-pdf-processing/3-3-image-and-table-extraction.md`
- **Tests**: `tests/unit/pdf-extraction.test.ts`
- **API Route**: `src/app/api/process/[bookId]/route.ts`
- **Database**: `prisma/schema.prisma` (model Image)
- **Librerías**: 
  - [pdf.js](https://mozilla.github.io/pdf.js/)
  - [node-canvas](https://github.com/Automattic/node-canvas)

---

## ✅ Checklist de Verificación

- [ ] Tests unitarios pasan (`npm test -- --run tests/unit/pdf-extraction.test.ts`)
- [ ] PDF de prueba se procesa sin errores
- [ ] Imágenes aparecen en `storage/images/{bookId}/`
- [ ] Registros `Image` creados en base de datos
- [ ] Placeholders `[IMAGE:...]` en `Chapter.content`
- [ ] Placeholders `[TABLE:...]` en `Chapter.content` (si aplica)
- [ ] Progress bar muestra 3 etapas correctamente
- [ ] Libros aparecen en biblioteca cuando status = READY

---

**Última actualización:** 2026-02-06  
**Implementado por:** Amelia (Dev Agent)  
**Story:** 3.3 Image and Table Extraction
