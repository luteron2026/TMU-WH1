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
- **Keeps your place** — a set in progress is saved on your device, so a refresh or a closed tab does not start it over. A **Continue** card on the menu takes you back to it, and the phone's Back button goes up one screen instead of leaving the site. **Reset this set** under the card clears the saved place, so the set starts from the beginning.
- **Settings** — light / dark color theme, highlighter style, and reading options such as text size.

## Using it

There is nothing to install. Visit the [live site](https://luteron2026.github.io/TMU-WH1/) in any modern browser, on desktop or phone, or download the repository and open `index.html` locally. The site is published with GitHub Pages from the `main` branch.

## Project layout

| File | Purpose |
| --- | --- |
| `index.html` | The page, styles and scripts |
| `questions.js` | The sections on the front page, then every practice set and question, one per line |
| `owner.js` | The owner's tools (question reviewer, site stats). Only fetched when one of them is opened |
| `maps/` | The map images, loaded only when a map question is shown |
| `preview.png` | The picture shown when the link is shared in a chat or on social media |
| `version.json` | The current version number. Open pages check it and update themselves when it goes up |
| `tools/check.js` | Checks the questions, map images, version numbers and updated date, and runs the tests |
| `tools/test.js` | The tests for answer checking and the guide notes. Run by `tools/check.js` |
| `tools/sources.json` | The study guide lines each question was built from. Kept out of the page so it loads faster |
| `.github/workflows/check.yml` | Runs `tools/check.js` automatically on every pull request |
| `favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png` | Browser and home-screen icons |
| `LICENSE` | MIT License |

## Editing questions

Questions live in `questions.js`. Each one has a permanent key, `"k"`, which the site uses to remember the questions a student missed. Never change a key once it is published, even if you reword or move the question.

To add a question, write it without a `"k"` and run:

```
node tools/check.js --fix
```

This gives new questions their key, tidies the file, and reports problems such as an answer that is not one of the options or a missing map image. Run `node tools/check.js` (no `--fix`) to check without changing anything. It needs [Node.js](https://nodejs.org/) and nothing else. The same check runs by itself on every pull request.

A few things worth knowing:

- **Sections.** The top of `questions.js` lists the sections shown on the front page (`SECTIONS`): the badge, name, pages line and note for each. A set belongs to a section when its `"sec"` is exactly the same as that section's `"key"`. The badge, name and note may contain simple HTML such as `<b>` or `&amp;`. Add `"shuffle":true` to a section to always mix its question order.
- **Exact fill-ins.** A fill-in answer is normally marked generously: capitals, punctuation, "the" and "BC" are ignored. Add `"exact":true` to a fill-in question when only the word itself, spelled correctly, should count (capitals still do not matter).
- **Sources.** You can add `"src":["line from the guide", …]` to a question to record where it came from. `--fix` moves it to `tools/sources.json`, so it is kept but never downloaded by students.

## Publishing an update

When you have changed the site, run:

```
node tools/check.js --release
```

It checks everything, and if there are no problems it raises the version number in both places (`APP_VERSION` in `index.html` and `"version"` in `version.json`) and sets the updated date (`APP_UPDATED`) to today. Then commit and publish as usual. There is nothing to edit by hand.

The menu shows the version with two extra digits after a dot, like **v37.19**, and the date as **Updated Nov 14, 2026**. Those digits are picked automatically and change with every update.

Visitors who already have the page open get the new version the next time they open or switch back to the tab. On the menu it reloads by itself; during a practice set an **Update now** bar appears instead, and the set carries on from the same question after the update.

## Privacy

The site uses [GoatCounter](https://www.goatcounter.com/) for simple, cookie-free visit counts. No account or personal information is needed to use it.

## Contributing

Spotted a wrong answer or a typo in a question? Open an issue or a pull request describing the question and the fix.

## License

Released under the [MIT License](LICENSE).

## Suggestions via Google Form

Suggestions can be saved as Google Form responses. They are kept until you delete them, and Google can email you for each new one. The page keeps its own suggestion box and sends the answers to the form in the background, so a suggestion made from a question still carries that exam, question number and question text.

1. Create a Google Form with six **Short answer** or **Paragraph** questions: Type, Note, Name, Exam, Question #, Question text. Leave them all optional.
2. In **Settings**: turn off "Collect email addresses" and "Limit to 1 response". On a school or work Google account, also turn off "Restrict to users in your organization".
3. Open the **⋮** menu and choose **Get pre-filled link**. Type these exact placeholder answers: `TYPE`, `NOTE`, `NAME`, `EXAM`, `QNUM`, `QUESTION`. Click **Get link**, then **Copy link**.
4. Paste that link into `googleForm` in the `SUGGEST` line of `index.html`.
5. For notifications: in the form, go to **Responses**, then **⋮**, then **Get email notifications for new responses**. Choose **Link to Sheets** too if you want a spreadsheet.
6. Send a test suggestion from the page and check that it shows up under Responses.

To read suggestions, open the form in Google Forms and go to **Responses**.
