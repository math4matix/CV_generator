# Generator CV

Prosty prototyp strony do przeglądania trzech szablonów CV. Na tym etapie szablony zawierają przykładowe dane; formularz do wprowadzania danych zostanie dodany później.

## Funkcje

- Wybór jednego z trzech szablonów CV.
- Podgląd wybranego szablonu na stronie.
- Drukowanie CV lub zapis jako PDF z poziomu okna drukowania przeglądarki.

## Uruchomienie lokalne

Uruchom serwer plików statycznych w katalogu projektu, na przykład:

```bash
python -m http.server 8000
```

Otwórz `http://localhost:8000` w przeglądarce. Wybierz szablon, a następnie użyj przycisku **Drukuj** lub **Zapisz jako PDF**. Przy zapisie wybierz opcję „Zapisz jako PDF” w oknie drukowania.

## Struktura projektu

- `index.html` — strona wyboru szablonu i podglądu.
- `app.js` — obsługa wyboru, podglądu, drukowania i zapisu.
- `templates/` — trzy gotowe szablony CV.
- `assets/` — przykładowe zdjęcia używane przez szablony.
