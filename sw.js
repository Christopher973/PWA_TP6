// Nom du cache pour la PWA
const CACHE_NAME = "pwa-timer-cache-v1";

// Liste des ressources à mettre en cache lors de l'installation
const CACHED_ASSETS = [
  "/",
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  // "/images/icon-72x72.png",
  // "/images/icon-96x96.png",
  // "/images/icon-128x128.png",
  // "/images/icon-144x144.png",
  // "/images/icon-152x152.png",
  // "/images/icon-192x192.png",
  // "/images/icon-384x384.png",
  // "/images/icon-512x512.png",
  // "/images/maskable_icon.png",
];

// Variables pour la gestion du timer
let timerInterval = null;
let remainingTime = 0;
let isTimerActive = false;

// Événement d'installation du Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installation");

  // Mise en cache des ressources lors de l'installation
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Mise en cache des ressources");
        return cache.addAll(CACHED_ASSETS);
      })
      .then(() => {
        // Activer immédiatement le Service Worker sans attendre
        // la fermeture des anciennes instances
        return self.skipWaiting();
      })
  );
});

// Événement d'activation du Service Worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activation");

  // Nettoyage des anciens caches
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(
                "[Service Worker] Suppression de l'ancien cache:",
                cacheName
              );
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Prendre le contrôle de toutes les pages clientes immédiatement
        return self.clients.claim();
      })
  );
});

// Gestion des requêtes réseau
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retourner la ressource mise en cache si elle existe
      if (response) {
        return response;
      }

      // Sinon, faire la requête au réseau
      return fetch(event.request)
        .then((networkResponse) => {
          // Ne pas mettre en cache les réponses d'API ou les requêtes dynamiques
          if (
            !event.request.url.startsWith("http") ||
            event.request.method !== "GET"
          ) {
            return networkResponse;
          }

          // Mettre en cache la nouvelle ressource
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.error("[Service Worker] Erreur de fetch:", error);
          // Possibilité d'ajouter une gestion des ressources non disponibles
        });
    })
  );
});

// Gestion des messages reçus de l'application
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Message reçu:", event.data);

  if (event.data.action === "startTimer") {
    startTimer(event.data.duration, event.source);
  } else if (event.data.action === "stopTimer") {
    stopTimer();
  }
});

// Fonction pour démarrer le timer
function startTimer(duration, client) {
  // Arrêter le timer existant s'il y en a un
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  // Initialiser le timer
  remainingTime = duration;
  isTimerActive = true;

  // Calculer les minutes et secondes initiales
  let minutes = Math.floor(remainingTime / 60);
  let seconds = remainingTime % 60;

  // Envoyer l'état initial du timer au client
  if (client) {
    client.postMessage({
      type: "timerUpdate",
      minutes: minutes,
      seconds: seconds,
    });
  }

  // Démarrer l'intervalle pour le compte à rebours
  timerInterval = setInterval(() => {
    remainingTime--;

    if (remainingTime <= 0) {
      // Le timer est terminé
      stopTimer();
      showNotification();

      // Informer le client que le timer est terminé
      notifyAllClients({
        type: "timerEnded",
      });
    } else {
      // Calculer les minutes et secondes restantes
      minutes = Math.floor(remainingTime / 60);
      seconds = remainingTime % 60;

      // Envoyer la mise à jour du timer à tous les clients
      notifyAllClients({
        type: "timerUpdate",
        minutes: minutes,
        seconds: seconds,
      });
    }
  }, 1000);
}

// Fonction pour arrêter le timer
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  isTimerActive = false;
}

// Fonction pour afficher une notification
function showNotification() {
  // Vérifier si on peut utiliser la registration
  if (!self.registration) {
    console.error(
      "[Service Worker] Registration non disponible pour les notifications"
    );
    return;
  }

  const notificationOptions = {
    body: "Votre minuteur est terminé !",
    // icon: "/images/icon-192x192.png",
    // badge: "/images/icon-72x72.png",
    vibrate: [100, 50, 100, 50, 100],
    tag: "timer-notification", // Permet de regrouper les notifications similaires
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Ouvrir l'app",
        // icon: "/images/icon-72x72.png",
      },
    ],
  };

  self.registration.showNotification("PWA Timer", notificationOptions);
}

// Gestion des clics sur les notifications
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification cliquée", event);

  // Fermer la notification
  event.notification.close();

  // Gérer l'action de la notification
  if (event.action === "explore") {
    // Ouvrir ou focaliser sur l'application
    event.waitUntil(
      self.clients.matchAll({ type: "window" }).then((clientList) => {
        // Si une fenêtre est déjà ouverte, la focaliser
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Sinon ouvrir une nouvelle fenêtre
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
    );
  }
});

// Fonction pour envoyer un message à tous les clients connectés
async function notifyAllClients(message) {
  const allClients = await self.clients.matchAll({ includeUncontrolled: true });
  for (const client of allClients) {
    client.postMessage(message);
  }
}
