// Novo arquivo TypeScript convertido de gerenciamento-colaboradores.js
// Interfaces para respostas da API e modelos de dados

interface ServerResponse<T> {
    sucesso: boolean;
    mensagem?: string;
    dados?: T;
    erros?: Record<string, string>;
}

interface CargoViewModel {
    id: number;
    nome: string;
}

interface ColaboradorViewModel {
    id: number;
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    cargo: string;
    ativo: boolean;
    imagemUrl?: string;
}

// Funções utilitárias

document.addEventListener('DOMContentLoaded', () => {
    configurarLimpezaErrosFormulario();
    configurarToastr();
    inicializarBootstrap();
    inicializarModalColaborador();

    if (typeof VMasker !== 'undefined') {
        document.querySelectorAll<HTMLInputElement>('.mascara-cpf')
            .forEach(el => VMasker(el).maskPattern('999.999.999-99'));
        document.querySelectorAll<HTMLInputElement>('.mascara-telefone')
            .forEach(el => VMasker(el).maskPattern('(99) 99999-9999'));
    }

    preencherDropdownCargos();

    const btnNovoColaborador = document.getElementById('btnNovoColaborador') as HTMLButtonElement | null;
    if (btnNovoColaborador) {
        btnNovoColaborador.addEventListener('click', () => abrirModalColaborador('criar'));
    }

    const btnFiltrar = document.getElementById('btnFiltrarColaboradores') as HTMLButtonElement | null;
    if (btnFiltrar) btnFiltrar.addEventListener('click', filtrarColaboradores);
    const btnLimpar = document.getElementById('btnLimparFiltros') as HTMLButtonElement | null;
    if (btnLimpar) btnLimpar.addEventListener('click', limparFiltros);

    const formColaborador = document.getElementById('formularioColaborador') as HTMLFormElement | null;
    if (formColaborador) {
        formColaborador.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            if (validarFormularioColaborador()) {
                enviarFormularioColaborador();
            }
        });
    }

    const botaoConfirmarDesativar = document.getElementById('botaoConfirmarDesativar') as HTMLButtonElement | null;
    if (botaoConfirmarDesativar) botaoConfirmarDesativar.addEventListener('click', async () => {
        const id = (document.getElementById('idDesativar') as HTMLInputElement).value;
        const token = (document.querySelector('input[name="__RequestVerificationToken"]') as HTMLInputElement).value;
        try {
            const response = await fetch(`/Admin/Colaboradores/DesativarColaborador/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': token
                },
                body: JSON.stringify({})
            });
            const data: ServerResponse<null> = await response.json();
            if (data.sucesso) {
                mostrarNotificacao(data.mensagem ?? '', 'success');
                const modalDesativar = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDesativar')!);
                modalDesativar.hide();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                mostrarNotificacao(data.mensagem ?? '', 'error');
            }
        } catch (err) {
            console.error(err);
            mostrarNotificacao('Erro na comunicação com o servidor', 'error');
        }
    });

    const botaoConfirmarExcluir = document.getElementById('botaoConfirmarExcluir') as HTMLButtonElement | null;
    if (botaoConfirmarExcluir) botaoConfirmarExcluir.addEventListener('click', async () => {
        const id = (document.getElementById('idExcluir') as HTMLInputElement).value;
        const token = (document.querySelector('input[name="__RequestVerificationToken"]') as HTMLInputElement).value;
        try {
            const response = await fetch(`/Admin/Colaboradores/ExcluirColaborador/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': token
                },
                body: JSON.stringify({})
            });
            const data: ServerResponse<null> = await response.json();
            if (data.sucesso) {
                mostrarNotificacao(data.mensagem ?? '', 'success');
                const modalExcluir = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalExcluir')!);
                modalExcluir.hide();
                setTimeout(() => window.location.reload(), 1000);
            } else {
                mostrarNotificacao(data.mensagem ?? '', 'error');
            }
        } catch (err) {
            console.error(err);
            mostrarNotificacao('Erro na comunicação com o servidor', 'error');
        }
    });

    // Delegação de evento para a paginação
    document.addEventListener('click', (e: Event) => {
        const link = (e.target as HTMLElement).closest('.pagination .page-link') as HTMLAnchorElement | null;
        if (!link) return;
        e.preventDefault();
        const url = link.getAttribute('href');
        if (url) {
            window.location.href = url;
        }
    });
});

function configurarLimpezaErrosFormulario(): void {
    ['input', 'change', 'focus'].forEach(evt => {
        document.addEventListener(evt, event => {
            const el = (event.target as HTMLElement).closest('input, select, textarea') as HTMLElement | null;
            if (!el) return;
            el.classList.remove('is-invalid');
            const feedback = document.getElementById(el.id + '-erro');
            if (feedback) feedback.textContent = '';
        }, true);
    });

    document.addEventListener('click', e => {
        const alvo = (e.target as HTMLElement).closest('.mensagem-erro') as HTMLElement | null;
        if (alvo) {
            alvo.textContent = '';
            const campo = alvo.parentElement?.querySelector('input, select, textarea') as HTMLElement | null;
            if (campo) campo.classList.remove('is-invalid');
        }
    });
}

function configurarToastr(): void {
    toastr.options = {
        closeButton: true,
        positionClass: 'toast-top-right',
        showDuration: 300,
        hideDuration: 1000,
        timeOut: 5000,
        extendedTimeOut: 1000,
        showEasing: 'swing',
        hideEasing: 'linear',
        showMethod: 'fadeIn',
        hideMethod: 'fadeOut'
    } as ToastrOptions;
}

function inicializarBootstrap(): void {
    const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

    const popoverTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl));
}

function inicializarModalColaborador(): void {
    const modalEl = document.getElementById('modalColaborador');
    if (!modalEl) return;

    modalEl.addEventListener('show.bs.modal', () => {
        if (typeof VMasker !== 'undefined') {
            modalEl.querySelectorAll<HTMLInputElement>('.mascara-cpf').forEach(el => VMasker(el).maskPattern('999.999.999-99'));
            modalEl.querySelectorAll<HTMLInputElement>('.mascara-telefone').forEach(el => VMasker(el).maskPattern('(99) 99999-9999'));
        }

        modalEl.querySelectorAll<HTMLElement>('.form-floating').forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 50);
        });
    });

    modalEl.addEventListener('hidden.bs.modal', () => {
        limparFormularioColaborador();

        modalEl.querySelectorAll<HTMLElement>('.form-floating').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
        });
    });

    document.addEventListener('click', e => {
        const btn = (e.target as HTMLElement).closest('.toggle-password') as HTMLElement | null;
        if (btn) {
            alternarVisibilidadeSenha(btn.dataset.target!);
        }
    });

    const imagemInput = document.getElementById('colaboradorImagem') as HTMLInputElement | null;
    const avatarContainer = document.querySelector('.admin-avatar-container') as HTMLElement | null;
    if (imagemInput && avatarContainer) {
        imagemInput.addEventListener('change', e => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();

                avatarContainer.querySelectorAll('img, .success-overlay, .loading-overlay').forEach(el => el.remove());
                const loading = document.createElement('div');
                loading.className = 'loading-overlay';
                loading.innerHTML = '<i class="bi bi-arrow-repeat spin"></i>';
                avatarContainer.appendChild(loading);

                reader.onload = event => {
                    setTimeout(() => {
                        loading.remove();

                        const img = document.createElement('img');
                        img.src = (event.target as FileReader).result as string;
                        avatarContainer.appendChild(img);

                        const success = document.createElement('div');
                        success.className = 'success-overlay';
                        success.innerHTML = '<i class="bi bi-check-lg"></i>';
                        avatarContainer.appendChild(success);

                        setTimeout(() => {
                            success.remove();
                        }, 1300);
                    }, 500);
                };

                reader.readAsDataURL(file);
            }
        });
    }

    const colaboradorAtivo = document.getElementById('colaboradorAtivo') as HTMLInputElement | null;
    if (colaboradorAtivo) {
        colaboradorAtivo.addEventListener('change', () => {
            const label = colaboradorAtivo.closest('.form-check')?.querySelector<HTMLLabelElement>('.form-check-label');
            if (!label) return;
            if (colaboradorAtivo.checked) {
                label.textContent = 'Colaborador ativo';
                label.style.color = 'var(--success)';
            } else {
                label.textContent = 'Colaborador inativo';
                label.style.color = '#6c757d';
            }
        });
    }
}

function abrirModalColaborador(modo: 'criar' | 'editar' | 'visualizar', id: string | null = null): void {
    limparFormularioColaborador();
    const modalEl = document.getElementById('modalColaborador') as HTMLElement;
    const header = modalEl.querySelector('.modal-header') as HTMLElement;

    header.style.background = '';

    switch (modo) {
        case 'criar':
            header.style.background = getComputedStyle(document.documentElement).getPropertyValue('--primary-gradient');
            (document.getElementById('tituloModalColaborador') as HTMLElement).innerHTML = '<i class="fas fa-user-plus me-2 text-white"></i> Novo Colaborador';
            (document.getElementById('colaboradorId') as HTMLInputElement).value = '0';
            (document.getElementById('formularioColaborador') as HTMLFormElement).setAttribute('action', '/Admin/Colaboradores/CadastrarColaborador');
            (document.getElementById('containerSenhaAtual') as HTMLElement).style.display = 'none';
            (document.getElementById('containerSenha') as HTMLElement).style.display = '';
            (document.getElementById('linhaConfirmarSenha') as HTMLElement).style.display = '';
            const ativo = document.getElementById('colaboradorAtivo') as HTMLInputElement | null;
            if (ativo) {
                ativo.checked = true;
                ativo.dispatchEvent(new Event('change'));
            }
            habilitarCamposFormulario(true);
            document.querySelectorAll<HTMLElement>('.botao-modo-edicao').forEach(el => el.style.display = '');
            document.querySelectorAll<HTMLElement>('.botao-modo-visualizacao').forEach(el => el.style.display = 'none');
            (document.getElementById('botaoSalvarColaborador') as HTMLElement).innerHTML = '<i class="fas fa-save me-2"></i> Cadastrar';
            break;
        case 'editar':
            header.style.background = getComputedStyle(document.documentElement).getPropertyValue('--success-gradient');
            if (!id) {
                console.error('ID do colaborador não fornecido para edição');
                return;
            }
            (document.getElementById('tituloModalColaborador') as HTMLElement).innerHTML = '<i class="fas fa-user-edit me-2 text-white"></i> Editar Colaborador';
            (document.getElementById('colaboradorId') as HTMLInputElement).value = id;
            (document.getElementById('formularioColaborador') as HTMLFormElement).setAttribute('action', '/Admin/Colaboradores/AtualizarColaborador');
            (document.getElementById('containerSenhaAtual') as HTMLElement).style.display = '';
            (document.getElementById('containerSenha') as HTMLElement).style.display = '';
            (document.getElementById('linhaConfirmarSenha') as HTMLElement).style.display = '';
            habilitarCamposFormulario(true);
            document.querySelectorAll<HTMLElement>('.botao-modo-edicao').forEach(el => el.style.display = '');
            document.querySelectorAll<HTMLElement>('.botao-modo-visualizacao').forEach(el => el.style.display = 'none');
            (document.getElementById('botaoSalvarColaborador') as HTMLElement).innerHTML = '<i class="fas fa-save me-2"></i> Salvar Alterações';
            carregarDadosColaborador(id);
            break;
        case 'visualizar':
            header.style.background = getComputedStyle(document.documentElement).getPropertyValue('--accent-gradient');
            if (!id) {
                console.error('ID do colaborador não fornecido para visualização');
                return;
            }
            (document.getElementById('tituloModalColaborador') as HTMLElement).innerHTML = '<i class="fas fa-eye me-2 text-white"></i> Detalhes do Colaborador';
            (document.getElementById('colaboradorId') as HTMLInputElement).value = id;
            (document.getElementById('containerSenhaAtual') as HTMLElement).style.display = 'none';
            (document.getElementById('containerSenha') as HTMLElement).style.display = 'none';
            (document.getElementById('linhaConfirmarSenha') as HTMLElement).style.display = 'none';
            habilitarCamposFormulario(false);
            document.querySelectorAll<HTMLElement>('.botao-modo-edicao').forEach(el => el.style.display = 'none');
            document.querySelectorAll<HTMLElement>('.botao-modo-visualizacao').forEach(el => el.style.display = 'none');
            carregarDadosColaborador(id);
            break;
        default:
            console.error('Modo inválido para o modal de colaborador');
            return;
    }

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function habilitarCamposFormulario(habilitar: boolean): void {
    document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('#formularioColaborador input, #formularioColaborador select, #formularioColaborador textarea')
        .forEach(campo => {
            campo.readOnly = !habilitar;
            campo.disabled = !habilitar;
        });

    if (habilitar && (document.getElementById('colaboradorId') as HTMLInputElement).value !== '0') {
        const email = document.getElementById('colaboradorEmail') as HTMLInputElement | null;
        if (email) email.readOnly = true;
    }
}

async function carregarDadosColaborador(id: string): Promise<void> {
    try {
        const response = await fetch(`/Admin/Colaboradores/ObterColaborador/${id}`);
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        const data: ServerResponse<ColaboradorViewModel> = await response.json();
        if (data.sucesso && data.dados) {
            const colaborador = data.dados;
            (document.getElementById('nomeColaborador') as HTMLInputElement).value = colaborador.nome;
            (document.getElementById('emailColaborador') as HTMLInputElement).value = colaborador.email;
            const cpfInput = document.getElementById('cpfColaborador') as HTMLInputElement;
            cpfInput.value = colaborador.cpf;
            cpfInput.dispatchEvent(new Event('input'));
            const telInput = document.getElementById('telefoneColaborador') as HTMLInputElement;
            telInput.value = colaborador.telefone;
            telInput.dispatchEvent(new Event('input'));
            (document.getElementById('cargoColaborador') as HTMLSelectElement).value = colaborador.cargo;
            const ativo = document.getElementById('colaboradorAtivo') as HTMLInputElement | null;
            if (ativo) {
                ativo.checked = colaborador.ativo;
                ativo.dispatchEvent(new Event('change'));
            }
            if (colaborador.imagemUrl) {
                const avatarContainer = document.querySelector('.admin-avatar-container') as HTMLElement | null;
                if (avatarContainer) {
                    avatarContainer.querySelectorAll('img').forEach(el => el.remove());
                    const img = document.createElement('img');
                    img.src = colaborador.imagemUrl;
                    avatarContainer.appendChild(img);
                }
            }
        } else {
            console.error('Erro ao obter dados:', data.mensagem || 'Erro desconhecido');
            mostrarNotificacao(`Erro ao carregar dados: ${data.mensagem || 'Erro desconhecido'}`, 'error');
        }
    } catch (error: any) {
        console.error('Erro ao carregar dados do colaborador:', error);
        mostrarNotificacao(`Erro ao carregar dados: ${error.message}`, 'error');
    }
}

function limparFormularioColaborador(): void {
    const form = document.getElementById('formularioColaborador') as HTMLFormElement | null;
    if (form) form.reset();

    document.querySelectorAll<HTMLElement>('#formularioColaborador input, #formularioColaborador select, #formularioColaborador textarea').forEach(el => {
        el.classList.remove('is-valid', 'is-invalid');
    });
    document.querySelectorAll<HTMLElement>('.mensagem-erro').forEach(el => { el.textContent = ''; el.style.display = 'none'; });

    const avatarContainer = document.querySelector('.admin-avatar-container') as HTMLElement | null;
    if (avatarContainer) avatarContainer.querySelectorAll('img, .success-overlay, .loading-overlay').forEach(el => el.remove());
}

function alternarVisibilidadeSenha(targetId: string): void {
    const input = document.getElementById(targetId) as HTMLInputElement | null;
    const toggleBtn = document.querySelector<HTMLButtonElement>('button[data-target="' + targetId + '"]');
    if (!input || !toggleBtn) return;

    input.type = input.type === 'password' ? 'text' : 'password';

    const icon = toggleBtn.querySelector('i');
    if (icon) icon.classList.toggle('bi-eye');
    if (icon) icon.classList.toggle('bi-eye-slash');

    toggleBtn.classList.add('btn-clicked');
    setTimeout(() => toggleBtn.classList.remove('btn-clicked'), 200);
}

function validarFormularioColaborador(): boolean {
    let formValido = true;
    const camposObrigatorios = [
        {id: 'nomeColaborador', min: 3, mensagem: 'O nome deve ter pelo menos 3 caracteres'},
        {id: 'emailColaborador', regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, mensagem: 'Digite um email válido'},
        {id: 'cpfColaborador', mensagem: 'CPF inválido'},
        {id: 'telefoneColaborador', mensagem: 'Telefone inválido'},
        {id: 'cargoColaborador', mensagem: 'Selecione um cargo'}
    ];

    const isCriacao = (document.getElementById('colaboradorId') as HTMLInputElement).value === '0';

    if (isCriacao) {
        camposObrigatorios.push(
            {id: 'senhaColaborador', min: 6, mensagem: 'A senha deve ter pelo menos 6 caracteres'}
        );
    }

    camposObrigatorios.forEach(campo => {
        const campoEl = document.getElementById(campo.id) as HTMLInputElement | HTMLSelectElement | null;
        if (!campoEl) {
            console.warn(`Campo de validação '${campo.id}' não encontrado, pulando.`);
            return;
        }
        let valido = true;

        if (campoEl.offsetParent === null) {
            return;
        }

        const valor = campoEl.value != null ? campoEl.value.toString() : '';
        if (campo.min && valor.trim().length < campo.min) {
            valido = false;
        }

        if (campo.regex && !campo.regex.test(valor.trim())) {
            valido = false;
        }

        if (campo.id === 'cpfColaborador') {
            const cpfDigitos = removerMascara(valor);
            if (cpfDigitos.length !== 11) {
                valido = false;
            }
        }

        if (campo.id === 'telefoneColaborador' && valor) {
            const telefone = removerMascara(valor);
            valido = telefone.length >= 10;
        }

        if (campo.id === 'senhaColaborador' && isCriacao) {
            const senha = valor;
            const confirmarSenha = (document.getElementById('confirmarSenhaColaborador') as HTMLInputElement).value;
            if (senha !== confirmarSenha) {
                const conf = document.getElementById('confirmarSenhaColaborador') as HTMLInputElement;
                conf.classList.add('is-invalid');
                const erro = document.getElementById('confirmarSenhaColaborador-erro');
                if (erro) { erro.textContent = 'As senhas não coincidem'; erro.style.display = 'block'; }
                formValido = false;
            } else {
                const conf = document.getElementById('confirmarSenhaColaborador') as HTMLInputElement;
                conf.classList.remove('is-invalid');
                const erro = document.getElementById('confirmarSenhaColaborador-erro');
                if (erro) { erro.textContent = ''; erro.style.display = 'none'; }
            }
        }

        if (!valido) {
            campoEl.classList.add('is-invalid');
            const erroEl = document.getElementById(campo.id + '-erro');
            if (erroEl) { erroEl.textContent = campo.mensagem; erroEl.style.display = 'block'; }
            formValido = false;
        } else {
            campoEl.classList.remove('is-invalid');
            const erroEl = document.getElementById(campo.id + '-erro');
            if (erroEl) { erroEl.textContent = ''; erroEl.style.display = 'none'; }
        }
    });

    return formValido;
}

function removerMascara(valor: string): string {
    return valor.replace(/[^\d]/g, '');
}

async function enviarFormularioColaborador(): Promise<void> {
    try {
        const form = document.getElementById('formularioColaborador') as HTMLFormElement;
        const cpfInput = document.getElementById('cpfColaborador') as HTMLInputElement | null;
        if (cpfInput) {
            cpfInput.value = removerMascara(cpfInput.value);
        }
        const telInput = document.getElementById('telefoneColaborador') as HTMLInputElement | null;
        if (telInput) {
            telInput.value = removerMascara(telInput.value);
        }
        const formData = new FormData(form);
        const url = form.getAttribute('action')!;
        const btnSalvar = document.getElementById('botaoSalvarColaborador') as HTMLButtonElement;

        const textoOriginal = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i>Salvando...';
        btnSalvar.disabled = true;

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        const data: ServerResponse<null> = await response.json();

        btnSalvar.innerHTML = textoOriginal;
        btnSalvar.disabled = false;

        if (data.sucesso) {
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalColaborador')!).hide();
            mostrarNotificacao(data.mensagem || 'Operação realizada com sucesso!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            mostrarNotificacao(data.mensagem || 'Ocorreu um erro ao processar a solicitação', 'error');
            if (data.erros) {
                Object.keys(data.erros).forEach(campo => {
                    const campoEl = document.getElementById(campo) as HTMLElement | null;
                    const mensagem = data.erros![campo];
                    if (campoEl) {
                        campoEl.classList.add('is-invalid');
                        const erro = document.getElementById(campo + '-erro');
                        if (erro) { erro.textContent = mensagem; erro.style.display = 'block'; }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        mostrarNotificacao('Erro na comunicação com o servidor', 'error');
        const btnSalvar = document.getElementById('botaoSalvarColaborador') as HTMLButtonElement | null;
        if (btnSalvar) {
            btnSalvar.innerHTML = '<i class="fas fa-save me-2"></i>Salvar';
            btnSalvar.disabled = false;
        }
    }
}

function visualizarDetalhesColaborador(id: string): void {
    abrirModalColaborador('visualizar', id);
}

function editarColaborador(id: string): void {
    abrirModalColaborador('editar', id);
}

function confirmarDesativacaoColaborador(id: string): void {
    Swal.fire({
        title: 'Confirmar desativação',
        text: 'Deseja realmente desativar este colaborador?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, desativar',
        cancelButtonText: 'Cancelar'
    }).then(result => {
        if (result.isConfirmed) {
            alterarStatusColaborador(id, false);
        }
    });
}

let statusAction = '';

function abrirModalStatus(id: string, nome: string, acao: 'ativar' | 'inativar'): void {
    const modalEl = document.getElementById('modalStatus') as HTMLElement;
    modalEl.dataset.action = acao;
    statusAction = acao;
    (document.getElementById('idStatus') as HTMLInputElement).value = id;
    (document.getElementById('nomeColaboradorStatus') as HTMLElement).textContent = nome;

    const header = modalEl.querySelector('.modal-header') as HTMLElement;
    const titleIcon = modalEl.querySelector('.modal-title i') as HTMLElement | null;
    const titleText = modalEl.querySelector('#tituloStatus') as HTMLElement | null;
    const confirmBtn = document.getElementById('botaoConfirmarStatus') as HTMLButtonElement | null;

    if (acao === 'ativar') {
        header.style.background = getComputedStyle(document.documentElement).getPropertyValue('--success-gradient');
        if (titleIcon) titleIcon.setAttribute('class', 'fas fa-user-check me-2');
        if (titleText) titleText.textContent = 'Confirmar Ativação';
        if (confirmBtn) {
            confirmBtn.setAttribute('class', 'botao-primario');
            confirmBtn.innerHTML = '<i class="fas fa-user-check me-2"></i>Ativar';
        }
    } else {
        header.style.background = getComputedStyle(document.documentElement).getPropertyValue('--danger-gradient');
        if (titleIcon) titleIcon.setAttribute('class', 'fas fa-user-slash me-2');
        if (titleText) titleText.textContent = 'Confirmar Status';
        if (confirmBtn) {
            confirmBtn.setAttribute('class', 'botao-perigo');
            confirmBtn.innerHTML = '<i class="fas fa-user-slash me-2"></i>Inativar';
        }
    }
    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

document.addEventListener('click', async e => {
    if (!(e.target as HTMLElement).closest('#botaoConfirmarStatus')) return;
    const id = (document.getElementById('idStatus') as HTMLInputElement).value;
    const token = (document.querySelector('input[name="__RequestVerificationToken"]') as HTMLInputElement).value;
    const url = statusAction === 'ativar'
        ? `/Admin/Colaboradores/AtivarColaborador/${id}`
        : `/Admin/Colaboradores/DesativarColaborador/${id}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'RequestVerificationToken': token
            }
        });
        const data: ServerResponse<null> = await response.json();
        if (data.sucesso) {
            mostrarNotificacao(data.mensagem ?? '', 'success');
            bootstrap.Modal.getOrCreateInstance(document.getElementById('modalStatus')!).hide();
            setTimeout(() => window.location.reload(), 1000);
        } else {
            mostrarNotificacao(data.mensagem ?? '', 'error');
        }
    } catch (err) {
        console.error(err);
        mostrarNotificacao('Erro na comunicação com o servidor', 'error');
    }
});

function filtrarColaboradores(): void {
    const filtroNome = (document.getElementById('filtroNome') as HTMLInputElement).value.trim();
    const filtroCargo = (document.getElementById('filtroCargo') as HTMLSelectElement).value;
    const filtroStatus = (document.getElementById('filtroStatus') as HTMLSelectElement).value;

    let url = '/Admin/Colaboradores?';
    if (filtroNome) {
        url += `nome=${encodeURIComponent(filtroNome)}&`;
    }
    if (filtroCargo) {
        url += `cargo=${encodeURIComponent(filtroCargo)}&`;
    }
    if (filtroStatus) {
        url += `ativo=${encodeURIComponent(filtroStatus)}&`;
    }
    window.location.href = url;
}

function limparFiltros(): void {
    (document.getElementById('filtroNome') as HTMLInputElement).value = '';
    (document.getElementById('filtroCargo') as HTMLSelectElement).value = '';
    (document.getElementById('filtroStatus') as HTMLSelectElement).value = '';
    window.location.href = '/Admin/Colaboradores';
}

function preencherDropdownCargos(): void {
    try {
        const dropdownCargo = document.getElementById('colaboradorCargo') as HTMLSelectElement | null;
        const filtroDropdownCargo = document.getElementById('filtroCargo') as HTMLSelectElement | null;
        if (!dropdownCargo && !filtroDropdownCargo) {
            return;
        }

        fetch('/Admin/Colaboradores/ObterCargos')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP: ${response.status}`);
                }
                return response.json();
            })
            .then((data: ServerResponse<CargoViewModel[]>) => {
                if (data.sucesso && data.dados) {
                    const cargos = data.dados;
                    if (dropdownCargo) {
                        dropdownCargo.innerHTML = '<option value="">Selecione um cargo</option>';
                        cargos.forEach(cargo => {
                            const option = document.createElement('option');
                            option.value = String(cargo.id);
                            option.textContent = cargo.nome;
                            dropdownCargo.appendChild(option);
                        });
                    }

                    if (filtroDropdownCargo) {
                        const valorAtual = filtroDropdownCargo.value;
                        filtroDropdownCargo.innerHTML = '<option value="">Todos os cargos</option>';
                        cargos.forEach(cargo => {
                            const opt = document.createElement('option');
                            opt.value = String(cargo.id);
                            opt.textContent = cargo.nome;
                            filtroDropdownCargo.appendChild(opt);
                        });
                        if (valorAtual) {
                            filtroDropdownCargo.value = valorAtual;
                        }
                    }
                } else {
                    console.error('Erro ao obter cargos:', data.mensagem || 'Erro desconhecido');
                }
            })
            .catch(error => {
                console.error('Erro ao carregar cargos:', error);
            });
    } catch (error) {
        console.error('Erro ao preencher dropdown de cargos:', error);
    }
}

function mostrarNotificacao(mensagem: string, tipo: 'success' | 'error' = 'success'): void {
    const existingNotificacao = document.querySelector('.notificacao');
    if (existingNotificacao) {
        existingNotificacao.remove();
    }

    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;

    const icone = tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle';
    const titulo = tipo === 'success' ? 'Sucesso!' : 'Erro';

    notificacao.innerHTML = `
        <div class="notificacao-icone">
            <i class="bi ${icone}"></i>
        </div>
        <div class="notificacao-conteudo">
            <h5 class="mb-0 fw-bold">${titulo}</h5>
            <p>${mensagem}</p>
        </div>
        <button class="notificacao-fechar">
            <i class="bi bi-x"></i>
        </button>
    `;

    document.body.appendChild(notificacao);

    setTimeout(() => {
        notificacao.classList.add('notificacao-show');
    }, 10);

    const closeBtn = notificacao.querySelector('.notificacao-fechar');
    closeBtn?.addEventListener('click', () => {
        notificacao.classList.remove('notificacao-show');
        setTimeout(() => {
            notificacao.remove();
        }, 300);
    });

    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.classList.remove('notificacao-show');
            setTimeout(() => {
                if (notificacao.parentNode) {
                    notificacao.remove();
                }
            }, 300);
        }
    }, 5000);
}

function formatarData(dataStr: string | null): string {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    if (isNaN(data.getTime())) {
        return '';
    }
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function abrirModalDesativar(id: string, nome: string): void {
    (document.getElementById('idDesativar') as HTMLInputElement).value = id;
    (document.getElementById('nomeColaboradorDesativacao') as HTMLElement).textContent = nome;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalDesativar')!).show();
}

function abrirModalExcluir(id: string, nome: string): void {
    (document.getElementById('idExcluir') as HTMLInputElement).value = id;
    (document.getElementById('nomeColaboradorExclusao') as HTMLElement).textContent = nome;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalExcluir')!).show();
}
