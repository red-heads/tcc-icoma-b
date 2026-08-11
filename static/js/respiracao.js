const botaoIniciar = document.getElementById("iniciar-respiracao");
const botaoPausar = document.getElementById("pausar-respiracao");
const botaoReiniciar = document.getElementById("reiniciar-respiracao");

const textoRespiracao = document.getElementById("texto-respiracao");
const tempoRespiracao = document.getElementById("tempo-respiracao");
const progressoRespiracao = document.getElementById("progresso-respiracao");
const circuloRespiracao = document.getElementById("circulo-respiracao");

const duracaoTotal = 60;

let segundosRestantes = duracaoTotal;
let cronometro = null;
let exercicioPausado = false;

function atualizarTela() {
    const minutos = Math.floor(segundosRestantes / 60);
    const segundos = segundosRestantes % 60;

    tempoRespiracao.textContent =
        `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

    const porcentagemConcluida =
        ((duracaoTotal - segundosRestantes) / duracaoTotal) * 100;

    progressoRespiracao.style.width = `${porcentagemConcluida}%`;
}

function atualizarRespiracao() {
    const segundosPassados = duracaoTotal - segundosRestantes;
    const etapa = segundosPassados % 8;

    if (etapa < 4) {
        textoRespiracao.textContent = "Inspire...";
        textoRespiracao.classList.remove("concluido");
        
        circuloRespiracao.classList.add("inspirando");
        circuloRespiracao.classList.remove("expirando");
    } else {
        textoRespiracao.textContent = "Expire...";
        circuloRespiracao.classList.add("expirando");
        circuloRespiracao.classList.remove("inspirando");
    }
}

function iniciarExercicio() {
    if (cronometro !== null) {
        return;
    }

    exercicioPausado = false;
    atualizarRespiracao();

    cronometro = setInterval(() => {
        if (segundosRestantes > 0) {
            segundosRestantes--;

            atualizarTela();
            atualizarRespiracao();
        } else {
            clearInterval(cronometro);
            cronometro = null;

            textoRespiracao.textContent = "Exercício concluído!";
            textoRespiracao.classList.add("concluido");

            circuloRespiracao.classList.remove("inspirando", "expirando");
        }
    }, 1000);
}

function pausarExercicio() {
    if (cronometro !== null) {
        clearInterval(cronometro);
        cronometro = null;

        exercicioPausado = true;
        textoRespiracao.textContent = "Pausado";
        circuloRespiracao.classList.remove("inspirando", "expirando");
    }
}

function reiniciarExercicio() {
    clearInterval(cronometro);
    cronometro = null;

    segundosRestantes = duracaoTotal;
    exercicioPausado = false;

    textoRespiracao.textContent = "Inspire...";
    textoRespiracao.classList.remove("concluido");
    
    circuloRespiracao.classList.remove("inspirando", "expirando");

    atualizarTela();
}

botaoIniciar.addEventListener("click", iniciarExercicio);
botaoPausar.addEventListener("click", pausarExercicio);
botaoReiniciar.addEventListener("click", reiniciarExercicio);

atualizarTela();