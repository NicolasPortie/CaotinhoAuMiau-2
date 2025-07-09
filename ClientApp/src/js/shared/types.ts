export interface PetDto {
  id: number;
  nome: string;
  especie: string;
  porte: string;
}

export interface FormularioAdocaoDto {
  petId: number;
  nome: string;
  // outros campos podem ser adicionados conforme necessário
}

export {};
