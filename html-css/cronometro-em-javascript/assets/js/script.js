
const time = document.querySelector(".time");
const btn_play = document.querySelector(".start-pouse");
const btn_play_icon = document.querySelector(".start-pouse > .icon");
const btn_stop = document.querySelector(".stop");

// Variavel do intervalos
let time_inter = null;
// Varerial para saber qual é o status do cronometro, se está rodando ou parado.
let is_playing = false;
// Variaveis para armazenar os valor horas, minutos e segundos.
let s = 0, m = 0, h = 0;

btn_play.addEventListener("click", function() {
    if (time_inter == null) {
        startCrono();
    }else {
        playCrono();
    }
});

btn_stop.addEventListener("click", function() {
    stopCrono();
});

function startCrono() {
    playCrono();

    time_inter = setInterval(() => {
        
        if (is_playing) {
            if (s < 59) {
                s++;
            }else if (m < 59) {
                s = 0;
                m++;
            }else {
                s = 0;
                m = 0;
                h++;
            }

            time.innerText=zeroEsquerda(h) + ":" + zeroEsquerda(m) + ":" + zeroEsquerda(s);
        }

    }, 1000 * 1);
}

function playCrono() {
    // Fuinção pause e play
    if (is_playing) {
        is_playing = false;
        btn_play_icon.classList.replace("fa-pause", "fa-play");
    }else {
        is_playing = true;
        btn_play_icon.classList.replace("fa-play", "fa-pause");
    }
}

function stopCrono() {
    // Aqui zera todas as variaveis e seta todos elementos para o padrão
    s = 0;
    m = 0;
    h = 0;

    time.innerText="00:00:00";

    is_playing = false;

    clearInterval(time_inter);
    time_inter = null;

    btn_play_icon.classList.replace("fa-pause", "fa-play");
}

function zeroEsquerda(n) {
    // Adiciona zero a esquerda de números que seja menor do que 10 (dez)
    // Exemplo: 5 passa a ser 05 e 8 passa a ser 08, e assim por diante.
    if (n < 10) {
        n = 0 +""+ n;
        return n;
    }else {
        return n;
    }
}