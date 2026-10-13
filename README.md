# BrewGo

Webshop for BrewGo – en bærbar, genopladelig kapselkaffemaskine med indbygget vandopvarmning.

Ren HTML/CSS/JS uden build-step. Åbn `index.html` i en browser, eller host mappen på fx GitHub Pages / Netlify.

## Indhold
- Forside med hero, produktsektion (farve, pakke, tilbehør, antal), "sådan virker den", features, specifikationer, FAQ og nyhedsbrev
- Kurv (gemmes i `localStorage`) med fri-fragt-bar
- Kasse med validering og ordrebekræftelse

> Kassen er en demo – der gennemføres ingen rigtig betaling. Tilslut fx Stripe Checkout, Shopify Buy Button eller Quickpay for at tage imod betalinger.

Produktdata (priser, farver, tilbehør) redigeres øverst i `script.js`.
