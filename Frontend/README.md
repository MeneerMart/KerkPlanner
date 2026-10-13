# KerkPlanner frontend

## Lokaal starten

1. Installeer de Node.js LTS-versie.
2. Voer in deze map `npm install` uit.
3. Start met `npm run dev`.

De frontend verwacht de API standaard op `http://localhost:5114/api`; dit staat in `src/lib/api.ts`. De WhatsApp-knop is gekoppeld aan Henk op 0634239485. Als dit nummer later verandert, pas het aan in `src/components/EnrollmentModal.tsx`.

## Ingevoerde functies

- De navigatie heeft aparte pagina's voor Home en Inschrijvingen; beheerders zien daarnaast Beheerders paneel.
- Ingelogde vrijwilligers zien hun eigen inschrijvingen en kunnen deze wijzigen of verwijderen.
- Per gereedschap kan iemand een aantal invullen, bijvoorbeeld twee hamers.
- Het adminpaneel toont per taak hoeveel gereedschap al geregeld is en hoeveel nog nodig is.
- Beheerders kunnen zowel bestaande accountgebruikers als personen zonder account inschrijven. Voor gastinschrijvingen worden voornaam, achternaam, optioneel telefoonnummer en opgegeven gereedschap bewaard.
- Beheerders kunnen inschrijvingen verwijderen. De aantallen gereedschap worden daarna automatisch opnieuw berekend op basis van de resterende inschrijvingen.
- Bevestigingsvensters worden gebruikt voor wijzigingen aan werkdagen, taken en inschrijvingen, en voor uitloggen.
- Niet-ingelogde bezoekers kunnen zich inschrijven via de login-/registratiepagina of Henk via WhatsApp benaderen.
- De backend verwijdert verlopen werkdagen automatisch, samen met de bijbehorende taken en inschrijvingen.

Gereedschapsaantallen in inschrijvingen worden als JSON-object opgeslagen, bijvoorbeeld `{"Hamer":2}`. Oude komma-gescheiden waarden worden bij het uitlezen ook ondersteund.
