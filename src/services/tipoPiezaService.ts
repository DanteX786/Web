const API_URL = "http://localhost:3000/api";

let tiposPiezasLocales = [
  { id: "TPZ-001", nombre: "Delantera", desc: "Pieza frontal de la prenda" },
  { id: "TPZ-002", nombre: "Espalda", desc: "Pieza posterior de la prenda" },
  { id: "TPZ-003", nombre: "Manga", desc: "Sección de manga larga o corta" },
];

export const obtenerTiposPiezas = async () => {
  try {
    const response = await fetch(`${API_URL}/tipos-piezas`);
    if (!response.ok) throw new Error("Backend no disponible");
    return await response.json();
  } catch (error) {
    return tiposPiezasLocales;
  }
};

export const crearTipoPieza = async (nuevoTipo: any) => {
  try {
    const response = await fetch(`${API_URL}/tipos-piezas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoTipo),
    });
    if (!response.ok) throw new Error("Error en servidor");
    return await response.json();
  } catch (error) {
    const nextId = `TPZ-00${tiposPiezasLocales.length + 1}`;
    const creado = { ...nuevoTipo, id: nextId };
    tiposPiezasLocales.push(creado);
    return creado;
  }
};

export const actualizarTipoPieza = async (id: string | number, tipoActualizado: any) => {
  try {
    const response = await fetch(`${API_URL}/tipos-piezas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tipoActualizado),
    });
    if (!response.ok) throw new Error("Error en servidor");
    return await response.json();
  } catch (error) {
    tiposPiezasLocales = tiposPiezasLocales.map(t => t.id === id ? { ...t, ...tipoActualizado } : t);
    return { id, ...tipoActualizado };
  }
};

export const eliminarTipoPieza = async (id: string | number) => {
  try {
    const response = await fetch(`${API_URL}/tipos-piezas/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error("Error en servidor");
    return true;
  } catch (error) {
    tiposPiezasLocales = tiposPiezasLocales.filter(t => t.id !== id);
    return true;
  }
};
