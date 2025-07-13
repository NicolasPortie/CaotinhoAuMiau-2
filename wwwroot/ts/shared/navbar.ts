// Declaração para função de carregamento de notificações vinda de outro script
declare function carregarNotificacoes(): void;

// Extensão da interface Window para expor funções globais
declare global {
    interface Window {
        alternarMenu: () => void;
        abrirMenuLateral: () => void;
        fecharMenuLateral: () => void;
        abrirPainelNotificacoes: () => void;
        fecharPainelNotificacoes: () => void;
        alternarNotificacoes: () => void;
    }
}

let menuHamburguer: HTMLElement | null;
let menuLateral: HTMLElement | null;
let menuSobreposicao: HTMLElement | null;
let painelNotificacoes: HTMLElement | null;

const painelAtivo = (): boolean =>
    !!painelNotificacoes &&
    (painelNotificacoes.classList.contains('ativo') ||
     painelNotificacoes.style.display === 'block');

// Configuração dos eventos após o carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
    menuHamburguer = document.querySelector<HTMLElement>('.menu-hamburguer');
    menuLateral = document.querySelector<HTMLElement>('.menu-lateral');
    menuSobreposicao = document.querySelector<HTMLElement>('.menu-sobreposicao');
    painelNotificacoes = document.getElementById('painel-notificacoes');

    const iconeNotificacao = document.querySelector<HTMLElement>('.icone-notificacao');
    const sinoSvg = document.querySelector<HTMLElement>('.sino-svg');
    const contadorNotificacoes = document.querySelector<HTMLElement>('.contador-notificacoes');

    if (sinoSvg && contadorNotificacoes) {
        sinoSvg.classList.add('animacao-sino');
    }

    if (menuHamburguer && menuLateral && menuSobreposicao) {
        menuLateral.classList.remove('ativo');
        menuSobreposicao.classList.remove('ativo');

        menuHamburguer.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            alternarMenu();
        });

        menuSobreposicao.addEventListener('click', () => {
            alternarMenu();
        });

        document.addEventListener('keydown', (evento: KeyboardEvent) => {
            if (evento.key === 'Escape' && menuLateral!.classList.contains('ativo')) {
                alternarMenu();
            }
        });
    }

    if (iconeNotificacao) {
        const clone = iconeNotificacao.cloneNode(true) as HTMLElement;
        if (iconeNotificacao.parentNode) {
            iconeNotificacao.parentNode.replaceChild(clone, iconeNotificacao);
        }

        clone.addEventListener('click', function(this: HTMLElement, e: MouseEvent) {
            e.preventDefault();
            e.stopPropagation();

            const sino = this.querySelector<HTMLElement>('.sino-svg');
            if (sino) {
                sino.classList.add('animacao-sino');

                setTimeout(() => {
                    sino.classList.remove('animacao-sino');
                }, 1500);
            }

            alternarNotificacoes();
        });
    }

    const overlayNotificacoes = document.querySelector<HTMLElement>('.overlay-notificacoes');
    if (overlayNotificacoes) {
        overlayNotificacoes.addEventListener('click', () => {
            fecharPainelNotificacoes();
        });
    }

    const btnFecharPainel = document.querySelector<HTMLElement>('.fechar-painel');
    if (btnFecharPainel) {
        btnFecharPainel.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            fecharPainelNotificacoes();
        });
    }

    const btnFecharNotificacoes = document.getElementById('fechar-notificacoes');
    if (btnFecharNotificacoes) {
        btnFecharNotificacoes.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            fecharPainelNotificacoes();
        });
    }

    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape' && painelAtivo()) {
            fecharPainelNotificacoes();
        }
    });

    document.addEventListener('click', (e: MouseEvent) => {
        const iconeNotif = document.querySelector<HTMLElement>('.icone-notificacao');

        if (painelAtivo() &&
            painelNotificacoes &&
            !painelNotificacoes.contains(e.target as Node) &&
            (!iconeNotif || !iconeNotif.contains(e.target as Node))) {
            fecharPainelNotificacoes();
        }
    });
});

const alternarMenu = (): void => {
    if (!menuLateral || !menuSobreposicao || !menuHamburguer) {
        console.error('Elementos do menu não encontrados');
        return;
    }

    menuHamburguer.classList.toggle('ativo');
    menuLateral.classList.toggle('ativo');
    menuSobreposicao.classList.toggle('ativo');

    if (menuLateral.classList.contains('ativo')) {
        const larguraBarraRolagem: number = window.innerWidth - document.documentElement.clientWidth;

        if (larguraBarraRolagem > 0) {
            document.body.style.paddingRight = larguraBarraRolagem + 'px';
        }

        document.body.classList.add('menu-aberto');
    } else {
        setTimeout(() => {
            document.body.style.paddingRight = '';
            document.body.classList.remove('menu-aberto');
        }, 300);
    }
};

const abrirPainelNotificacoes = (): void => {
    if (!painelNotificacoes) {
        console.error('[NAVBAR.JS] Painel de notificações não encontrado');
        return;
    }

    painelNotificacoes.style.display = 'block';
    painelNotificacoes.style.visibility = 'visible';
    painelNotificacoes.style.opacity = '1';
    painelNotificacoes.classList.add('ativo');

    fecharMenuLateral();

    if (typeof carregarNotificacoes === 'function') {
        carregarNotificacoes();
    }
};

const fecharPainelNotificacoes = (): void => {
    if (!painelNotificacoes) {
        return;
    }

    painelNotificacoes.style.display = 'none';
    painelNotificacoes.style.visibility = 'hidden';
    painelNotificacoes.style.opacity = '0';
    painelNotificacoes.classList.remove('ativo');
};

const abrirMenuLateral = (): void => {
    if (menuHamburguer && menuLateral && menuSobreposicao) {
        menuHamburguer.classList.add('ativo');
        menuLateral.classList.add('ativo');
        menuSobreposicao.classList.add('ativo');
        document.body.classList.add('menu-aberto');

        if (painelAtivo()) {
            fecharPainelNotificacoes();
        }
    }
};

const fecharMenuLateral = (): void => {
    if (menuHamburguer && menuLateral && menuSobreposicao) {
        menuHamburguer.classList.remove('ativo');
        menuLateral.classList.remove('ativo');
        menuSobreposicao.classList.remove('ativo');

        setTimeout(() => {
            document.body.style.paddingRight = '';
            document.body.classList.remove('menu-aberto');
        }, 300);
    }
};

const alternarNotificacoes = (): void => {
    if (!painelNotificacoes) {
        console.error('[NAVBAR.JS] Painel de notificações não encontrado');
        return;
    }

    if (painelAtivo()) {
        fecharPainelNotificacoes();
    } else {
        abrirPainelNotificacoes();
    }
};

// Exposição das funções no objeto global window
window.alternarMenu = alternarMenu;
window.abrirMenuLateral = abrirMenuLateral;
window.fecharMenuLateral = fecharMenuLateral;
window.abrirPainelNotificacoes = abrirPainelNotificacoes;
window.fecharPainelNotificacoes = fecharPainelNotificacoes;
window.alternarNotificacoes = alternarNotificacoes;

export {};
