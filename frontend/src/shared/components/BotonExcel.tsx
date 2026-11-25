import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';

const VERDE_EXCEL = '#1D6F42';

/**
 * Botón "Descargar Excel" de los encabezados de los módulos.
 * Exporta lo que se ve en la tabla (con la búsqueda aplicada, todas las páginas).
 */
export const BotonExcel: React.FC<{
  onClick: () => void;
  cantidad: number;
  dark?: boolean;
}> = ({ onClick, cantidad, dark = false }) => {
  const [hover, setHover] = useState(false);
  const vacio = cantidad === 0;
  const color = dark ? '#3FB27F' : VERDE_EXCEL;
  return (
    <button
      onClick={onClick}
      disabled={vacio}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={vacio ? 'No hay registros para exportar' : `Descargar ${cantidad} registro${cantidad === 1 ? '' : 's'} en Excel (con la búsqueda aplicada)`}
      style={{
        background: hover && !vacio ? `${color}18` : 'transparent', color, border: `1.5px solid ${color}`,
        fontWeight: 700, fontSize: 14, borderRadius: 10, padding: '7px 14px',
        cursor: vacio ? 'not-allowed' : 'pointer', opacity: vacio ? 0.5 : 1,
        display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Montserrat, sans-serif', transition: 'background 0.2s',
      }}
    >
      <FileSpreadsheet size={16} /> Descargar Excel
    </button>
  );
};
