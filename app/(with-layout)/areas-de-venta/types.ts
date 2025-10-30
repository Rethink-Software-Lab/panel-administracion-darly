export interface AreaVenta {
  id: number;
  nombre: string;
  color: string;
  cuenta: { id: number; nombre: string } | null;
}
