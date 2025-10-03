
      /*
        🧠 LÓGICA DEL JUEGO (JAVASCRIPT)
        - Variables globales para controlar el estado del juego.
        - Funciones modulares para generar problemas, verificar respuestas, etc.
        - Uso de localStorage para guardar el récord del jugador.
        - Sonidos generados con Web Audio API (sin archivos externos).
      */

      let score = 0; // Puntuación actual (posiciones avanzadas)
      let vidas = 3; // Vidas restantes
      const totalToWin = 5; // Número de aciertos para ganar
      let currentAnswer = 0; // Respuesta correcta de la operación actual
      let currentA = 0,
        currentB = 0,
        currentOp = ""; // Operandos y operador
      let timer; // Referencia al temporizador
      // Récord guardado en el navegador del usuario
      let maxScore = localStorage.getItem("mathRaceRecord")
        ? parseInt(localStorage.getItem("mathRaceRecord"))
        : 0;

      // Operaciones matemáticas permitidas
      const operations = ["+", "-", "*", "/"];

      // Genera un número entero aleatorio entre min y max (inclusive)
      function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }

      /*
        🔊 FUNCIÓN DE SONIDO
        - Usa la Web Audio API para generar tonos sin archivos externos.
        - Tono agudo al acertar, grave al equivocarse.
        - try/catch evita errores en navegadores que no soportan AudioContext.
      */
      function playSound(type) {
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          if (type === "correct") {
            osc.frequency.value = 523.25; // Nota Do (agudo)
          } else {
            osc.frequency.value = 349.23; // Nota Fa (grave)
          }
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.start();
          osc.stop(ctx.currentTime + 0.3);
        } catch (e) {}
      }

      /*
        🧮 GENERAR PROBLEMA MATEMÁTICO
        - Elige una operación aleatoria.
        - Genera números según la operación para evitar resultados negativos o decimales (excepto en división exacta).
        - Guarda los valores para usarlos en pistas y verificación.
      */
      function generateProblem() {
        const op = operations[getRandomInt(0, 3)];
        let a, b, result;

        if (op === "+") {
          a = getRandomInt(1, 50);
          b = getRandomInt(1, 50);
          result = a + b;
        } else if (op === "-") {
          a = getRandomInt(10, 100);
          b = getRandomInt(1, a - 1);
          result = a - b;
        } else if (op === "*") {
          a = getRandomInt(1, 12);
          b = getRandomInt(1, 12);
          result = a * b;
        } else if (op === "/") {
          b = getRandomInt(1, 12);
          result = getRandomInt(1, 12);
          a = b * result; // Asegura división exacta
        }

        currentAnswer = result;
        currentA = a;
        currentB = b;
        currentOp = op;
        document.getElementById(
          "problem"
        ).innerHTML = `<h2>¿Cuánto es ${a} ${op} ${b}?</h2>`;
      }

      /*
        🎯 GENERAR OPCIONES DE RESPUESTA
        - Crea 3 respuestas incorrectas cercanas a la correcta.
        - Mezcla las 4 opciones (3 incorrectas + 1 correcta) para evitar patrones.
        - Cada botón llama a checkAnswer al hacer clic.
      */
      function generateOptions() {
        const optionsContainer = document.getElementById("options");
        optionsContainer.innerHTML = "";

        const wrongAnswers = new Set();
        while (wrongAnswers.size < 3) {
          let wrong;
          if (currentAnswer <= 10) {
            wrong = currentAnswer + getRandomInt(-5, 5);
          } else {
            wrong = currentAnswer + getRandomInt(-10, 10);
          }
          if (wrong !== currentAnswer && wrong >= 0) {
            wrongAnswers.add(wrong);
          }
        }

        const allAnswers = [...wrongAnswers, currentAnswer];
        // Mezclar aleatoriamente
        for (let i = allAnswers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
        }

        allAnswers.forEach((ans) => {
          const btn = document.createElement("button");
          btn.textContent = ans;
          btn.onclick = () => checkAnswer(ans);
          optionsContainer.appendChild(btn);
        });
      }

      /*
        ⏱️ TEMPORIZADOR POR PREGUNTA
        - Cuenta regresiva de 10 segundos.
        - Si se agota, llama a handleTimeout().
      */
      function startTimer() {
        clearInterval(timer);
        let timeLeft = 10;
        document.getElementById("timer").textContent = `Tiempo: ${timeLeft}s`;
        timer = setInterval(() => {
          timeLeft--;
          document.getElementById("timer").textContent = `Tiempo: ${timeLeft}s`;
          if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeout();
          }
        }, 1000);
      }

      // Maneja el caso de tiempo agotado
      function handleTimeout() {
        document.getElementById("hint").textContent = "";
        document.getElementById("status").textContent =
          "¡Tiempo agotado! ⏳ Retrocedes.";
        processWrongAnswer();
      }

      /*
        ❌ PROCESAR RESPUESTA INCORRECTA
        - Reproduce sonido de error.
        - Reduce vidas y retrocede el carrito.
        - Muestra una pista educativa con la operación resuelta.
        - Si se pierden todas las vidas, muestra GAME OVER.
      */
      function processWrongAnswer() {
        playSound("error");
        vidas--;
        score = Math.max(0, score - 1);
        actualizarVidas();
        moveCar();

        // Generar pista educativa
        let pista = "";
        if (currentOp === "+")
          pista = `${currentA} + ${currentB} = ${currentA + currentB}`;
        else if (currentOp === "-")
          pista = `${currentA} - ${currentB} = ${currentA - currentB}`;
        else if (currentOp === "*")
          pista = `${currentA} × ${currentB} = ${currentA * currentB}`;
        else if (currentOp === "/")
          pista = `${currentA} ÷ ${currentB} = ${currentA / currentB}`;

        document.getElementById("hint").textContent = `💡 Pista: ${pista}`;

        if (vidas <= 0) {
          // Mostrar pantalla de GAME OVER
          document.getElementById("gameScreen").style.display = "none";
          document.getElementById("gameOverScreen").style.display = "flex";
          return;
        }

        // Reiniciar pregunta tras 2 segundos
        setTimeout(() => {
          startRound();
        }, 2000);
      }

      /*
        ✅ VERIFICAR RESPUESTA
        - Detiene el temporizador.
        - Si es correcta: avanza, reproduce sonido, verifica si ganó.
        - Si es incorrecta: llama a processWrongAnswer().
      */
      function checkAnswer(selected) {
        clearInterval(timer);
        document.getElementById("hint").textContent = "";

        if (selected === currentAnswer) {
          playSound("correct");
          score++;
          document.getElementById("status").textContent = "¡Correcto! 🎉";
          moveCar();

          // Verificar si ganó
          if (score >= totalToWin) {
            // Actualizar récord si es necesario
            if (score > maxScore) {
              maxScore = score;
              localStorage.setItem("mathRaceRecord", maxScore);
              document.getElementById(
                "record"
              ).textContent = `Récord: ${maxScore}`;
            }
            document.getElementById("status").textContent =
              "¡GANASTE! 🏆 Llegaste a la meta.";
            document.getElementById("options").innerHTML = "";
            document.getElementById("restartBtn").style.display =
              "inline-block";
            return;
          }

          // Nueva pregunta tras 0.8 segundos
          setTimeout(() => {
            startRound();
          }, 800);
        } else {
          document.getElementById("status").textContent =
            "Incorrecto. 😕 ¡Tu carrito retrocedió!";
          processWrongAnswer();
        }
      }

      /*
        🚗 MOVER EL CARRITO
        - Calcula la posición según el puntaje (0 a 5).
        - Usa transición suave para efecto visual.
      */
      function moveCar() {
        const car = document.getElementById("playerCar");
        const trackWidth = document.getElementById("raceTrack").clientWidth;
        const step = trackWidth / totalToWin;
        const position = Math.max(0, score) * step;
        car.style.left = position + "px";
      }

      // Actualiza los corazones de vidas en pantalla
      function actualizarVidas() {
        document.getElementById("vidas").innerHTML =
          "Vidas: " + "❤️".repeat(vidas);
      }

      // Inicia una nueva ronda: problema + opciones + temporizador
      function startRound() {
        generateProblem();
        generateOptions();
        document.getElementById("status").textContent = "";
        document.getElementById("hint").textContent = "";
        startTimer();
      }

      /*
        ▶️ INICIAR EL JUEGO
        - Oculta pantallas anteriores.
        - Muestra cuenta regresiva (3... 2... 1... ¡GO!).
        - Reinicia variables y comienza la primera ronda.
      */
      function startGame() {
        document.getElementById("startScreen").style.display = "none";
        document.getElementById("gameOverScreen").style.display = "none";
        document.getElementById("countdown").style.display = "flex";

        let count = 3;
        const countdownText = document.getElementById("countdownText");
        countdownText.textContent = count;
        countdownText.style.color = "yellow";

        const countdownInterval = setInterval(() => {
          count--;
          if (count > 0) {
            countdownText.textContent = count;
          } else if (count === 0) {
            countdownText.textContent = "¡GO!";
            countdownText.style.color = "#2ecc71";
            countdownText.style.fontSize = "6em";
          } else {
            clearInterval(countdownInterval);
            document.getElementById("countdown").style.display = "none";
            document.getElementById("gameScreen").style.display = "flex";

            // Reiniciar estado del juego
            score = 0;
            vidas = 3;
            actualizarVidas();
            moveCar();
            document.getElementById(
              "record"
            ).textContent = `Récord: ${maxScore}`;
            startRound();
          }
        }, 1000);
      }

      // Eventos de los botones
      document.getElementById("startBtn").onclick = startGame;
      document.getElementById("restartBtn").onclick = () => {
        document.getElementById("restartBtn").style.display = "none";
        startGame();
      };
      document.getElementById("gameOverBtn").onclick = startGame;

      // Mostrar récord al cargar la página
      document.getElementById("record").textContent = `Récord: ${maxScore}`;