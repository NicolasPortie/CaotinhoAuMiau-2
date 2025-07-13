// Interface representando um formulário de adoção.
// É um exemplo inspirado na modelagem feita em C#, permitindo tipagem forte.
interface AdocaoViewModel {
    id: number;
    petId: number;
    usuarioId: number;
    status: string;
    dataEnvio: string;
    dataResposta?: string;
    observacaoAdminFormulario?: string;
    observacoesCancelamento?: string;
}

// Código responsável por lidar com a paginação e seleção de itens na listagem de adoções do usuário.
document.addEventListener('DOMContentLoaded', (): void => {
    // Manipulador para o seletor de itens por página
    const seletor = document.getElementById('selectItensPorPagina') as HTMLSelectElement | null;
    if (seletor) {
        const baseUrl: string = seletor.dataset.baseUrl ?? '';

        seletor.addEventListener('change', function (this: HTMLSelectElement): void {
            const itensPorPagina: string = this.value;
            const url: string = `${baseUrl}?pagina=1&itensPorPagina=${encodeURIComponent(itensPorPagina)}`;
            window.location.href = url;
        });
    }

    // Corrigir problema de paginação ao clicar nos links
    document.querySelectorAll<HTMLAnchorElement>('.pagination .page-link').forEach((link) => {
        link.addEventListener('click', (e: MouseEvent): boolean => {
            e.preventDefault();
            const url: string | null = link.getAttribute('href');
            if (url) {
                window.location.href = url;
            }
            return false;
        });
    });

    // Código existente abaixo
});

