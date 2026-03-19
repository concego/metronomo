// Inicializa o motor de áudio (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let acentoBuffer = null;
let tickBuffer = null;

// Pegando os elementos do formulário
const btnPlayStop = document.getElementById('btn-play-stop');
const inputBpm = document.getElementById('bpm');
const selectCompasso = document.getElementById('compasso');

// Variáveis de controle de tempo
let isPlaying = false;
let currentBeat = 0;
let nextNoteTime = 0.0;
let timerID;

// 1. Função que busca os arquivos na pasta "sons"
async function carregarSons() {
    try {
        // Carrega o acento
        const respAcento = await fetch('sons/acento.wav');
        const arrayAcento = await respAcento.arrayBuffer();
        acentoBuffer = await audioCtx.decodeAudioData(arrayAcento);

        // Carrega o tick normal
        const respTick = await fetch('sons/tick.wav');
        const arrayTick = await respTick.arrayBuffer();
        tickBuffer = await audioCtx.decodeAudioData(arrayTick);
        
        console.log("Sons carregados e prontos para o play!");
    } catch (erro) {
        console.error("Ops! Erro ao carregar os sons da pasta:", erro);
    }
}

// 2. Função que calcula qual o próximo som e quando ele deve tocar
function nextNote() {
    const segundosPorBatida = 60.0 / parseInt(inputBpm.value);
    nextNoteTime += segundosPorBatida;
    
    const temposNoCompasso = parseInt(selectCompasso.value);
    currentBeat++;
    
    // Se chegou no fim do compasso, zera para voltar ao tempo 1
    if (currentBeat >= temposNoCompasso) {
        currentBeat = 0;
    }
}

// 3. Função que "espeta" o som no motor de áudio na hora exata
function scheduleNote(beatNumber, time) {
    const source = audioCtx.createBufferSource();
    
    // Se for o tempo 0 (ou seja, o tempo 1 da música), toca o acento. Se não, toca o tick.
    if (beatNumber === 0) {
        source.buffer = acentoBuffer;
    } else {
        source.buffer = tickBuffer;
    }
    
    source.connect(audioCtx.destination);
    source.start(time);
}

// 4. O "Maestro": função que agenda os sons um pouquinho antes de tocarem para nunca atrasar
function scheduler() {
    while (nextNoteTime < audioCtx.currentTime + 0.1) {
        scheduleNote(currentBeat, nextNoteTime);
        nextNote();
    }
    timerID = setTimeout(scheduler, 25.0);
}

// 5. Ação do botão Play/Stop
btnPlayStop.addEventListener('click', () => {
    // Aquele truque para contornar o bloqueio do navegador!
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    isPlaying = !isPlaying;

    if (isPlaying) {
        // Começa a tocar
        currentBeat = 0;
        nextNoteTime = audioCtx.currentTime + 0.05; // Dá um respiro de 50ms antes do primeiro bip
        scheduler();
        
        // Atualiza a acessibilidade do botão
        btnPlayStop.textContent = 'Parar Metrônomo';
        btnPlayStop.setAttribute('aria-pressed', 'true');
    } else {
        // Para de tocar
        clearTimeout(timerID);
        
        // Volta o botão ao normal
        btnPlayStop.textContent = 'Tocar Metrônomo';
        btnPlayStop.setAttribute('aria-pressed', 'false');
    }
});

// Chama a função para carregar os sons assim que o script rodar
carregarSons();
// ==========================================
// SISTEMA DE REPERTÓRIO (localStorage)
// ==========================================

// Pegando os elementos da segunda parte do formulário
const inputNomeMusica = document.getElementById('nome-musica');
const btnSalvar = document.getElementById('btn-salvar');
const selectListaMusicas = document.getElementById('lista-musicas');
const btnCarregar = document.getElementById('btn-carregar');
const btnExcluir = document.getElementById('btn-excluir');

// Essa é a "chave" da gaveta onde vamos guardar tudo no navegador
const CHAVE_ARMAZENAMENTO = 'metronomo_repertorio';

// Função que lê a gaveta e cria as opções no menu suspenso (<select>)
function atualizarListaMusicas() {
    // Pega as músicas salvas ou cria uma lista vazia se não tiver nada
    const musicasSalvas = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO)) || [];
    
    // Zera a lista no HTML deixando só a instrução inicial
    selectListaMusicas.innerHTML = '<option value="">Selecione uma música...</option>';

    // Cria uma tag <option> para cada música salva
    musicasSalvas.forEach((musica, index) => {
        const option = document.createElement('option');
        option.value = index;
        // Monta o texto de um jeito bem descritivo pro leitor de telas ler tudo de uma vez
        option.textContent = `${musica.nome} - ${musica.bpm} BPM, Compasso ${musica.compasso}`;
        selectListaMusicas.appendChild(option);
    });
}

// Ação 1: Salvar a música
btnSalvar.addEventListener('click', () => {
    const nome = inputNomeMusica.value.trim(); // .trim() tira espaços em branco sobrando
    
    if (nome === "") {
        alert("Por favor, digite um nome para a música antes de salvar.");
        inputNomeMusica.focus();
        return; // Para a execução aqui se estiver vazio
    }

    // Cria o "pacote" com as informações atuais do formulário
    const novaMusica = {
        nome: nome,
        bpm: inputBpm.value,
        compasso: selectCompasso.value
    };

    // Abre a gaveta, coloca a música nova e fecha a gaveta
    const musicasSalvas = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO)) || [];
    musicasSalvas.push(novaMusica);
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(musicasSalvas));
    
    // Atualiza a interface
    atualizarListaMusicas();
    inputNomeMusica.value = ''; // Limpa o campo de texto
    
    // Dá o feedback acessível de sucesso
    alert(`A música ${nome} foi salva com sucesso no seu repertório!`);
});

// Ação 2: Carregar a música selecionada
btnCarregar.addEventListener('click', () => {
    const indexSelecionado = selectListaMusicas.value;
    
    if (indexSelecionado === "") {
        alert("Selecione uma música na lista primeiro.");
        selectListaMusicas.focus();
        return;
    }

    // Busca os dados da música escolhida
    const musicasSalvas = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO)) || [];
    const musica = musicasSalvas[indexSelecionado];

    // Atualiza os campos do metrônomo automaticamente
    inputBpm.value = musica.bpm;
    selectCompasso.value = musica.compasso;
    
    alert(`Configurações de ${musica.nome} carregadas prontas para tocar.`);
    
    // Joga o foco direto pro botão de Play para você já começar o ensaio
    btnPlayStop.focus(); 
});

// Ação 3: Excluir a música
btnExcluir.addEventListener('click', () => {
    const indexSelecionado = selectListaMusicas.value;
    
    if (indexSelecionado === "") {
        alert("Selecione uma música na lista para excluir.");
        return;
    }

    let musicasSalvas = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO)) || [];
    const nomeExcluido = musicasSalvas[indexSelecionado].nome;
    
    // Remove o item da lista pela posição (index)
    musicasSalvas.splice(indexSelecionado, 1);
    
    // Salva a lista atualizada de volta na gaveta
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(musicasSalvas));
    
    atualizarListaMusicas();
    alert(`A música ${nomeExcluido} foi apagada.`);
    selectListaMusicas.focus(); // Devolve o foco pra lista
});

// Executa essa função logo de cara para preencher o select caso você já tenha salvo algo antes
atualizarListaMusicas();
// ==========================================
// REGISTRO DO SERVICE WORKER (PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registro) => {
                console.log('Service Worker registrado com sucesso:', registro);
            })
            .catch((erro) => {
                console.log('Erro ao registrar o Service Worker:', erro);
            });
    });
}