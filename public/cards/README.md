# Card Themes

Each theme is a folder inside `public/cards/<theme>/` containing exactly 52 card
images — one per card in a standard 52-card Big Two deck.

## Naming convention

Files are named `<rank>_of_<suit>.<ext>`:

- **rank:** `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `J`, `Q`, `K`, `A`, `2`
- **suit:** `spades`, `hearts`, `clubs`, `diamonds`

Examples: `3_of_diamonds.svg`, `10_of_spades.png`, `A_of_hearts.png`.

## Registering a theme

Available themes are advertised in `public/cards/themes.json`:

```json
{
  "themes": [
    { "id": "default", "name": "Classic", "ext": "svg" }
  ]
}
```

Add a new entry per theme. `id` is the folder name, `name` is shown in the
app's card-style picker, and `ext` is the image extension (`svg` or `png`).

## Built-in theme

- `default/` — the built-in Classic cards, generated as SVG by
  `scripts/generate-card-themes.mjs`. Re-run that script after editing it.

## Adding a custom theme

1. Create a folder `public/cards/<id>/`.
2. Drop in the 52 images using the naming convention above.
3. Add the theme to `themes.json`.
4. Players pick it under **Card Style** in the lobby.
