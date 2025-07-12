window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});


const alternarVisibilidadeSenha = (inputId) => {
    const senhaInput = document.getElementById(inputId);
    const botao = document.querySelector('.botao-senha');
    const icone = botao.querySelector('i');

    if (senhaInput.type === 'password') {
        senhaInput.type = 'text';
        icone.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        senhaInput.type = 'password';
        icone.classList.replace('fa-eye-slash', 'fa-eye');
    }
};


document.addEventListener('DOMContentLoaded', () => {

    const botaoSenha = document.querySelector('.botao-senha');
    if (botaoSenha) {
        botaoSenha.addEventListener('click', () => {
            alternarVisibilidadeSenha('Senha');
        });
    }


    const alertas = document.querySelectorAll('.alerta');
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
