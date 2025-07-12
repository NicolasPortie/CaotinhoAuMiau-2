

// Função para destacar o cartão selecionado e atualizar o campo oculto
function selecionarPerfil(tipo) {
    // Remove seleções anteriores
    document.querySelectorAll(".cartao-opcao").forEach(card => {
        card.classList.remove("selecionado");
    });

    // Destaca o cartão referente ao tipo escolhido
    const cardSelecionado = document.getElementById(`card-${tipo}`);
    if (cardSelecionado) {
        cardSelecionado.classList.add("selecionado");
    }

    // Armazena o tipo escolhido
    const campoTipoPerfil = document.getElementById("tipoPerfil");
    if (campoTipoPerfil) {
        campoTipoPerfil.value = tipo;
    }

    // Libera o botão de continuação
    const botaoContinuar = document.getElementById("btnContinuar");
    if (botaoContinuar) {
        botaoContinuar.disabled = false;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    
    
    const formPerfil = document.getElementById('formPerfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', event => {
            const tipoPerfil = document.getElementById('tipoPerfil').value;
            
            if (!tipoPerfil) {
                event.preventDefault();
                alert('Por favor, selecione um perfil para continuar.');
            } else {
            }
        });
    }
    
    
    document.addEventListener("click", event => {
        const card = event.target.closest(".cartao-opcao");
        if (card) {
            const tipoSelecionado = card.id.replace("card-", "");
            selecionarPerfil(tipoSelecionado);
        }
    });

    const cards = document.querySelectorAll('.cartao-opcao');
    if (cards.length === 1) {
        const unicoTipo = cards[0].id.replace('card-', '');
        selecionarPerfil(unicoTipo);
    }
}); 
