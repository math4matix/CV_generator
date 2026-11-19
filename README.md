# Generator CV i dokumentów PDF

Statyczna aplikacja webowa do tworzenia CV i przygotowywania go do wydruku lub zapisania jako PDF. Formularz działa w przeglądarce, podgląd aktualizuje się na bieżąco, a gotowy dokument można wydrukować lub zapisać wybraną przez system drukowania przeglądarki opcją **Zapisz jako PDF**.

Aplikacja jest publikowana jako strona statyczna i nie potrzebuje serwera aplikacyjnego ani bazy danych.

## Funkcje

- Edycja danych osobowych, wykształcenia, doświadczenia, umiejętności, języków, certyfikatów i zainteresowań.
- Dodawanie i usuwanie wielokrotnych wpisów, np. kilku miejsc pracy lub placówek edukacyjnych.
- Dodawanie zdjęcia kandydata oraz załączników lub linków do certyfikatów.
- Wybór jednego z trzech szablonów:
  - dwukolumnowy czarno-biały ze zdjęciem,
  - klasyczny bez zdjęcia,
  - nowoczesny ze zdjęciem.
- Aktualizacja podglądu po każdej zmianie formularza.
- Dopasowanie zawartości podglądu do jednego arkusza A4.
- Drukowanie CV bezpośrednio z przeglądarki.
- Zapis i ponowne wczytanie danych do/ze zwykłego pliku JSON, wraz ze zdjęciem i załącznikami.
- Opcjonalne tłumaczenie wybranych pól na angielski za pomocą DeepL API Free i Cloudflare Worker.
- Powiadomienie o zgodzie RODO przy pierwszym wejściu, zapamiętywane lokalnie w przeglądarce.

## Jak działa zapis danych

Dane formularza są przetwarzane lokalnie w przeglądarce. Aplikacja nie ma własnej bazy danych i nie wysyła formularza do serwera.

Przycisk **Zapisz CV** zapisuje dane i pliki w pliku `moje-cv.json`. Przy pierwszym otwarciu tego pliku przez **Otwórz CV** formularz zostaje uzupełniony zapisanymi wartościami i szablonem.

Po odświeżeniu strony dane formularza nie są automatycznie przywracane. Aby ich nie utracić, należy wcześniej zapisać CV do pliku JSON.

## Tłumaczenie na angielski

Tłumaczenie działa opcjonalnie i jest przekazywane przez serwer Cloudflare Worker, który ukrywa klucz DeepL przed kodem przeglądarki.

Do tłumaczenia przekazywane są:

- umiejętności,
- zainteresowania,
- kierunek kształcenia,
- stanowisko,
- opis pracy i osiągnięć,
- nazwa języka,
- nazwa certyfikatu lub szkolenia.

Nie są wysyłane: zdjęcie, dane osobowe i kontaktowe, nazwy szkół i firm, daty, linki oraz załączniki. Przetłumaczony podgląd nie zmienia danych wpisanych w formularzu.

### Konfiguracja Cloudflare Worker

1. Utwórz Cloudflare Worker, korzystając z panelu Cloudflare lub narzędzia Wrangler.
2. Wdróż zawartość [`cloudflare/worker.js`](./cloudflare/worker.js).
3. Dodaj w ustawieniach Worker sekret:

   ```text
   DEEPL_API_KEY=<klucz DeepL API Free>
   ```

4. Dodaj zmienną tekstową z dozwolonymi adresami stron:

   ```text
   ALLOWED_ORIGINS=https://math4matix.github.io,http://localhost:8000
   ```

   Każdy origin powinien zawierać wyłącznie protokół i domenę, bez ścieżki.

5. W [`index.html`](./index.html) ustaw w metadanych adres wdrożonego Workera:

   ```html
   <meta name="translation-endpoint"
         content="https://TWOJ-WORKER.TWOJE-KONTO.workers.dev">
   ```

Worker sprawdza metodę żądania, format JSON, limit 50 tekstów i limit 12 000 znaków na żądanie. Odpowiada z kontrolą CORS dla zdefiniowanych originów oraz, automatycznie, dla adresów GitHub Codespaces.

Klucz DeepL nie powinien być umieszczany w `index.html`, `app.js`, repozytorium ani w plikach publikowanych przez GitHub Pages.

## Uruchomienie lokalne

Projekt składa się z plików statycznych HTML, CSS i JavaScript. Można go uruchomić dowolnym serwerem HTTP, np:

```bash
python -m http.server 8000
```

Następnie otwórz:

```text
http://localhost:8000
```

Nie otwieraj projektu przez adres `file://`, ponieważ przeglądarka ładuje szablony i skrypty jako zasoby sieciowe. Do testowania tłumaczenia uruchom stronę również przez `localhost`, a adres lokalnego serwera dodaj do `ALLOWED_ORIGINS`.

## Publikacja przez GitHub Pages

Repozytorium można publikować bez dodatkowego procesu budowania. W ustawieniach GitHub Pages należy wskazać gałąź i katalog główny repozytorium.

Własny adres Worker powinien być skonfigurowany zgodnie z publicznym originem strony, np. `https://math4matix.github.io`. Origin nie powinien zawierać nazwy repozytorium ani ścieżki strony.

## Struktura projektu

- `index.html` — główny edytor, formularz, lista szablonów i komunikat RODO.
- `app.js` — logika formularza, podglądów, dynamicznych sekcji, zapisu i wczytywania JSON oraz tłumaczenia.
- `templates/black_white.html` — szablon dwukolumnowy ze zdjęciem.
- `templates/no_photo.html` — szablon klasyczny bez zdjęcia.
- `templates/simple_photo.html` — szablon nowoczesny ze zdjęciem.
- `template_viewer.html` — statyczny podgląd dostępnych szablonów.
- `rodo.html` — klauzula informacyjna RODO i informacje o przetwarzaniu danych.
- `cloudflare/worker.js` — pośrednik dla API tłumaczenia DeepL.
- `wrangler.toml` — obecnie pusty plik przygotowany do przyszłej lokalnej konfiguracji Workers.
- `assets/` — przykładowe zdjęcia używane przez szablony.
- `favicon/` — ikony i manifest strony.

## Stack techniczny

- HTML5 i CSS.
- Vanilla JavaScript bez frameworka.
- `iframe` do podglądu szablonów i funkcji drukowania przeglądarki.
- Cloudflare Workers do pośrednictwa w tłumaczeniu.
- DeepL API Free jako opcjonalna usługa tłumaczenia.
- GitHub Pages jako hosting statyczny.

Aplikacja nie używa obecnie `pdf-lib`, `pdf.js`, Bootstrap, SQLite ani serwera REST. PDF powstaje w standardowym oknie drukowania przeglądarki.

## Prywatność i dane osobowe

- Dane formularza i pliki pozostają w przeglądarce, dopóki użytkownik nie zapisze CV do pliku.
- Zgoda RODO jest zapisywana w `localStorage` przeglądarki.
- Tłumaczenie wysyła wybrane pola tekstowe do Cloudflare Worker, a następnie do DeepL.
- Cloudflare i DeepL mogą przetwarzać dane techniczne żądań zgodnie ze swoimi aktualnymi regulaminami i politykami.
- Szczegółowe informacje znajdują się w [`rodo.html`](./rodo.html).
