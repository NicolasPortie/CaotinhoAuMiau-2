// Função para destacar o cartão selecionado e atualizar o campo oculto
function selecionarPerfil(tipo: string): void {
    // Remove seleções anteriores
    document.querySelectorAll('.cartao-opcao').forEach(card => {
        card.classList.remove('selecionado');
    });

    // Destaca o cartão referente ao tipo escolhido
    const cardSelecionado = document.getElementById(`card-${tipo}`);
    if (cardSelecionado) {
        cardSelecionado.classList.add('selecionado');
    }

    // Armazena o tipo escolhido
    const campoTipoPerfil = document.getElementById('tipoPerfil');
    if (campoTipoPerfil instanceof HTMLInputElement) {
        campoTipoPerfil.value = tipo;
    }

    // Libera o botão de continuação
    const botaoContinuar = document.getElementById('btnContinuar');
    if (botaoContinuar instanceof HTMLButtonElement) {
        botaoContinuar.disabled = false;
    }
}

// Configuração dos eventos de escolha do perfil
document.addEventListener('DOMContentLoaded', () => {
    const formPerfil = document.getElementById('formPerfil');
    if (formPerfil instanceof HTMLFormElement) {
        formPerfil.addEventListener('submit', event => {
            const tipoPerfilEl = document.getElementById('tipoPerfil');
            const tipoPerfil = tipoPerfilEl instanceof HTMLInputElement ? tipoPerfilEl.value : '';

            if (!tipoPerfil) {
                event.preventDefault();
                alert('Por favor, selecione um perfil para continuar.');
            }
        });
    }

    document.addEventListener('click', event => {
        const target = event.target as Element | null;
        const card = target?.closest('.cartao-opcao');
        if (card) {
            const tipoSelecionado = card.id.replace('card-', '');
            selecionarPerfil(tipoSelecionado);
        }
    });

    const cards = document.querySelectorAll('.cartao-opcao');
    if (cards.length === 1) {
        const unicoTipo = (cards[0] as HTMLElement).id.replace('card-', '');
        selecionarPerfil(unicoTipo);
    }
});

// Script movido de EscolherPerfil.cshtml para centralizar o JavaScript

document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('overlay-active');

    const cards = document.querySelectorAll('.profile-card');
    cards.forEach(card => {
        const cardElement = card as HTMLElement;
        cardElement.addEventListener('click', () => {
            const destino = cardElement.getAttribute('data-action');
            if (destino) {
                handleProfileSelection(cardElement, destino);
            }
        });

        cardElement.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                cardElement.click();
            }
        });
    });

    window.addEventListener('beforeunload', () => {
        document.body.classList.remove('overlay-active');
    });
});

function handleProfileSelection(element: HTMLElement, url: string): void {
    element.style.pointerEvents = 'none';
    element.style.opacity = '0.7';
    setTimeout(() => {
        window.location.href = url;
    }, 180);
}
