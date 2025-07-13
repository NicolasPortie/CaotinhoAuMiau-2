// Conversão parcial para TypeScript. Demais funções precisam de revisão.
document.addEventListener('DOMContentLoaded', () => {
    configurarNavbar();

    if (typeof VMasker === 'undefined') {
        console.error('Vanilla Masker não está carregado! Tentando carregar dinamicamente...');
        const script = document.createElement('script');
        script.src = '/lib/vanilla-masker/vanilla-masker.js';
        script.onload = () => aplicarMascaras();
        document.head.appendChild(script);
    } else {
        aplicarMascaras();
    }

    inicializarPagina();

    const formulario = document.getElementById('formCadastro') as HTMLFormElement | null;
    if (formulario) {
        formulario.addEventListener('submit', async (e: Event) => {
            e.preventDefault();

            const senhaInput = document.getElementById('Senha') as HTMLInputElement;
            const confirmarSenhaInput = document.getElementById('ConfirmarSenha') as HTMLInputElement;
            const senha = senhaInput.value;
            const confirmarSenha = confirmarSenhaInput.value;

            if (!senha || senha.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres.');
                senhaInput.focus();
                return false;
            }

            if (senha !== confirmarSenha) {
                alert('As senhas não conferem.');
                confirmarSenhaInput.focus();
                return false;
            }

            const cpfComMascara = (document.getElementById('cpf') as HTMLInputElement).value;
            const cpfSemMascara = cpfComMascara.replace(/\D/g, '');
            if (cpfSemMascara.length !== 11) {
                alert('O CPF deve ter 11 dígitos.');
                (document.getElementById('cpf') as HTMLInputElement).focus();
                return false;
            }

            const emailInput = document.getElementById('email') as HTMLInputElement;
            const email = emailInput.value;
            if (!verificarEmail(email)) {
                alert('E-mail inválido.');
                emailInput.focus();
                return false;
            }

            try {
                const emailExiste = await verificarEmailDuplicado(email);
                if (emailExiste) {
                    alert('Este e-mail já está cadastrado. Por favor, use outro e-mail.');
                    emailInput.focus();
                    return false;
                }
            } catch (error) {
                console.error('Erro ao verificar email:', error);
            }

            const botaoEnviar = document.getElementById('btnEnviar') as HTMLButtonElement | null;
            if (botaoEnviar) {
                botaoEnviar.disabled = true;
                botaoEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
            }

            setTimeout(() => formulario.submit(), 100);
        });
    } else {
        console.error('Formulário de cadastro não encontrado');
    }
});

function aplicarMascaras(): void {
    const elementoCpf = document.getElementById('cpf') as HTMLInputElement | null;
    if (elementoCpf) {
        VMasker(elementoCpf).maskPattern('999.999.999-99');
    }

    const elementoTelefone = document.getElementById('telefone') as HTMLInputElement | null;
    if (elementoTelefone) {
        const mascaraTelefone = (telefone: HTMLInputElement): void => {
            const valor = telefone.value.replace(/\D/g, '');
            const mascara = valor.length > 10 ? '(99) 99999-9999' : '(99) 9999-9999';
            VMasker(telefone).maskPattern(mascara);
        };

        mascaraTelefone(elementoTelefone);
        elementoTelefone.addEventListener('input', function() {
            mascaraTelefone(this as HTMLInputElement);
        });
    }

    const elementoCep = document.getElementById('cep') as HTMLInputElement | null;
    if (elementoCep) {
        VMasker(elementoCep).maskPattern('99999-999');
    }
}

function inicializarPagina(): void {
    aplicarMascarasInput();
    configurarVerificacoesCampos();

    const cepInput = document.getElementById('cep') as HTMLInputElement | null;
    if (cepInput) {
        cepInput.addEventListener('blur', function() {
            const cepSemMascara = this.value.replace(/\D/g, '');
            if (cepSemMascara.length === 0) return;
            if (cepSemMascara.length !== 8) {
                const feedbackCEP = document.getElementById('cep-feedback');
                if (feedbackCEP) {
                    feedbackCEP.textContent = 'CEP deve ter 8 dígitos';
                    feedbackCEP.className = 'feedback-validacao invalido';
                    (feedbackCEP as HTMLElement).style.display = 'block';
                }
                return;
            }
            buscarCEP(cepSemMascara);
        });
    }

    ajustarLayout();
    window.addEventListener('resize', ajustarLayout);
}

/** TODO: Converter o restante das funções para TypeScript com tipagem estrita */
