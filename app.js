// ==========================================
// CONFIGURAÇÃO DE ÁUDIO (Web Audio API)
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const buffers = {}; // Onde vamos guardar os sons carregados

// Função para buscar o arquivo de áudio e decodificar
async function carregarSom(nome, caminho) {
    try {
        const response = await fetch(caminho);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        buffers[nome] = audioBuffer;
    } catch (erro) {
        console.error(`Erro ao carregar o som ${nome}:`, erro);
    }
}

// Carregando todos os sons (Padrão e Novos)
carregarSom('padrao-acento', 'sons/acento.wav');
carregarSom('padrao-tick', 'sons/tick.wav');
carregarSom('novo-acento', 'sons/acento1.wav');
carregarSom('novo-tick', 'sons/tick1.wav');

// Elementos da Interface
const inputBpm = document.getElementById('bpm');
const selectCompasso = document.getElementById('compasso');
const btnPlayStop = document.getElementById('btn-play-stop');
const selectTipoSom = document.getElementById('tipo-som');

let isPlaying = false;
let tempoAtual = 0;
let proximoTempoDeNota = 0.0;
let timerID;

// Lógica para agendar os bipes
function agendarNota(numeroDaBatida, tempo) {
    const oscilador = audioCtx.createBufferSource();
    
    // Define qual som usar (Acento ou Tick) e de qual família (Padrão ou Novo)
    const familiaSom = selectTipoSom.value; // Pega o valor do select ('padrao' ou 'novo')
    const tipoBatida = (numeroDaBatida === 0 && parseInt(selectCompasso.value) > 1) ? 'acento' : 'tick';
    
    // Toca o som correto baseado nas escolhas
    oscilador.buffer = buffers[`${familiaSom}-${tipoBatida}`];
    
    oscilador.connect(audioCtx.destination);
    oscilador.start(tempo);
}

function proximaNota() {
    const segundosPorBatida = 60.0 / parseInt(inputBpm.value);
    proximoTempoDeNota += segundosPorBatida;
    
    tempoAtual++;
    if (tempoAtual >= parseInt(selectCompasso.value)) {
        tempoAtual = 0;
    }
}

function escalonador() {
    while (proximoTempoDeNota < audioCtx.currentTime + 0.1) {
        agendarNota(tempoAtual, proximoTempoDeNota);
        proximaNota();
    }
    timerID = window.setTimeout(escalonador, 25.0);
}

// Botão de Play/Stop
btnPlayStop.addEventListener('click', () => {
    if (isPlaying) {
        window.clearTimeout(timerID);
        isPlaying = false;
        btnPlayStop.textContent = "Tocar Metrônomo";
    } else {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        tempoAtual = 0;
        proximoTempoDeNota = audioCtx.currentTime + 0.05;
        escalonador();
        isPlaying = true;
        btnPlayStop.textContent = "Parar Metrônomo";
    }
});

// ==========================================
// SISTEMA DE REPERTÓRIO E BOTÃO LIMPAR
// ==========================================
const inputNomeMusica = document.getElementById('nome-musica');
const btnSalvar = document.getElementById('btn-salvar');
const selectListaMusicas = document.getElementById('lista-musicas');
const btnCarregar = document.getElementById('btn-carregar');
const btnExcluir = document.getElementById('btn-excluir');
const btnLimpar = document.getElementById('btn-limpar');
const CHAVE_ARMAZENAMENTO = 'metronomo_repertorio';

function atualizarListaMusicas() {
    const musicasSalvas = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO)) || [];
    selectListaMusicas.innerHTML = '<option value="">Selecione uma música...</option>';
    musicasSalvas.forEach((musica, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${musica.nome} - ${musica.bpm} BPM, Compasso ${musica.compasso}`;
        selectListaMusicas.appendChild(option);
    });
}

btnSalvar.addEventListener('click', () => {
    const nome = inputNomeMusica.value.trim();
    if (nome === "") {
        alert("Por favor, digite um nome para a música antes de salvar.");
        inputNomeMusica.focus();
        return;
    }
    const novaMusica = {
        nome: nome,
        bpm: inputBpm.value,
        compasso: selectCompasso.value,
        timbre: selectTipoSom.value // Agora salvamos o timbre escolhido também!
    };
    const musicasSalvas = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO)) || [];
    musicasSalvas.push(novaMusica);
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(musicasSalvas));
    atualizarListaMusicas();
    inputNomeMusica.value = '';
    alert(`A música ${nome} foi salva com sucesso!`);
});

btnCarregar.addEventListener('click', () => {
    const indexSelecionado = selectListaMusicas.value;
    if (indexSelecionado === "") {
        alert("Selecione uma música na lista primeiro.");
        selectListaMusicas.focus();
        return;
    }
    const musicasSalvas = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO)) || [];
    const musica = musicasSalvas[indexSelecionado];
    inputBpm.value = musica.bpm;
    selectCompasso.value = musica.compasso;
    
    // Se a música antiga não tinha timbre salvo, cai no padrão
    selectTipoSom.value = musica.timbre ? musica.timbre : 'padrao'; 
    
    alert(`Configurações carregadas.`);
    btnPlayStop.focus(); 
});

btnExcluir.addEventListener('click', () => {
    const indexSelecionado = selectListaMusicas.value;
    if (indexSelecionado === "") {
        alert("Selecione uma música para excluir.");
        return;
    }
    let musicasSalvas = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO)) || [];
    const nomeExcluido = musicasSalvas[indexSelecionado].nome;
    musicasSalvas.splice(indexSelecionado, 1);
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(musicasSalvas));
    atualizarListaMusicas();
    alert(`Música ${nomeExcluido} apagada.`);
    selectListaMusicas.focus();
});

// A Função nova que a Adri pediu
btnLimpar.addEventListener('click', () => {
    inputNomeMusica.value = '';
    inputBpm.value = '120';
    selectCompasso.value = '4';
    selectTipoSom.value = 'padrao';
    selectListaMusicas.value = '';
    
    alert("Campos limpos. Metrônomo resetado para os valores iniciais.");
    inputBpm.focus(); // Joga o leitor de telas pro topo do formulário
});

atualizarListaMusicas();

// ==========================================
// REGISTRO DO SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registro) => { console.log('SW registrado'); })
            .catch((erro) => { console.log('Erro no SW:', erro); });
    });
}