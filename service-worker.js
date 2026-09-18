// ===== Service Worker - שלב 17 (PWA) =====
// המטרה היחידה של הקובץ הזה: לאפשר לאפליקציה להיטען גם בלי חיבור אינטרנט,
// ע"י שמירת קבצי האפליקציה עצמם (app shell) ב-cache של הדפדפן.
// הוא לא נוגע בשום נתון, לא ב-localStorage, ולא בשום חישוב - הוא רק "שומע" בקשות
// טעינה של קבצים (fetch) ומחליט אם להגיש אותם מה-cache או מהרשת.

// שם ה-cache כולל מספר גרסה - כשנעדכן את האפליקציה בעתיד, פשוט נעלה את המספר,
// וה-activate למטה ידע למחוק את ה-cache הישן אוטומטית.
const CACHE_NAME = "budget-app-cache-v1";

// כל קבצי האפליקציה עצמה (app shell) - בדיוק הקבצים שקיימים בפרויקט.
// הנתיבים יחסיים (בלי "/" בהתחלה) כדי שזה יעבוד גם אם האפליקציה מוגשת מתוך
// תת-תיקייה ולא מ-root של דומיין.
const APP_SHELL_FILES = [
  "./",
  "index.html",
  "style.css",
  "script.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

// כשה-Service Worker מותקן בפעם הראשונה: שומרת את כל קבצי האפליקציה ב-cache
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL_FILES);
    })
  );
});

// כשה-Service Worker מופעל: מוחקת כל cache ישן ששייך לגרסה קודמת של האפליקציה
// (לא נוגעת ב-localStorage - זה מנגנון אחסון נפרד לגמרי)
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) {
            return name !== CACHE_NAME;
          })
          .map(function (name) {
            return caches.delete(name);
          })
      );
    })
  );
});

// אסטרטגיית ה-caching: "cache-first" עבור קבצי האפליקציה שלנו -
// פשוט וברור: אם הקובץ שמור אצלנו - מגישים אותו מיד מה-cache (מהיר, ועובד גם offline).
// אם לא - מנסים מהרשת, ואם מצליח שומרים אותו ל-cache לפעם הבאה.
// אם אין רשת ואין cache לבקשת ניווט (פתיחת עמוד) - מגישים את index.html כגיבוי,
// כדי שהאפליקציה עדיין תיפתח.
self.addEventListener("fetch", function (event) {
  const request = event.request;

  // מתעסקים רק בבקשות GET מהאתר שלנו עצמו - לא בבקשות חוצות-מקור
  // (כמו גופן Rubik מ-Google Fonts) ולא בבקשות שאינן GET.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(function (networkResponse) {
          return caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(function () {
          if (request.mode === "navigate") {
            return caches.match("index.html");
          }
        });
    })
  );
});
