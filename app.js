// Variables globales pour la gestion de l'interface
const minutesElement = document.getElementById("minutes");
const secondsElement = document.getElementById("seconds");
const startButton = document.getElementById("startButton");
const stopButton = document.getElementById("stopButton");
const resetButton = document.getElementById("resetButton");
const timerMinutesInput = document.getElementById("timerMinutes");
const timerSecondsInput = document.getElementById("timerSeconds");
const requestPermissionButton = document.getElementById(
  "requestPermissionButton"
);
const permissionStatusElement = document.getElementById("permissionStatus");

// Variables globales pour la gestion du timer
let swRegistration = null;
let isTimerRunning = false;

// Fonction d'initialisation
function init() {
  registerServiceWorker();
  setupEventListeners();
  checkNotificationPermission();

  // Vérifier si le Service Worker est prêt et contrôle la page
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    // Service Worker déjà actif
    console.log("Service Worker prêt et contrôlant la page");
  } else {
    // Attendre l'activation du Service Worker
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("Service Worker prend le contrôle de la page");
      // Optionnellement, recharger pour s'assurer que tout fonctionne
      // window.location.reload();
    });
  }
}

// Enregistrement du Service Worker
async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker enregistré:", swRegistration);

      // Configurer la communication avec le Service Worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("Message reçu du Service Worker:", event.data);

        // Si le message concerne le timer
        if (event.data.type === "timerUpdate") {
          updateTimerDisplay(event.data.minutes, event.data.seconds);
        } else if (event.data.type === "timerEnded") {
          resetTimerInterface();

          // Notification de secours si le Service Worker échoue à envoyer une notification
          if (Notification.permission === "granted") {
            try {
              new Notification("PWA Timer", {
                body: "Votre minuteur est terminé !",
                vibrate: [100, 50, 100, 50, 100],
              });
              console.log("Notification de secours affichée");
            } catch (error) {
              console.error("Échec de la notification de secours:", error);
            }
          }
        }
      });
    } catch (error) {
      console.error("Erreur d'enregistrement du Service Worker:", error);
    }
  } else {
    console.error(
      "Les Service Workers ne sont pas supportés par ce navigateur."
    );
  }
}

// Configuration des écouteurs d'événements
function setupEventListeners() {
  startButton.addEventListener("click", startTimer);
  stopButton.addEventListener("click", stopTimer);
  resetButton.addEventListener("click", resetTimer);
  requestPermissionButton.addEventListener(
    "click",
    requestNotificationPermission
  );
  document
    .getElementById("testNotificationButton")
    ?.addEventListener("click", testNotification);
}

// Fonction de test de notification
function testNotification() {
  if (Notification.permission !== "granted") {
    alert("Vous devez d'abord autoriser les notifications");
    return;
  }

  // Test de notification par le navigateur
  new Notification("Test Notification", {
    body: "Ceci est une notification de test depuis l'application",
  });

  // Test via le Service Worker
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      action: "testNotification",
    });
  }
}

// Vérification initiale des permissions de notification
function checkNotificationPermission() {
  if (!("Notification" in window)) {
    permissionStatusElement.textContent =
      "Status des permissions: Les notifications ne sont pas supportées";
    requestPermissionButton.disabled = true;
    return;
  }

  if (Notification.permission === "granted") {
    permissionStatusElement.textContent = "Status des permissions: Autorisées";
    requestPermissionButton.style.display = "none";
  } else if (Notification.permission === "denied") {
    permissionStatusElement.textContent = "Status des permissions: Refusées";
  } else {
    permissionStatusElement.textContent =
      "Status des permissions: Non demandées";
  }
}

// Demande de permission pour les notifications
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      permissionStatusElement.textContent =
        "Status des permissions: Autorisées";
      requestPermissionButton.style.display = "none";

      // Envoyer un message au Service Worker pour lui indiquer que les permissions sont accordées
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          action: "permissionGranted",
        });
      }

      return true;
    } else if (permission === "denied") {
      permissionStatusElement.textContent = "Status des permissions: Refusées";
      alert(
        "Sans autorisation des notifications, vous ne recevrez pas d'alerte à la fin du timer."
      );
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la demande de permission:", error);
    return false;
  }
}

// Démarrage du timer
async function startTimer() {
  // Récupération des valeurs de temps entrées par l'utilisateur
  const minutes = parseInt(timerMinutesInput.value) || 0;
  const seconds = parseInt(timerSecondsInput.value) || 0;

  // Vérification que le temps est supérieur à 0
  if (minutes === 0 && seconds === 0) {
    alert("Veuillez définir une durée pour le timer");
    return;
  }

  // Si le Service Worker n'est pas encore contrôleur, recharger la page
  if (!navigator.serviceWorker.controller) {
    alert("Service Worker en cours d'initialisation. La page va se recharger.");
    window.location.reload();
    return;
  }

  // Mise à jour de l'interface
  startButton.disabled = true;
  stopButton.disabled = false;
  timerMinutesInput.disabled = true;
  timerSecondsInput.disabled = true;
  isTimerRunning = true;

  // Conversion en secondes totales pour le Service Worker
  const totalSeconds = minutes * 60 + seconds;

  // Envoi du message au Service Worker pour démarrer le timer
  navigator.serviceWorker.controller.postMessage({
    action: "startTimer",
    duration: totalSeconds,
  });

  if (Notification.permission !== "granted") {
    const askPermission = confirm(
      "Pour recevoir une notification lorsque le timer est terminé, veuillez autoriser les notifications. Souhaitez-vous les activer maintenant?"
    );
    if (askPermission) {
      await requestNotificationPermission();
    }
  }

  // Mise à jour initiale de l'affichage
  updateTimerDisplay(minutes, seconds);
}

// Arrêt du timer
function stopTimer() {
  if (!swRegistration || !navigator.serviceWorker.controller) {
    return;
  }

  // Envoi du message au Service Worker pour arrêter le timer
  navigator.serviceWorker.controller.postMessage({
    action: "stopTimer",
  });

  // Mise à jour de l'interface
  resetTimerInterface();
}

// Réinitialisation du timer
function resetTimer() {
  if (isTimerRunning) {
    stopTimer();
  }

  // Réinitialisation des champs de saisie
  timerMinutesInput.value = 0;
  timerSecondsInput.value = 10;

  // Mise à jour de l'affichage
  updateTimerDisplay(0, 0);
}

// Mise à jour de l'affichage du timer
function updateTimerDisplay(minutes, seconds) {
  minutesElement.textContent = String(minutes).padStart(2, "0");
  secondsElement.textContent = String(seconds).padStart(2, "0");
}

// Réinitialisation de l'interface du timer
function resetTimerInterface() {
  startButton.disabled = false;
  stopButton.disabled = true;
  timerMinutesInput.disabled = false;
  timerSecondsInput.disabled = false;
  isTimerRunning = false;
}

// Lancement de l'initialisation au chargement de la page
window.addEventListener("load", init);
