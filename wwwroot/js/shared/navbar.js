let menuHamburguer;
let menuLateral;
let menuSobreposicao;
let painelNotificacoes;

const painelAtivo = () =>
    painelNotificacoes &&
    (painelNotificacoes.classList.contains('ativo') ||
     painelNotificacoes.style.display === 'block');

document.addEventListener('DOMContentLoaded', () => {

    menuHamburguer = document.querySelector('.menu-hamburguer');
    menuLateral = document.querySelector('.menu-lateral');
    menuSobreposicao = document.querySelector('.menu-sobreposicao');
    painelNotificacoes = document.getElementById('painel-notificacoes');

    const iconeNotificacao = document.querySelector('.icone-notificacao');
    const sinoSvg = document.querySelector('.sino-svg');
    const contadorNotificacoes = document.querySelector('.contador-notificacoes');
    
    if (sinoSvg && contadorNotificacoes) {
        sinoSvg.classList.add('animacao-sino');
    }
    
    if (menuHamburguer && menuLateral && menuSobreposicao) {
        menuLateral.classList.remove('ativo');
        menuSobreposicao.classList.remove('ativo');
        
        menuHamburguer.addEventListener('click', (e) => {
            e.preventDefault();
            alternarMenu();
        });
        
        menuSobreposicao.addEventListener('click', () => {
            alternarMenu();
        });
        
        document.addEventListener('keydown', (evento) => {
            if (evento.key === 'Escape' && menuLateral.classList.contains('ativo')) {
                alternarMenu();
            }
        });
    }
    
    if (iconeNotificacao) {
        
        const clone = iconeNotificacao.cloneNode(true);
        if (iconeNotificacao.parentNode) {
            iconeNotificacao.parentNode.replaceChild(clone, iconeNotificacao);
        }
        
        clone.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const sino = this.querySelector('.sino-svg');
            if (sino) {
                sino.classList.add('animacao-sino');
                
                setTimeout(() => {
                    sino.classList.remove('animacao-sino');
                }, 1500);
            }
            
            alternarNotificacoes();
        });
    }
    
    const overlayNotificacoes = document.querySelector('.overlay-notificacoes');
    if (overlayNotificacoes) {
        overlayNotificacoes.addEventListener('click', () => {
            fecharPainelNotificacoes();
        });
    }
    
    const btnFecharPainel = document.querySelector('.fechar-painel');
    if (btnFecharPainel) {
        btnFecharPainel.addEventListener('click', (e) => {
            e.preventDefault();
            fecharPainelNotificacoes();
        });
    }
    
    const btnFecharNotificacoes = document.getElementById('fechar-notificacoes');
    if (btnFecharNotificacoes) {
        btnFecharNotificacoes.addEventListener('click', (e) => {
            e.preventDefault();
            fecharPainelNotificacoes();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && painelAtivo()) {
            fecharPainelNotificacoes();
        }
    });

    document.addEventListener('click', (e) => {
        const iconeNotif = document.querySelector('.icone-notificacao');

        if (painelAtivo() &&
            !painelNotificacoes.contains(e.target) &&
            (!iconeNotif || !iconeNotif.contains(e.target))) {
            fecharPainelNotificacoes();
        }
    });
});


const alternarMenu = () => {
    
    if (!menuLateral || !menuSobreposicao || !menuHamburguer) {
        console.error("Elementos do menu não encontrados");
        return;
    }
    
    menuHamburguer.classList.toggle('ativo');
    menuLateral.classList.toggle('ativo');
    menuSobreposicao.classList.toggle('ativo');
    
    if (menuLateral.classList.contains('ativo')) {
        const larguraBarraRolagem = window.innerWidth - document.documentElement.clientWidth;
        
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


const abrirPainelNotificacoes = () => {
    if (!painelNotificacoes) {
        console.error("[NAVBAR.JS] Painel de notificações não encontrado");
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


const fecharPainelNotificacoes = () => {
    if (!painelNotificacoes) {
        return;
    }
    
    
    painelNotificacoes.style.display = 'none';
    painelNotificacoes.style.visibility = 'hidden';
    painelNotificacoes.style.opacity = '0';
    painelNotificacoes.classList.remove('ativo');
};


const abrirMenuLateral = () => {

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


const fecharMenuLateral = () => {

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


const alternarNotificacoes = () => {
    if (!painelNotificacoes) {
        console.error("[NAVBAR.JS] Painel de notificações não encontrado");
        return;
    }
    
    
    if (painelAtivo()) {
        fecharPainelNotificacoes();
    } else {
        abrirPainelNotificacoes();
    }
};

window.alternarMenu = alternarMenu;
window.abrirMenuLateral = abrirMenuLateral;
window.fecharMenuLateral = fecharMenuLateral;
window.abrirPainelNotificacoes = abrirPainelNotificacoes;
window.fecharPainelNotificacoes = fecharPainelNotificacoes;
window.alternarNotificacoes = alternarNotificacoes; 
