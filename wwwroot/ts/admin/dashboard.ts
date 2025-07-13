interface GraficoDataItem {
    mes: string;
    total: number;
}

interface EspecieDataItem {
    especie: string;
    total: number;
}

interface StatusDataItem {
    status: string;
    total: number;
}

interface Estatisticas {
    totalCachorros?: number;
    totalGatos?: number;
    formulariosAprovados?: number;
    formulariosPendentes?: number;
}

interface DashboardData {
    adocoesPorMes?: GraficoDataItem[];
    especiesDistribuicao?: EspecieDataItem[];
    usuariosPorMes?: GraficoDataItem[];
    statusFormularios?: StatusDataItem[];
    estatisticas?: Estatisticas;
    petsEspecie?: EspecieDataItem[];
}

declare const Chart: any;
declare const bootstrap: any;

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(17, 24, 39, 0.8)';
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.titleFont.size = 14;
Chart.defaults.plugins.tooltip.bodyFont.size = 13;
Chart.defaults.plugins.tooltip.displayColors = false;

function mostrarAlerta(mensagem: string, tipo: string = 'info'): void {
    const alerta = document.createElement('div');
    alerta.className = `alerta alerta-${tipo} fade-in`;
    alerta.textContent = mensagem;
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.classList.remove('fade-in');
        setTimeout(() => {
            alerta.remove();
        }, 300);
    }, 3000);
}

function validarCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    if (digito !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digito = 11 - (soma % 11);
    if (digito > 9) digito = 0;
    if (digito !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

function validarEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validarSenha(senha: string): boolean {
    return senha.length >= 6 && 
           /[A-Z]/.test(senha) && 
           /[a-z]/.test(senha) && 
           /[0-9]/.test(senha);
}

function formatarData(data: string | number | Date | null | undefined): string {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

function formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarTelefone(telefone: string): string {
    if (!telefone) return '';
    telefone = telefone.replace(/\D/g, '');
    if (telefone.length === 11) {
        return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (telefone.length === 10) {
        return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
}

function formatarCEP(cep: string): string {
    if (!cep) return '';
    cep = cep.replace(/\D/g, '');
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
}

function formatarCPF(cpf: string): string {
    if (!cpf) return '';
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

let modalAdmin: any;
let modalPet: any;

document.addEventListener('DOMContentLoaded', function() {
    modalAdmin = new bootstrap.Modal(document.getElementById('modalAdmin'));
    modalPet = new bootstrap.Modal(document.getElementById('modalPet'));

    carregarDadosGraficos();
    
    
    carregarAtividadesRecentes();

    
    const idadeAnosPet = document.getElementById('idadeAnosPet');
    if (idadeAnosPet) {
        idadeAnosPet.addEventListener('input', function() {
            atualizarCampoIdadeTotal();
        });
    }
    
    const idadeMesesPet = document.getElementById('idadeMesesPet');
    if (idadeMesesPet) {
        idadeMesesPet.addEventListener('input', function() {
            atualizarCampoIdadeTotal();
        });
    }

    
    const toggleSenha = document.getElementById('toggleSenha');
    if (toggleSenha) {
        toggleSenha.addEventListener('click', function(this: HTMLElement) {
            const senhaInput = document.getElementById('senha') as HTMLInputElement;
            const tipo = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            senhaInput.setAttribute('type', tipo);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }
    
    const toggleConfirmSenha = document.getElementById('toggleConfirmSenha');
    if (toggleConfirmSenha) {
        toggleConfirmSenha.addEventListener('click', function(this: HTMLElement) {
            const confirmSenhaInput = document.getElementById('confirmSenha') as HTMLInputElement;
            const tipo = confirmSenhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmSenhaInput.setAttribute('type', tipo);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    
    document.querySelectorAll('.filtro-grafico').forEach(filtro => {
        filtro.addEventListener('click', (e) => {
            document.querySelectorAll('.filtro-grafico').forEach(f => f.classList.remove('ativo'));
            const alvo = e.currentTarget as HTMLElement;
            alvo.classList.add('ativo');
            atualizarDadosGrafico(alvo.textContent?.trim() || '');
        });
    });
    
    
    document.querySelectorAll('.filtro-grafico-usuarios').forEach(filtro => {
        filtro.addEventListener('click', (e) => {
            document.querySelectorAll('.filtro-grafico-usuarios').forEach(f => f.classList.remove('ativo'));
            const alvo = e.currentTarget as HTMLElement;
            alvo.classList.add('ativo');
            atualizarDadosGraficoUsuarios(alvo.getAttribute('data-periodo') || '');
        });
    });
});


function abrirModalAdmin(): void {

    const formAdminElement = document.getElementById('formAdmin') as HTMLFormElement | null;
    if (formAdminElement) {
        formAdminElement.reset();
    }
    

    aplicarMascaras();
    

    if (modalAdmin) {
        modalAdmin.show();
    } else {
        const modalAdminElement = new bootstrap.Modal(document.getElementById('modalAdmin'));
        modalAdminElement.show();
    }
}


function alternarVisibilidadeSenha(idInput: string): void {
    const input = document.getElementById(idInput) as HTMLInputElement | null;
    const botao = input?.nextElementSibling as HTMLElement | null;
    const icone = botao?.querySelector('i');
    
    if (input && icone) {
        if (input.type === 'password') {
            input.type = 'text';
            icone.classList.remove('fa-eye');
            icone.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icone.classList.remove('fa-eye-slash');
            icone.classList.add('fa-eye');
        }
    }
}


function criarGradiente(
    corInicio: string,
    corFim: string,
    ctx: CanvasRenderingContext2D
): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, corInicio);
    gradient.addColorStop(1, corFim);
    return gradient;
}


function calcularIdadeEmAnos(): number {
    const anos = parseInt((document.getElementById('idadeAnosPet') as HTMLInputElement).value) || 0;
    const meses = parseInt((document.getElementById('idadeMesesPet') as HTMLInputElement).value) || 0;
    

    const idadeEmAnos = anos + (meses / 12);
    

    return Math.round(idadeEmAnos * 10) / 10;
}


function atualizarCampoIdadeTotal(): void {
    const idadeEmAnos = calcularIdadeEmAnos();
    document.getElementById('idadePet').value = idadeEmAnos;
}


function formatarNumero(valor: number): string {
    return new Intl.NumberFormat('pt-BR').format(valor);
}


function atualizarDadosGrafico(filtro: string): void {
    
    
    carregarDadosGraficos(filtro, 'Anual');
}


function atualizarDadosGraficoUsuarios(filtro: string): void {
    
    
    carregarDadosGraficos('Anual', filtro);
}


async function carregarDadosGraficos(
    filtroAdocoes: string = 'Anual',
    filtroUsuarios: string = 'Anual'
): Promise<void> {

    document.querySelectorAll('.area-grafico').forEach(area => {
        area.innerHTML = `
            <div class="carregando-grafico">
                Carregando dados...
            </div>
        `;
    });

    try {
        const response = await fetch(`/GerenciamentoDashboard/DadosGraficos?periodoAdocoes=${encodeURIComponent(filtroAdocoes)}&periodoUsuarios=${encodeURIComponent(filtroUsuarios)}`);
        if (!response.ok) {
            throw new Error('Falha ao carregar dados dos gráficos');
        }
        const dados = await response.json();

        if (!dados || typeof dados !== 'object') {
            throw new Error('Formato de dados inválido');
        }

        try {
            const adocoes = (dados.adocoesPorMes || []).map(item => ({
                mes: item.Mes || item.mes,
                total: item.Quantidade ?? item.total
            }));

            const especies = (dados.especiesDistribuicao || dados.petsEspecie || []).map(item => ({
                especie: item.Especie || item.especie,
                total: item.Quantidade ?? item.total
            }));

            const usuarios = (dados.usuariosPorMes || []).map(item => ({
                mes: item.Mes || item.mes,
                total: item.Quantidade ?? item.total
            }));

            const status = (dados.statusFormularios || []).map(item => ({
                status: item.Status || item.status,
                total: item.Quantidade ?? item.total
            }));

            if (adocoes.length) {
                atualizarGraficoAdocoes(adocoes, filtroAdocoes);
            }

            if (especies.length) {
                atualizarGraficoPetsEspecie(especies);
            }

            if (usuarios.length) {
                atualizarGraficoUsuarios(usuarios, filtroUsuarios);
            }

            if (status.length) {
                atualizarGraficoStatusFormularios(status);
            }

            if (dados.estatisticas) {
                atualizarCardEstatisticas(dados.estatisticas);
            }

        } catch (erro) {
            console.error('Erro ao processar dados dos gráficos:', erro);
            document.querySelectorAll('.area-grafico').forEach(area => {
                area.innerHTML = `
                    <div class="erro-grafico">
                        Erro ao processar dados. Tente novamente.
                    </div>
                `;
            });
        }
    } catch (erro) {
        console.error('Erro ao carregar dados dos gráficos:', erro);
        document.querySelectorAll('.area-grafico').forEach(area => {
            area.innerHTML = `
                <div class="erro-grafico">
                    ${erro.message || 'Erro ao carregar dados. Tente novamente.'}
                </div>
            `;
        });
    }
}


function atualizarGraficoAdocoes(dados: GraficoDataItem[], filtro: string): void {
    const canvas = document.getElementById('graficoAdocoesMes');
    if (!canvas) return;
    
    
    const dadosFiltrados = filtrarDadosPorPeriodo(dados, filtro);
    
    
    const ctx = canvas.getContext('2d');
    
    
    if (window.graficoAdocoes) {
        window.graficoAdocoes.destroy();
    }
    
    
    const gradienteFill = criarGradiente('rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.2)', ctx);
    
    
    window.graficoAdocoes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dadosFiltrados.map(item => item.mes),
            datasets: [{
                label: 'Adoções',
                data: dadosFiltrados.map(item => item.total),
                backgroundColor: gradienteFill,
                borderColor: '#6366F1',
                borderWidth: 1,
                borderRadius: 6,
                barThickness: 20,
                maxBarThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Total: ${formatarNumero(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false,
                        color: 'rgba(200, 200, 200, 0.15)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}


function atualizarGraficoPetsEspecie(dados: EspecieDataItem[]): void {
    const canvas = document.getElementById('graficoPetsEspecie');
    if (!canvas) return;
    
    
    const ctx = canvas.getContext('2d');
    
    
    if (window.graficoPetsEspecie) {
        window.graficoPetsEspecie.destroy();
    }
    
    
    const cores = [
        '#6366F1', 
        '#10B981', 
        '#F59E0B', 
        '#EF4444'  
    ];
    
    
    window.graficoPetsEspecie = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: dados.map(item => item.especie),
            datasets: [{
                data: dados.map(item => item.total),
                backgroundColor: cores,
                borderColor: '#FFFFFF',
                borderWidth: 2,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatarNumero(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function atualizarGraficoUsuarios(dados: GraficoDataItem[], filtro: string): void {
    const canvas = document.getElementById('graficoUsuariosMes');
    if (!canvas) return;
    
    
    const dadosFiltrados = filtrarDadosPorPeriodo(dados, filtro);
    
    
    const ctx = canvas.getContext('2d');
    
    
    if (window.graficoUsuarios) {
        window.graficoUsuarios.destroy();
    }
    
    
    const gradienteFill = criarGradiente('rgba(16, 185, 129, 0.7)', 'rgba(16, 185, 129, 0.05)', ctx);
    
    
    window.graficoUsuarios = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dadosFiltrados.map(item => item.mes),
            datasets: [{
                label: 'Novos Usuários',
                data: dadosFiltrados.map(item => item.total),
                backgroundColor: gradienteFill,
                borderColor: '#10B981',
                borderWidth: 2,
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#10B981',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Total: ${formatarNumero(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false,
                        color: 'rgba(200, 200, 200, 0.15)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}


function atualizarGraficoStatusFormularios(dados: StatusDataItem[]): void {
    const canvas = document.getElementById('graficoStatusFormularios');
    if (!canvas) return;
    
    
    const ctx = canvas.getContext('2d');
    
    
    if (window.graficoStatusFormularios) {
        window.graficoStatusFormularios.destroy();
    }
    
    
    const coresStatus = {
        'Aprovada': '#22C55E',      
        'Rejeitada': '#EF4444',      
        'Pendente': '#F59E0B',       
        'Em Análise': '#6366F1',     
        'Cancelada': '#6B7280'       
    };
    
    
    const labels = dados.map(item => item.status);
    const valores = dados.map(item => item.total);
    const cores = dados.map(item => coresStatus[item.status] || '#6B7280');
    
    
    window.graficoStatusFormularios = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: cores,
                borderColor: '#FFFFFF',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${formatarNumero(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    ticks: {
                        display: false
                    },
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    },
                    angleLines: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    }
                }
            }
        }
    });
}

function filtrarDadosPorPeriodo(dados: GraficoDataItem[], filtro: string): GraficoDataItem[] {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const mapaMes: { [chave: string]: number } = {
        'jan': 0, 'janeiro': 0,
        'feb': 1, 'fev': 1, 'fevereiro': 1,
        'mar': 2, 'marco': 2, 'março': 2,
        'apr': 3, 'abr': 3, 'abril': 3,
        'may': 4, 'mai': 4, 'maio': 4,
        'jun': 5, 'junho': 5,
        'jul': 6, 'julho': 6,
        'aug': 7, 'ago': 7, 'agosto': 7,
        'sep': 8, 'set': 8, 'setembro': 8,
        'oct': 9, 'out': 9, 'outubro': 9,
        'nov': 10, 'novembro': 10,
        'dec': 11, 'dez': 11, 'dezembro': 11
    };

    function obterData(item: GraficoDataItem): Date {
        const [mesParte, anoParte] = item.mes.split('/');
        const ano = parseInt(anoParte);
        let mes = parseInt(mesParte) - 1;

        if (isNaN(mes)) {
            const chave = mesParte.toLowerCase();
            mes = mapaMes[chave];
        }

        return new Date(ano, mes ?? 0, 1);
    }

    switch (filtro) {
        case 'Trimestral':
            return dados.filter(item => {
                const itemDate = obterData(item);
                const tresAtrasMes = new Date(anoAtual, mesAtual - 2, 1);
                return itemDate >= tresAtrasMes;
            });
        case 'Semestral':
            return dados.filter(item => {
                const itemDate = obterData(item);
                const seisAtrasMes = new Date(anoAtual, mesAtual - 5, 1);
                return itemDate >= seisAtrasMes;
            });
        default:
            return dados;
    }
}


function atualizarCardEstatisticas(dados: Estatisticas): void {
    const elementos = {
        totalCachorros: document.getElementById('total-cachorros'),
        totalGatos: document.getElementById('total-gatos'),
        formulariosAprovados: document.getElementById('formularios-aprovados'),
        formulariosPendentes: document.getElementById('formularios-pendentes')
    };
    
    
    for (const [chave, elemento] of Object.entries(elementos)) {
        if (elemento && dados[chave] !== undefined) {
            
            animarContador(elemento, 0, dados[chave]);
        }
    }
}


function animarContador(elemento: HTMLElement, inicio: number, fim: number): void {
    const duracao = 1500; 
    const intervalo = 30; 
    const incrementoPorPasso = (fim - inicio) / (duracao / intervalo);
    let valorAtual = inicio;
    
    
    elemento.classList.add('animando');
    
    const timer = setInterval(() => {
        valorAtual += incrementoPorPasso;
        
        if (valorAtual >= fim) {
            clearInterval(timer);
            valorAtual = fim;
            
            
            setTimeout(() => {
                elemento.classList.remove('animando');
            }, 300);
        }
        
        
        elemento.textContent = formatarNumero(Math.floor(valorAtual));
    }, intervalo);
}


function validarFormularioAdministrador(): boolean {
    let valido = true;
    const campos = {
        nome: document.getElementById('nomeAdmin'),
        email: document.getElementById('emailAdmin'),
        cpf: document.getElementById('cpfAdmin'),
        telefone: document.getElementById('telefoneAdmin'),
        senha: document.getElementById('senhaAdmin'),
        confirmSenha: document.getElementById('confirmarSenhaAdmin')
    };
    
    
    if (!campos.nome.value.trim()) {
        mostrarErroFormulario(campos.nome, 'O nome é obrigatório');
        valido = false;
    }
    
    
    if (!validarEmail(campos.email.value.trim())) {
        mostrarErroFormulario(campos.email, 'Email inválido');
        valido = false;
    }
    
    
    if (!validarCPF(campos.cpf.value.trim())) {
        mostrarErroFormulario(campos.cpf, 'CPF inválido');
        valido = false;
    }
    
    
    if (!campos.telefone.value.trim()) {
        mostrarErroFormulario(campos.telefone, 'Telefone é obrigatório');
        valido = false;
    }
    
    
    if (campos.senha && campos.confirmSenha) {
        if (!campos.senha.value) {
            mostrarErroFormulario(campos.senha, 'Senha é obrigatória');
            valido = false;
        } else if (campos.senha.value !== campos.confirmSenha.value) {
            mostrarErroFormulario(campos.confirmSenha, 'As senhas não coincidem');
            valido = false;
        }
    }
    
    return valido;
}


async function realizarLogout(): Promise<void> {
    if (!confirm('Tem certeza que deseja sair do sistema?')) {
        return;
    }
    try {
        const response = await fetch('/Autenticacao/Logout', {
            method: 'GET',
            credentials: 'include'
        });
        if (response.ok || response.redirected) {
            window.location.href = '/Login';
        } else {
            mostrarAlerta('Erro ao realizar logout. Tente novamente.', 'erro');
        }
    } catch (erro) {
        console.error('Erro ao fazer logout:', erro);
        mostrarAlerta('Erro ao realizar logout. Tente novamente.', 'erro');
    }
}


function aplicarMascaras(): void {
    
}


async function carregarAtividadesRecentes(): Promise<void> {
    const container = document.querySelector('.lista-atividade');
    if (!container) return;

    container.innerHTML = `<div class="text-center p-3"><i class="fas fa-spinner fa-spin me-2"></i> Carregando atividades...</div>`;

    try {
        const response = await fetch('/GerenciamentoDashboard/AtividadesRecentes');
        if (!response.ok) {
            throw new Error('Falha ao carregar atividades recentes');
        }
        const dados = await response.json();
        if (Array.isArray(dados) && dados.length > 0) {
            atualizarListaAtividades(container, dados);
        } else {
            container.innerHTML = `<div class="text-center p-3">Nenhuma atividade recente encontrada.</div>`;
        }
    } catch (erro) {
        console.error('Erro ao carregar atividades recentes:', erro);
        container.innerHTML = `<div class="text-center p-3 text-danger"><i class="fas fa-exclamation-circle me-2"></i> Erro ao carregar atividades.</div>`;
    }
}


interface Atividade {
    tipo: string;
    descricao: string;
    data: string;
}

function atualizarListaAtividades(container: Element, atividades: Atividade[]): void {
    
    container.innerHTML = '';
    
    const atividadesLimitadas = atividades.slice(0, 5);
    
    atividadesLimitadas.forEach(atividade => {
        let iconeClasse = 'usuario'; 
        let icone = 'fa-user';
        
        switch (atividade.tipo.toLowerCase()) {
            case 'adocao':
                iconeClasse = 'adocao';
                icone = 'fa-heart';
                break;
            case 'pet':
                iconeClasse = 'pet';
                icone = 'fa-paw';
                break;
            case 'usuario':
                iconeClasse = 'usuario';
                icone = 'fa-user';
                break;
        }
        
        
        const elementoAtividade = document.createElement('div');
        elementoAtividade.className = 'item-atividade';
        elementoAtividade.innerHTML = `
            <div class="icone-atividade ${iconeClasse}">
                <i class="fas ${icone}"></i>
            </div>
            <div class="conteudo-atividade">
                <div class="acao-atividade">${atividade.descricao}</div>
                <div class="data-atividade">${formatarDataAtividade(atividade.data)}</div>
            </div>
        `;
        
        
        container.appendChild(elementoAtividade);
    });
}


function formatarDataAtividade(data: string): string {
    const dataAtividade = new Date(data);
    const agora = new Date();
    const diferencaMs = agora - dataAtividade;
    
    
    const segundos = Math.floor(diferencaMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    
    if (segundos < 60) {
        return 'Agora mesmo';
    } else if (minutos < 60) {
        return `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} atrás`;
    } else if (horas < 24) {
        return `${horas} ${horas === 1 ? 'hora' : 'horas'} atrás`;
    } else if (dias < 7) {
        return `${dias} ${dias === 1 ? 'dia' : 'dias'} atrás`;
    } else {
        
        return dataAtividade.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}


function mostrarErroFormulario(campo: HTMLInputElement, mensagem: string): void {
    campo.classList.add('is-invalid');
    const feedbackElement = document.getElementById(`${campo.id}-erro`);
    if (feedbackElement) {
        feedbackElement.textContent = mensagem;
    }
}


function inicializarGraficos(): void {
    
    carregarDadosGraficos();
    
    
    document.querySelectorAll('#filtro-adocoes button').forEach(botao => {
        botao.addEventListener('click', function() {
            
            document.querySelectorAll('#filtro-adocoes button').forEach(b => {
                b.classList.remove('active');
            });
            
            
            this.classList.add('active');
            
            
            atualizarDadosGrafico(this.dataset.filtro);
        });
    });
    
    
    document.querySelectorAll('#filtro-usuarios button').forEach(botao => {
        botao.addEventListener('click', function() {
            
            document.querySelectorAll('#filtro-usuarios button').forEach(b => {
                b.classList.remove('active');
            });
            
            
            this.classList.add('active');
            
            
            atualizarDadosGraficoUsuarios(this.dataset.filtro);
        });
    });
}


function inicializarDashboard(): void {
    
    inicializarGraficos();
    
    
    carregarAtividadesRecentes();
    
    
    configurarModalAdmin();
    
    
    aplicarMascaras();
    
    
    const botaoLogout = document.getElementById('botao-logout');
    if (botaoLogout) {
        botaoLogout.addEventListener('click', realizarLogout);
    }
    
    
    const botaoAlternarSenha = document.getElementById('alternar-senha');
    if (botaoAlternarSenha) {
        botaoAlternarSenha.addEventListener('click', function() {
            const campoSenha = document.getElementById('senhaAdmin');
            if (campoSenha) {
                if (campoSenha.type === 'password') {
                    campoSenha.type = 'text';
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    campoSenha.type = 'password';
                    this.innerHTML = '<i class="fas fa-eye"></i>';
                }
            }
        });
    }
    
    
    const botaoAlternarConfirmSenha = document.getElementById('alternar-confirm-senha');
    if (botaoAlternarConfirmSenha) {
        botaoAlternarConfirmSenha.addEventListener('click', function() {
            const campoConfirmSenha = document.getElementById('confirmarSenhaAdmin');
            if (campoConfirmSenha) {
                if (campoConfirmSenha.type === 'password') {
                    campoConfirmSenha.type = 'text';
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    campoConfirmSenha.type = 'password';
                    this.innerHTML = '<i class="fas fa-eye"></i>';
                }
            }
        });
    }
}


function configurarModalAdmin(): void {
    
    const formAdmin = document.getElementById('formAdmin');
    if (formAdmin) {
        formAdmin.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validarFormularioAdministrador()) {
                
                this.submit();
            }
        });
    }
    
    
    const modalAdmin = document.getElementById('modalAdmin');
    if (modalAdmin) {
        modalAdmin.addEventListener('hidden.bs.modal', function() {
            
            formAdmin.reset();
            
            
            document.querySelectorAll('.is-invalid').forEach(campo => {
                campo.classList.remove('is-invalid');
            });
        });
    }
}


document.addEventListener('DOMContentLoaded', function() {
    inicializarDashboard();
});