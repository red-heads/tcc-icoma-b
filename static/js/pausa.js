const tempoPausa = document.getElementById("tempo-pausa");
const botaoIniciar = document.getElementById("iniciar-pausa");

let tempoRestante = 60;
let cronometroPausa = null;

function atualizarTempoPausa() {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;

    tempoPausa.textContent =
        String(minutos).padStart(2, "0") +
        ":" +
        String(segundos).padStart(2, "0");
}

function iniciarPausa() {

    if (cronometroPausa !== null) {
        return;
    }

    botaoIniciar.textContent = "Pausar";

    cronometroPausa = setInterval(function () {

        if (tempoRestante > 0) {
            tempoRestante--;
            atualizarTempoPausa();
        } else {
            clearInterval(cronometroPausa);
            cronometroPausa = null;

            tempoPausa.textContent = "Concluído!";
            botaoIniciar.textContent = "Reiniciar";
        }

    }, 1000);
}

botaoIniciar.addEventListener("click", function () {

    if (tempoRestante === 0) {
        tempoRestante = 60;
        atualizarTempoPausa();
        botaoIniciar.textContent = "Iniciar";
        return;
    }

    if (cronometroPausa !== null) {
        clearInterval(cronometroPausa);
        cronometroPausa = null;
        botaoIniciar.textContent = "Continuar";
    } else {
        iniciarPausa();
    }

});

atualizarTempoPausa();

const botaoAbrirExplicacao = document.getElementById("abrir-explicacao-pausa");
const botaoFecharExplicacao = document.getElementById("fechar-explicacao-pausa");
const explicacaoPausa = document.getElementById("explicacao-pausa");

botaoAbrirExplicacao.addEventListener("click", function () {
    explicacaoPausa.classList.add("ativa");
});

botaoFecharExplicacao.addEventListener("click", function () {
    explicacaoPausa.classList.remove("ativa");
});