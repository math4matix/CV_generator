# Generator CV

[Działająca wersja](https://math4matix.github.io/CV_generator/)

Projekt szkolny — generator CV z podglądem na żywo, zapisem do pliku JSON, wydrukiem do PDF i tłumaczeniem na angielski.

## Funkcje

- Edycja danych osobowych i kontaktowych, wykształcenia, doświadczenia zawodowego, umiejętności, języków, certyfikatów i zainteresowań.
- Dodawanie i usuwanie wpisów dotyczących edukacji, doświadczenia, języków oraz certyfikatów.
- Dodawanie zdjęcia oraz linku lub pliku do certyfikatu.
- Wybór jednego z trzech szablonów CV.
- Podgląd aktualizowany podczas edycji formularza.
- Zapis i ponowne wczytanie danych CV z pliku JSON.
- Drukowanie CV z poziomu przeglądarki; w oknie drukowania można wybrać opcję **Zapisz jako PDF**.
- Opcjonalne tłumaczenie wybranych pól na angielski przez DeepL API Free za pośrednictwem Cloudflare Worker.

## Jak działa zapis danych

Dane formularza są przetwarzane w przeglądarce. CV można pobrać jako plik `moje-cv.json` i później wczytać go przyciskiem **Otwórz CV**. Plik obejmuje także zdjęcie oraz pliki certyfikatów. Formularz nie jest automatycznie przywracany po odświeżeniu strony.

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

## Instalacja i uruchomienie lokalne

Sklonuj repozytorium, przejdź do katalogu `CV_generator` i uruchom lokalny serwer:

```bash
git clone https://github.com/math4matix/CV_generator.git
cd CV_generator
python -m http.server 8000
```

Następnie otwórz w przeglądarce:

```text
http://localhost:8000
```

Nie otwieraj projektu przez adres `file://`, ponieważ przeglądarka ładuje szablony i skrypty jako zasoby sieciowe. Do testowania tłumaczenia uruchom stronę również przez `localhost`, a adres lokalnego serwera dodaj do `ALLOWED_ORIGINS`.

## Publikacja przez GitHub Pages

Repozytorium można publikować bez dodatkowego procesu budowania. W ustawieniach GitHub Pages należy wskazać gałąź i katalog główny repozytorium.

Własny adres Worker powinien być skonfigurowany zgodnie z publicznym originem strony, np. `https://math4matix.github.io`. Origin nie powinien zawierać nazwy repozytorium ani ścieżki strony.

## Struktura projektu

- `index.html` — edytor, formularz, wybór szablonów, podgląd i komunikat zgody.
- `app.js` — logika formularza, podglądu, dynamicznych sekcji, zapisu i wczytywania JSON oraz tłumaczenia.
- `templates/black_white.html` — szablon dwukolumnowy ze zdjęciem.
- `templates/no_photo.html` — szablon klasyczny bez zdjęcia.
- `templates/simple_photo.html` — szablon ze zdjęciem i sekcjami CV.
- `template_viewer.html` — podgląd dostępnych szablonów.
- `rodo.html` — informacje o przetwarzaniu danych.
- `cloudflare/worker.js` — pośrednik dla API tłumaczenia DeepL.
- `wrangler.toml` — pusty plik.
- `assets/` — przykładowe zdjęcia używane przez szablony.
- `favicon/` — ikony i manifest strony.

## Stack techniczny

- HTML i CSS.
- Vanilla JavaScript.
- Cloudflare Worker jako pośrednik żądań do DeepL API Free.
- GitHub Pages jako hosting statycznej aplikacji.
- `window.print()` do otwarcia okna drukowania przeglądarki i zapisania CV jako PDF.

## Prywatność i dane osobowe

- Dane CV nie są przesyłane, poza wybranymi polami tekstowymi wysyłanymi do tłumaczenia.
- Zgoda RODO jest zapisywana w `localStorage` przeglądarki.
- Tłumaczenie wysyła wybrane pola tekstowe przez Cloudflare Worker do DeepL.
- Szczegółowe informacje znajdują się w [`rodo.html`](./rodo.html).

## Znane ograniczenia

- Projekt nie ma testów automatycznych.
- Tłumaczenie wysyła wskazane pola tekstowe do Cloudflare Worker i DeepL.
- Dane CV można zapisać tylko do pliku JSON; aplikacja nie przechowuje ich po odświeżeniu strony.

## Autorzy

- [math4matix](https://github.com/math4matix)
- [rafSliw](https://github.com/rafSliw)
