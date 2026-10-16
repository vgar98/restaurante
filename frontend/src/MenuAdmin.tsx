import { NavLink } from 'react-router-dom';

const enlaces = [
  { a: '/admin/mesas', texto: 'Mesas' },
  { a: '/admin/platos', texto: 'Platos' },
  { a: '/admin/usuarios', texto: 'Usuarios' },
  { a: '/admin/reportes', texto: 'Reportes' },
];

export default function MenuAdmin() {
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto">
      {enlaces.map((e) => (
        <NavLink
          key={e.a}
          to={e.a}
          className={({ isActive }) =>
            `flex h-11 shrink-0 items-center rounded-full border px-5 text-sm font-medium transition ${
              isActive
                ? 'border-stone-900 bg-stone-900 text-white'
                : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'
            }`
          }
        >
          {e.texto}
        </NavLink>
      ))}
    </nav>
  );
}