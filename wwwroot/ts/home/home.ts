// Arquivo TypeScript convertido de home.js

// Declarar toastr para evitar erros de tipagem
// Caso @types/toastr seja adicionado futuramente, estas declarações podem ser removidas
declare const toastr: any;

interface ToastrOptions {
    closeButton: boolean;
    progressBar: boolean;
    positionClass: string;
    showDuration: string;
    hideDuration: string;
    timeOut: string;
    extendedTimeOut: string;
    showEasing: string;
    hideEasing: string;
    showMethod: string;
    hideMethod: string;
}

type MensagemTipo = 'success' | 'error' | 'warning' | 'info';

const opcoesToastr: ToastrOptions = {
    closeButton: true,
    progressBar: true,
    positionClass: 'toast-bottom-right',
    showDuration: '300',
    hideDuration: '1000',
    timeOut: '5000',
    extendedTimeOut: '1000',
    showEasing: 'swing',
    hideEasing: 'linear',
    showMethod: 'fadeIn',
    hideMethod: 'fadeOut'
};

toastr.options = opcoesToastr;

document.addEventListener('DOMContentLoaded', () => {
    animarAoScrollar();

    document.querySelectorAll<HTMLElement>('.cartao-motivo, .cartao-passo').forEach(cartao => {
        cartao.addEventListener('mouseenter', () => cartao.classList.add('hover'));
        cartao.addEventListener('mouseleave', () => cartao.classList.remove('hover'));
    });

    const formularioNewsletter = document.getElementById('formulario-newsletter');
    if (formularioNewsletter instanceof HTMLFormElement) {
        formularioNewsletter.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            const inputEmail = formularioNewsletter.querySelector<HTMLInputElement>('input[type="email"]');
            const email: string = inputEmail ? inputEmail.value : '';

            if (email && email.indexOf('@') > 0) {
                if (inputEmail) inputEmail.value = '';
                mostrarMensagem('Obrigado por se inscrever!', 'success');
            } else {
                mostrarMensagem('Por favor, insira um email válido.', 'error');
            }
        });
    }
});

function mostrarMensagem(mensagem: string, tipo: MensagemTipo): void {
    if (typeof toastr !== 'undefined') {
        switch (tipo) {
            case 'success':
                toastr.success(mensagem);
                break;
            case 'error':
                toastr.error(mensagem);
                break;
            case 'warning':
                toastr.warning(mensagem);
                break;
            case 'info':
            default:
                toastr.info(mensagem);
                break;
        }
    } else {
        alert(mensagem);
    }
}

function animarAoScrollar(): void {
    const animarElementos = (): void => {
        document.querySelectorAll<HTMLElement>('.cartao-motivo, .cartao-passo, .item-contador').forEach(el => {
            const elementoTopo = el.getBoundingClientRect().top + window.scrollY;
            const scrollPos = window.scrollY;
            const windowHeight = window.innerHeight;

            if (scrollPos + windowHeight > elementoTopo + 100) {
                el.classList.add('animated');
            }
        });
    };

    animarElementos();
    window.addEventListener('scroll', animarElementos);
}

