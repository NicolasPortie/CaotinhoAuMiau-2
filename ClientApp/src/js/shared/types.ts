export interface PetDto {
  id: number;
  nome: string;
  especie: string;
  porte: string;
}
export interface FormularioAdocaoDto {
  petId: number;
  nome: string;
  endereco: string;
  telefone: string;
  // demais campos…
}
