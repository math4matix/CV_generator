# Generator CV i Dokumentów PDF

Aplikacja internetowa umożliwiająca dynamiczne generowanie, zarządzanie oraz personalizację profesjonalnego CV w formacie PDF za pomocą listy opcji i dedykowanych formularzy.

---

##  Główne Funkcje

* **Dynamiczna generacja PDF:** Tworzenie i dostosowywanie dokumentów PDF przy użyciu list wybieranych (drop-down).
* **Obsługa języka angielskiego:** Możliwość automatycznego lub ręcznego tłumaczenia sekcji CV na język angielski.
* **Klauzula RODO:** Opcja łatwego dołączenia aktualnej zgody na przetwarzanie danych osobowych w stopce dokumentu.
* **Pełny profil kandydata:** Wprowadzanie i prezentacja danych osobowych, zdjęcia, danych kontaktowych, sekcji certyfikatów oraz odnośników do portfeli/profesjonalnych mediów społecznościowych (LinkedIn, GitHub, Portfolio).
* **Aktualizacja danych:** Wygodne zarządzanie i rozbudowa bazy CV o nowe wpisy (doświadczenie, certyfikaty itp.).

### Funkcje dostępne w prototypie

* Edytor CV na stronie głównej z formularzem po lewej i wyborem szablonów oraz podglądem po prawej.
* Tłumaczenie wybranych pól CV na angielski przez DeepL API Free; nagłówki sekcji są tłumaczone lokalnie. Oryginalny formularz pozostaje bez zmian.
* Wybór jednego z trzech przykładowych szablonów CV; podgląd pierwszego szablonu ładuje się automatycznie.
* Drukowanie wybranego szablonu lub zapis do PDF z poziomu okna drukowania przeglądarki.
* Zapis formularza CV do pliku JSON, w tym zdjęcia i załączników certyfikatów.
* Otwieranie zapisanego pliku CV i automatyczne uzupełnianie formularza, także sekcji dodawanych dynamicznie.
* Podgląd aktualizuje się w czasie rzeczywistym na podstawie danych z formularza, w tym sekcji dodawanych dynamicznie i zdjęcia.
* Zawartość CV skaluje się tak, aby mieściła się na jednej stronie A4, również podczas drukowania lub zapisu do PDF.

## Konfiguracja tłumaczenia DeepL na GitHub Pages

GitHub Pages udostępnia wyłącznie pliki statyczne, dlatego klucz DeepL nie może być umieszczony w `app.js`, HTML ani w repozytorium. Aplikacja używa Cloudflare Worker jako pośrednika; Worker wysyła wyłącznie wskazane teksty do DeepL, a zdjęcie i dane kontaktowe nie są tłumaczone ani wysyłane.

### 1. Uzyskaj klucz DeepL API Free

1. Utwórz konto DeepL API Free i skopiuj klucz uwierzytelniający API z ustawień konta.
2. Nie umieszczaj klucza w plikach projektu, GitHub Pages, issue ani publicznym repozytorium. Klucz Free korzysta z endpointu `https://api-free.deepl.com`.

### 2. Utwórz Cloudflare Worker

1. Zaloguj się do Cloudflare, otwórz **Workers & Pages** i utwórz Worker na planie Free (sprawdź aktualne limity planu).
2. W edytorze kodu Worker zastąp przykładową zawartość treścią pliku [`cloudflare/worker.js`](./cloudflare/worker.js), a następnie opublikuj Worker.
3. W ustawieniach Worker dodaj sekret `DEEPL_API_KEY` z kluczem DeepL oraz zmienną tekstową `ALLOWED_ORIGINS`. Wartość dla tego repozytorium to `https://math4matix.github.io`; podczas lokalnego testowania możesz dodać przecinkiem `http://localhost:8000`. Jeżeli używasz własnej domeny, dodaj jej origin (protokół i domena, bez ścieżki).
   Originy GitHub Codespaces są obsługiwane przez przykładowego Workera automatycznie dla adresów `https://*.app.github.dev`.
4. Zapisz zmienne i ponownie opublikuj Worker. Skopiuj jego publiczny adres URL.
5. Jeśli panel Cloudflare udostępnia reguły limitowania żądań Workerów na Twoim planie, skonfiguruj limit dla endpointu. Lista dozwolonych originów CORS ogranicza wywołania z przeglądarek, ale sama w sobie nie blokuje bezpośrednich żądań spoza przeglądarki. Monitoruj zużycie limitu DeepL.

### 3. Podłącz Worker do strony

W [`index.html`](./index.html) wstaw skopiowany URL Worker jako wartość `content` w metadanej:

```html
<meta name="translation-endpoint" content="https://TWOJ-WORKER.TWOJE-KONTO.workers.dev">
```

Zapisz i wypchnij zmiany do gałęzi publikowanej przez GitHub Pages. W repozytorium sprawdź **Settings → Pages**, aby potwierdzić adres strony. Origin strony (bez ścieżki `/CV_generator`) musi dokładnie odpowiadać jednej z wartości `ALLOWED_ORIGINS`.

### 4. Sprawdź działanie

1. Uruchom stronę przez lokalny serwer HTTP, np. `python -m http.server 8000`; nie otwieraj jej przez `file://`.
2. Dodaj przykładowy opis i wybierz **Tłumacz CV na angielski**. Sprawdź nagłówki, przetłumaczone pola, wydruk/PDF i przycisk **Pokaż oryginał**.
3. Sprawdź konsolę przeglądarki oraz status podglądu w razie błędu CORS, brakującego klucza lub przekroczenia limitu DeepL.
4. Przed udostępnieniem strony uzupełnij i zweryfikuj informacje w [`rodo.html`](./rodo.html), w szczególności administratora, podstawę prawną, umowy z dostawcami i ewentualne transfery danych.

DeepL API Free ma miesięczny limit znaków określony w aktualnym planie DeepL. Aplikacja wysyła tylko tekst, który użytkownik wybierze do przetłumaczenia; kliknięcie tłumaczenia przekazuje te treści do Cloudflare i DeepL. Nie używaj tej funkcji dla danych, których nie chcesz wysyłać do zewnętrznych usług.

---

##  Stack Techniczny

* **Frontend:** Vanilla JavaScript (Plain JS), HTML5
* **Style:** CSS (Bootstrap 5)
* **Generowanie i obsługa PDF:** `pdf-lib`, `pdf.js`
* **Baza danych:** SQLite
* **Hosting:** Darmowy hosting frontendowy (np. Netlify / Vercel)

---

##  Struktura Danych CV

Aplikacja zbiera i przetwarza dane podzielone na następujące sekcje:

### 1. Dane Osobowe i Kontaktowe
* Imię i Nazwisko
* Zdjęcie osobiste
* Adres e-mail
* Numer telefonu
* Adres zamieszkania
* Odnośniki do Mediów Społecznościowych (LinkedIn, GitHub) oraz Link do Portfolio

### 2. Edukacja
Lista placówek oświatowych zawierająca:
* Nazwę uczelni / szkoły
* Adres
* Kierunek / Specjalność
* Zakres dat (od – do)

### 3. Doświadczenie Zawodowe
Opis doświadczenia oparty na metodzie problemowo-zadaniowej (**Problem → Rozwiązanie → Skutek**):
* Poprzednie stanowiska pracy / praktyki / staże
* Szczęśliwy opis osiągnięć i rozwiązywanych problemów
* Daty (od – do) / okres trwania

### 4. Umiejętności
* Lista umiejętności twardych i miękkich.

### 5. Języki Obce
* Język
* Poziom zaawansowania (np. B2, C1)
* Dedykowany certyfikat językowy (jeśli dotyczy)

### 6. Certyfikaty i Szkolenia
* Nazwa certyfikatu
* Link / zdjęcie / dokument potwierdzający

### 7. Zainteresowania
* Lista pasji i zainteresowań wzbogacających profil kandydata.

---

##  Instalacja i Uruchomienie

1. **Klonowanie repozytorium:**
   ```bash
   git clone https://github.com/wlasiciel/nazwa-repozytorium.git
   cd nazwa-repozytorium
   ```

2. **Uruchomienie lokalne:**
   Ze względu na wykorzystanie czystego JavaScriptu oraz bibliotek klienckich (`pdf-lib`, `pdf.js`), aplikację można uruchomić za pomocą dowolnego serwera statycznego (np. rozszerzenia *Live Server* w VS Code) lub serwując pliki statyczne przez Node.js / Python:

   ```bash
   # Przykład uruchomienia prostego serwera Python
   python -m http.server 8000
   ```

3. Otwórz `http://localhost:8000` w przeglądarce.

## Struktura projektu

* `index.html` — główny edytor CV, formularz danych oraz wybór i podgląd szablonów.
* `template_viewer.html` — samodzielny podgląd przykładowych szablonów.
* `app.js` — obsługa wyboru szablonu, podglądu, drukowania i zapisu na stronie głównej oraz w samodzielnym podglądzie.
* `templates/` — trzy gotowe szablony CV.
* `assets/` — przykładowe zdjęcia używane przez szablony.
