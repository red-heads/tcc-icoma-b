const trilhoVideos = document.getElementById("trilho-videos");
const botaoAnterior = document.getElementById("botao-anterior");
const botaoProximo = document.getElementById("botao-proximo");
const indicadores = document.querySelectorAll(".indicador");

let slideAtual = 0;
const quantidadeSlides = indicadores.length;

function mostrarSlide(numeroDoSlide) {
    if (numeroDoSlide < 0) {
        slideAtual = quantidadeSlides - 1;
    } else if (numeroDoSlide >= quantidadeSlides) {
        slideAtual = 0;
    } else {
        slideAtual = numeroDoSlide;
    }

    trilhoVideos.style.transform = `translateX(-${slideAtual * 100}%)`;

    indicadores.forEach((indicador, indice) => {
        indicador.classList.toggle("ativo", indice === slideAtual);
    });
}

botaoProximo.addEventListener("click", () => {
    mostrarSlide(slideAtual + 1);
});

botaoAnterior.addEventListener("click", () => {
    mostrarSlide(slideAtual - 1);
});

indicadores.forEach((indicador) => {
    indicador.addEventListener("click", () => {
        const numeroDoSlide = Number(indicador.dataset.slide);
        mostrarSlide(numeroDoSlide);
    });
});

const botaoAbrirModal = document.getElementById("abrir-modal");
const botaoFecharModal = document.getElementById("fechar-modal");
const botaoEntendiModal = document.getElementById("entendi-modal");
const modalSaibaMais = document.getElementById("modal-saiba-mais");

botaoAbrirModal.addEventListener("click", function () {
    modalSaibaMais.style.display = "flex";
});

botaoFecharModal.addEventListener("click", function () {
    modalSaibaMais.style.display = "none";
});

botaoEntendiModal.addEventListener("click", function () {
    modalSaibaMais.style.display = "none";
});