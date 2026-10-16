export const decimalTransformer = {
    to: (valor?: number | null) => valor,
    from: (valor?: string | null) =>
      valor === null || valor === undefined ? null : parseFloat(valor),
  };