import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_BASE_URL || '',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  resp => resp,
  erro => {
    console.error('Erro na API:', erro);
    return Promise.reject(erro);
  }
);

export interface AdocaoDto {
  petId: number;
  usuarioId: number;
  // demais campos...
}

export const servicoAdocao = {
  criar(dados: AdocaoDto) {
    return api.post('/api/adocoes', dados);
  },
  listar(usuarioId: number) {
    return api.get(`/api/usuarios/${usuarioId}/adocoes`);
  }
};

export default api;
