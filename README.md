# TMU-WH1 — World History Practice

A self-contained study site for a World History course. It turns the course's study guides into practice quizzes and exams, so you can drill the material before Maps, Quiz 1, Exam 1, Quiz 2, Exam 2 and the Final Exam.

**Live site: [luteron2026.github.io/TMU-WH1](https://luteron2026.github.io/TMU-WH1/)**

## What's inside

- **Maps** — practice for the map quiz.
- **Quiz 1, Exam 1, Quiz 2 and Exam 2** — practice sets built from the highlighted study guide material, including:
  - True / False
  - "Which is FALSE?"
  - "Not correctly related"
  - Matching
  - Timeline questions (dates and events from the course timelines)
- **Final Exam** — covers note packet pages 1–80. Practice sets are coming soon.
- **Instant feedback** — answers are marked right or wrong as you go, with progress shown for each set.
- **Settings** — light / dark color theme, highlighter style, and reading options such as text size.

## Using it

There is nothing to install. Visit the [live site](https://luteron2026.github.io/TMU-WH1/) in any modern browser, on desktop or phone, or open `index.html` locally. The site is published with GitHub Pages from the `main` branch.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | The whole site: page, styles, scripts, questions and map images in one file |
| `version.json` | The current version number. Open pages check it and update themselves when it goes up |
| `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` | Browser and home-screen icons |
| `LICENSE` | MIT License |

## Publishing an update

When you change `index.html`, raise the number in **both** places so open pages pick up the change:

1. `const APP_VERSION = …` near the top of the script in `index.html`
2. `"version"` in `version.json`

Visitors who already have the page open get the new version the next time they open or switch back to the tab. On the menu it reloads by itself; during a practice set an **Update now** bar appears instead, so nobody loses their place.

## Privacy

The site uses [GoatCounter](https://www.goatcounter.com/) for simple, cookie-free visit counts. No account or personal information is needed to use it.

## Contributing

Spotted a wrong answer or a typo in a question? Open an issue or a pull request describing the question and the fix.

## License

Released under the [MIT License](LICENSE).
