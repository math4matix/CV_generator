# Generator CV i Dokumentów PDF

Aplikacja internetowa umożliwiająca dynamiczne generowanie, zarządzanie oraz personalizację profesjonalnego CV w formacie PDF za pomocą listy opcji i dedykowanych formularzy.

---

## 🚀 Główne Funkcje

* **Dynamiczna generacja PDF:** Tworzenie i dostosowywanie dokumentów PDF przy użyciu list wybieranych (drop-down).
* **Obsługa języka angielskiego:** Możliwość automatycznego lub ręcznego tłumaczenia sekcji CV na język angielski.
* **Klauzula RODO:** Opcja łatwego dołączenia aktualnej zgody na przetwarzanie danych osobowych w stopce dokumentu.
* **Pełny profil kandydata:** Wprowadzanie i prezentacja danych osobowych, zdjęcia, danych kontaktowych, sekcji certyfikatów oraz odnośników do portfeli/profesjonalnych mediów społecznościowych (LinkedIn, GitHub, Portfolio).
* **Aktualizacja danych:** Wygodne zarządzanie i rozbudowa bazy CV o nowe wpisy (doświadczenie, certyfikaty itp.).

---

## 🛠️ Stack Techniczny

* **Frontend:** Vanilla JavaScript (Plain JS), HTML5
* **Style:** CSS (Bootstrap 5)
* **Generowanie i obsługa PDF:** `pdf-lib`, `pdf.js`
* **Baza danych:** SQLite
* **Hosting:** Darmowy hosting frontendowy (np. Netlify / Vercel)

---

## 📊 Struktura Danych CV

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

## ⚙️ Instalacja i Uruchomienie

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

3. Open browser and visit: `http://localhost:8000`

Paste a direct PDF URL into the **PDF URL** field and select **Load PDF** to view another document. For remote PDFs, the host must allow cross-origin requests (CORS).

---

## 📝 Licencja

Projekt udostępniany jest na licencji MIT. Patrz plik `LICENSE`, aby uzyskać więcej szczegółów.