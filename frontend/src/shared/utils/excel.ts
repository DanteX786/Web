/**
 * Genera archivos de Excel (.xlsx) directamente en el navegador, sin librerías externas.
 *
 * Un .xlsx es un ZIP con varios XML adentro. Aquí se arman esos XML (una sola hoja con
 * título, encabezado dorado, filtros, encabezado fijo y formatos de pesos / número / fecha)
 * y se empaquetan en un ZIP sin compresión.
 *
 * Uso:
 *   exportarExcel({
 *     archivo: 'remisiones', hoja: 'Remisiones', titulo: 'Remisiones',
 *     filas: remisionesFiltradas,
 *     columnas: [
 *       { titulo: 'ID', valor: r => r.id_remision },
 *       { titulo: 'Costo total', valor: r => r.costo_total, tipo: 'pesos' },
 *     ],
 *   });
 */

export type TipoColumna = 'texto' | 'numero' | 'pesos' | 'fecha';

export interface ColumnaExcel<T> {
  titulo: string;
  valor: (fila: T) => string | number | null | undefined;
  tipo?: TipoColumna;
  /** Ancho en caracteres. Si no se indica, se calcula con el contenido. */
  ancho?: number;
}

export interface OpcionesExcel<T> {
  /** Nombre del archivo sin extensión. Se le agrega la fecha de hoy. */
  archivo: string;
  /** Nombre de la pestaña (máx. 31 caracteres). */
  hoja: string;
  /** Título que va en la primera fila. */
  titulo: string;
  /** Texto opcional debajo del título (ej. el filtro de búsqueda aplicado). */
  subtitulo?: string;
  filas: T[];
  columnas: ColumnaExcel<T>[];
}

// Estilos definidos en styles.xml (el índice es el atributo s="" de cada celda)
const ESTILO = { normal: 0, titulo: 1, subtitulo: 2, encabezado: 3, texto: 4, numero: 5, pesos: 6, fecha: 7 } as const;
const ESTILO_POR_TIPO: Record<TipoColumna, number> = {
  texto: ESTILO.texto, numero: ESTILO.numero, pesos: ESTILO.pesos, fecha: ESTILO.fecha,
};

const FILA_ENCABEZADO = 4; // 1: título · 2: subtítulo · 3: vacía · 4: encabezado

// ---------- utilidades XML ----------
const escaparXml = (texto: string) =>
  texto
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 0 -> A, 25 -> Z, 26 -> AA */
const letraColumna = (indice: number): string => {
  let n = indice + 1;
  let letras = '';
  while (n > 0) {
    const resto = (n - 1) % 26;
    letras = String.fromCharCode(65 + resto) + letras;
    n = Math.floor((n - 1) / 26);
  }
  return letras;
};

/** "2026-11-25" -> número de serie de Excel (días desde 30/12/1899). null si no es una fecha válida. */
const fechaASerie = (valor: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - Date.UTC(1899, 11, 30);
  return Number.isNaN(ms) ? null : ms / 86_400_000;
};

const celdaTexto = (ref: string, texto: string, estilo: number) =>
  `<c r="${ref}" t="inlineStr" s="${estilo}"><is><t xml:space="preserve">${escaparXml(texto)}</t></is></c>`;

const celdaNumero = (ref: string, numero: number, estilo: number) =>
  `<c r="${ref}" s="${estilo}"><v>${numero}</v></c>`;

const celda = (ref: string, valor: string | number | null | undefined, tipo: TipoColumna): string => {
  if (valor === null || valor === undefined || valor === '') return '';
  const estilo = ESTILO_POR_TIPO[tipo];
  if (tipo === 'fecha') {
    const serie = typeof valor === 'string' ? fechaASerie(valor) : null;
    return serie === null ? celdaTexto(ref, String(valor), ESTILO.texto) : celdaNumero(ref, serie, estilo);
  }
  if (tipo === 'numero' || tipo === 'pesos') {
    const numero = typeof valor === 'number' ? valor : Number(valor);
    return Number.isFinite(numero) ? celdaNumero(ref, numero, estilo) : celdaTexto(ref, String(valor), ESTILO.texto);
  }
  return celdaTexto(ref, String(valor), estilo);
};

// ---------- partes del archivo ----------
const hojaXml = <T,>(op: OpcionesExcel<T>): string => {
  const { columnas, filas } = op;
  const ultimaCol = letraColumna(Math.max(columnas.length - 1, 0));
  const ultimaFila = FILA_ENCABEZADO + filas.length;

  // Ancho de cada columna según lo más largo que tenga (con un mínimo y un máximo)
  const anchos = columnas.map((col) => {
    if (col.ancho) return col.ancho;
    const largos = filas.slice(0, 500).map((f) => {
      const v = col.valor(f);
      if (v === null || v === undefined) return 0;
      if (col.tipo === 'pesos' && typeof v === 'number') return `$${Math.round(v).toLocaleString('es-CO')}`.length;
      if (col.tipo === 'fecha') return 10;
      return String(v).length;
    });
    return Math.min(Math.max(col.titulo.length + 4, ...largos, 8) + 2, 60);
  });

  const filasXml: string[] = [];
  filasXml.push(`<row r="1" ht="24" customHeight="1">${celdaTexto('A1', op.titulo, ESTILO.titulo)}</row>`);
  filasXml.push(`<row r="2">${celdaTexto('A2', op.subtitulo ?? '', ESTILO.subtitulo)}</row>`);
  filasXml.push(
    `<row r="${FILA_ENCABEZADO}" ht="20" customHeight="1">${columnas
      .map((c, i) => celdaTexto(`${letraColumna(i)}${FILA_ENCABEZADO}`, c.titulo, ESTILO.encabezado))
      .join('')}</row>`,
  );
  filas.forEach((fila, idx) => {
    const r = FILA_ENCABEZADO + 1 + idx;
    filasXml.push(
      `<row r="${r}">${columnas.map((c, i) => celda(`${letraColumna(i)}${r}`, c.valor(fila), c.tipo ?? 'texto')).join('')}</row>`,
    );
  });

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetPr><pageSetUpPr fitToPage="1"/></sheetPr>
<dimension ref="A1:${ultimaCol}${ultimaFila}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="${FILA_ENCABEZADO}" topLeftCell="A${FILA_ENCABEZADO + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="15"/>
<cols>${anchos.map((a, i) => `<col min="${i + 1}" max="${i + 1}" width="${a}" customWidth="1"/>`).join('')}</cols>
<sheetData>${filasXml.join('')}</sheetData>
${filas.length > 0 ? `<autoFilter ref="A${FILA_ENCABEZADO}:${ultimaCol}${ultimaFila}"/>` : ''}
<pageMargins left="0.4" right="0.4" top="0.5" bottom="0.5" header="0.3" footer="0.3"/>
<pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
};

const ESTILOS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="&quot;$&quot;#,##0"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="4">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><color rgb="FF121212"/><name val="Calibri"/></font>
<font><i/><sz val="10"/><color rgb="FF6B6B6B"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF121212"/><name val="Calibri"/></font>
</fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFC9A227"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD9D9D9"/></left><right style="thin"><color rgb="FFD9D9D9"/></right><top style="thin"><color rgb="FFD9D9D9"/></top><bottom style="thin"><color rgb="FFD9D9D9"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="8">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const nombreHojaValido = (nombre: string) => nombre.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31) || 'Hoja1';

const archivosXlsx = <T,>(op: OpcionesExcel<T>): Array<[string, string]> => [
  ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`],
  ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`],
  ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escaparXml(nombreHojaValido(op.hoja))}" sheetId="1" r:id="rId1"/></sheets>
${op.filas.length > 0 ? `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${escaparXml(nombreHojaValido(op.hoja)).replace(/'/g, "''")}'!$A$${FILA_ENCABEZADO}:$${letraColumna(op.columnas.length - 1)}$${FILA_ENCABEZADO + op.filas.length}</definedName></definedNames>` : ''}
</workbook>`],
  ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`],
  ['xl/styles.xml', ESTILOS_XML],
  ['xl/worksheets/sheet1.xml', hojaXml(op)],
];

// ---------- ZIP sin compresión ----------
const TABLA_CRC = (() => {
  const tabla = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c >>> 0;
  }
  return tabla;
})();

const crc32 = (datos: Uint8Array) => {
  let c = 0xffffffff;
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const crearZip = (archivos: Array<[string, string]>): Uint8Array => {
  const codificador = new TextEncoder();
  const ahora = new Date();
  const hora = (ahora.getHours() << 11) | (ahora.getMinutes() << 5) | Math.floor(ahora.getSeconds() / 2);
  const fecha = ((ahora.getFullYear() - 1980) << 9) | ((ahora.getMonth() + 1) << 5) | ahora.getDate();

  const partes: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let desplazamiento = 0;

  for (const [nombre, contenido] of archivos) {
    const nombreBytes = codificador.encode(nombre);
    const datos = codificador.encode(contenido);
    const crc = crc32(datos);

    const local = new Uint8Array(30 + nombreBytes.length);
    const vl = new DataView(local.buffer);
    vl.setUint32(0, 0x04034b50, true);
    vl.setUint16(4, 20, true);
    vl.setUint16(6, 0x0800, true); // nombres en UTF-8
    vl.setUint16(8, 0, true);      // sin compresión
    vl.setUint16(10, hora, true);
    vl.setUint16(12, fecha, true);
    vl.setUint32(14, crc, true);
    vl.setUint32(18, datos.length, true);
    vl.setUint32(22, datos.length, true);
    vl.setUint16(26, nombreBytes.length, true);
    local.set(nombreBytes, 30);
    partes.push(local, datos);

    const cab = new Uint8Array(46 + nombreBytes.length);
    const vc = new DataView(cab.buffer);
    vc.setUint32(0, 0x02014b50, true);
    vc.setUint16(4, 20, true);
    vc.setUint16(6, 20, true);
    vc.setUint16(8, 0x0800, true);
    vc.setUint16(10, 0, true);
    vc.setUint16(12, hora, true);
    vc.setUint16(14, fecha, true);
    vc.setUint32(16, crc, true);
    vc.setUint32(20, datos.length, true);
    vc.setUint32(24, datos.length, true);
    vc.setUint16(28, nombreBytes.length, true);
    vc.setUint32(42, desplazamiento, true);
    cab.set(nombreBytes, 46);
    central.push(cab);

    desplazamiento += local.length + datos.length;
  }

  const tamCentral = central.reduce((s, c) => s + c.length, 0);
  const fin = new Uint8Array(22);
  const vf = new DataView(fin.buffer);
  vf.setUint32(0, 0x06054b50, true);
  vf.setUint16(8, archivos.length, true);
  vf.setUint16(10, archivos.length, true);
  vf.setUint32(12, tamCentral, true);
  vf.setUint32(16, desplazamiento, true);

  const total = new Uint8Array(desplazamiento + tamCentral + fin.length);
  let pos = 0;
  for (const p of [...partes, ...central, fin]) { total.set(p, pos); pos += p.length; }
  return total;
};

/** Arma el .xlsx en memoria (sirve también para probarlo). */
export const generarXlsx = <T,>(op: OpcionesExcel<T>): Uint8Array => crearZip(archivosXlsx(op));

/** Genera el Excel y lo descarga como "<archivo>_AAAA-MM-DD.xlsx". */
export const exportarExcel = <T,>(op: OpcionesExcel<T>): void => {
  const bytes = generarXlsx(op);
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const hoy = new Date();
  const sello = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `${op.archivo}_${sello}.xlsx`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Texto de la fila 2: cuándo se exportó y con qué búsqueda. */
export const subtituloExportacion = (busqueda: string, cantidad: number) =>
  `Generado el ${new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' })} · ` +
  `${cantidad} registro${cantidad === 1 ? '' : 's'}` +
  (busqueda.trim() ? ` · Búsqueda: "${busqueda.trim()}"` : '');
