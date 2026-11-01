// Define los datos que esperas recibir del backend (ajusta los campos según tu base de datos)
export interface Proveedor {
  id: number;
  nombre: string;
  nit?: string;
  telefono?: string;
}

// Reemplaza esta URL con la ruta real del backend del proyecto Eslabón
const API_URL = 'http://localhost:3000/api'; 

export const obtenerProveedores = async (): Promise<Proveedor[]> => {
  try {
    const respuesta = await fetch(`${API_URL}/proveedores`);
    
    if (!respuesta.ok) {
      throw new Error('Error al conectar con el servidor');
    }
    
    const datos = await respuesta.json();
    return datos;
    
  } catch (error) {
    console.error("Fallo en obtenerProveedores:", error);
    return []; // Retorna un arreglo vacío para no romper la vista en caso de error
  }
};

export const crearProveedor = async (nuevoProveedor: Omit<Proveedor, 'id'>): Promise<Proveedor | null> => {
  try {
    const respuesta = await fetch(`${API_URL}/proveedores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nuevoProveedor),
    });
    
    if (!respuesta.ok) {
      throw new Error('Error al guardar el proveedor');
    }
    
    const datos = await respuesta.json();
    return datos;
  } catch (error) {
    console.error("Fallo en crearProveedor:", error);
    return null;
  }
};

export const eliminarProveedor = async (id: string | number): Promise<boolean> => {
  try {
    const respuesta = await fetch(`${API_URL}/proveedores/${id}`, {
      method: 'DELETE',
    });
    
    if (!respuesta.ok) {
      throw new Error('Error al eliminar el proveedor');
    }
    
    return true; // Retorna verdadero si la base de datos confirmó la eliminación
  } catch (error) {
    console.error("Fallo en eliminarProveedor:", error);
    return false;
  }
};

