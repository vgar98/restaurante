export interface Opcion {
    a: string;
    texto: string;
    permiso: string;
  }
  
  export interface Grupo {
    titulo: string;
    opciones: Opcion[];
  }
  
  export const grupos: Grupo[] = [
    {
      titulo: 'Operación',
      opciones: [
        { a: '/mozo', texto: 'Mesas y comandas', permiso: 'pedidos.crear' },
        { a: '/cocina', texto: 'Cocina', permiso: 'cocina.ver' },
        { a: '/caja', texto: 'Caja', permiso: 'pedidos.cobrar' },
      ],
    },
    {
      titulo: 'Administración',
      opciones: [
        { a: '/admin/mesas', texto: 'Mesas', permiso: 'mesas.gestionar' },
        { a: '/admin/platos', texto: 'Platos', permiso: 'menu.editar' },
        { a: '/admin/categorias', texto: 'Categorías', permiso: 'menu.editar' },
        { a: '/admin/usuarios', texto: 'Usuarios', permiso: 'usuarios.gestionar' },
        { a: '/admin/reportes', texto: 'Reportes', permiso: 'reportes.ver' },
      ],
    },
  ];
  
  // Pantalla a la que se llega al entrar. Se revisa Administración primero,
  // para que el admin entre a su panel y no a la pantalla del mozo.
  // Devuelve null si el usuario no tiene ninguna pantalla asignada.
  export function rutaInicial(permisos: string[]): string | null {
    for (const grupo of [...grupos].reverse()) {
      const opcion = grupo.opciones.find((o) => permisos.includes(o.permiso));
      if (opcion) return opcion.a;
    }
    return null;
  }