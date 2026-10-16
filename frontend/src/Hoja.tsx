import type { ReactNode } from 'react';

interface Props {
  etiqueta: string;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}

export default function Hoja({ etiqueta, titulo, onCerrar, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-20 flex items-end bg-stone-900/40 md:items-stretch md:justify-end"
      onClick={onCerrar}
    >
      <div
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-stone-50 shadow-xl md:h-full md:max-h-none md:max-w-md md:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
              {etiqueta}
            </p>
            <h2 className="text-lg font-semibold tracking-tight">{titulo}</h2>
          </div>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 transition hover:bg-stone-100"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}