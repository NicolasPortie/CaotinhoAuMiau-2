import api from './servicoAdocao';

export interface PetDto {
  id: number;
  nome: string;
  idade: number;
  // ...
}

export const servicoPet = {
  listarTodos() {
    return api.get<PetDto[]>('/api/pets');
  },
  obterPorId(id: number) {
    return api.get<PetDto>(`/api/pets/${id}`);
  }
};
