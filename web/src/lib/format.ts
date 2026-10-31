export const zar = (n: number, decimals = 0) =>
  `R ${n.toLocaleString('en-ZA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`
