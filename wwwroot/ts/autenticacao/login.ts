// Arquivo convertido de login.js para TypeScript.
// Interface que representa o modelo de dados utilizado no formulário de login
interface LoginViewModel {
    email: string;
    senha: string;
    continuarConectado: boolean;
}

// Ao rolar a página, adiciona ou remove a classe 'scrolled' na barra de navegação
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar') as HTMLElement | null;
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }
});

// Alterna a visibilidade do campo de senha
const alternarVisibilidadeSenha = (inputId: string): void => {
    const senhaInput = document.getElementById(inputId) as HTMLInputElement | null;
    const botao = document.querySelector('.botao-senha') as HTMLElement | null;
    const icone = botao?.querySelector('i') as HTMLElement | null;

    if (!senhaInput || !icone) return;

    if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        icone.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        senhaInput.type = 'password';
        icone.classList.replace('fa-eye-slash', 'fa-eye');
    }
};

// Configurações executadas quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const botaoSenha = document.querySelector('.botao-senha') as HTMLElement | null;
    if (botaoSenha) {
        botaoSenha.addEventListener('click', () => {
            alternarVisibilidadeSenha('Senha');
        });
    }

    const alertas = document.querySelectorAll<HTMLElement>('.alerta');
    if (alertas.length > 0) {
        setTimeout(() => {
            alertas.forEach(alerta => {
                alerta.style.opacity = '0';
                setTimeout(() => {
                    alerta.style.display = 'none';
                }, 500);
            });
        }, 5000);
    }
});
