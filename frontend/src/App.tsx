import { Navigate, Route, Routes } from 'react-router-dom';
import { obtenerSesion } from './api';
import { rutaInicial } from './menu';
//import AdminCategorias from './paginas/AdminCategorias';
import AdminMesas from './paginas/AdminMesas';
import AdminPlatos from './paginas/AdminPlatos';
import AdminReportes from './paginas/AdminReportes';
import AdminUsuarios from './paginas/AdminUsuarios';
import Caja from './paginas/Caja';
import Cocina from './paginas/Cocina';
import Login from './paginas/Login';
import Mozo from './paginas/Mozo';
import RutaProtegida from './RutaProtegida';

// "/" y cualquier dirección desconocida: a tu pantalla si hay sesión, si no al login
function Inicio() {
  const sesion = obtenerSesion();
  const destino = sesion ? rutaInicial(sesion.usuario.permisos) : null;
  return <Navigate to={destino ?? '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/mozo"
        element={
          <RutaProtegida permiso="pedidos.crear">
            <Mozo />
          </RutaProtegida>
        }
      />
      <Route
        path="/cocina"
        element={
          <RutaProtegida permiso="cocina.ver">
            <Cocina />
          </RutaProtegida>
        }
      />
      <Route
        path="/caja"
        element={
          <RutaProtegida permiso="pedidos.cobrar">
            <Caja />
          </RutaProtegida>
        }
      />
      <Route path="/admin" element={<Inicio />} />
      <Route
        path="/admin/mesas"
        element={
          <RutaProtegida permiso="mesas.gestionar">
            <AdminMesas />
          </RutaProtegida>
        }
      />
      <Route
        path="/admin/platos"
        element={
          <RutaProtegida permiso="menu.editar">
            <AdminPlatos />
          </RutaProtegida>
        }
      />
      <Route
        path="/admin/categorias"
        element={
          <RutaProtegida permiso="menu.editar">
            <AdminUsuarios />
          </RutaProtegida>
        }
      />
      <Route
        path="/admin/usuarios"
        element={
          <RutaProtegida permiso="usuarios.gestionar">
            <AdminUsuarios />
          </RutaProtegida>
        }
      />
      <Route
        path="/admin/reportes"
        element={
          <RutaProtegida permiso="reportes.ver">
            <AdminReportes />
          </RutaProtegida>
        }
      />
      <Route path="*" element={<Inicio />} />
    </Routes>
  );
}