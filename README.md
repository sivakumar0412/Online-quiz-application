# Online Quiz Application

A lightweight quiz app for students and educators with multiple-choice questions, per‑question timers, instant feedback, and scoring. It runs purely in the browser (HTML/CSS/JS) and optionally pulls questions from the Open Trivia DB API, with a graceful fallback to a built‑in local question bank.

## Demo (in this project)
- Open: `/quiz/index.html`
- Folder: `public/quiz/` (contains `index.html`, `style.css`, `app.js`)

## Features
- Multiple-choice questions with shuffling and single‑click locking
- Per‑question countdown timer with low‑time visual pulse
- Instant feedback, progress bar, and final score summary
- Lightweight animations (screen transitions, option states, confetti on correct)
- Optional live questions via Open Trivia DB with automatic local fallback
- Mobile‑first responsive UI and basic accessibility (keyboard/ARIA)

## Tech Stack
- HTML for structure, CSS for responsive UI/animations, vanilla JavaScript for logic
- No build step required; works as a static site
- Optional: Open Trivia DB API (client‑side fetch)

## Quick Start
- In v0 Preview: navigate to `/quiz/index.html`
- Static hosting: serve the `public` directory (or open `public/quiz/index.html` directly)
- No environment variables required

## How It Works
1) Choose question source (Local or Open Trivia DB), amount, difficulty, and seconds per question.  
2) Each question shuffles options and starts a countdown.  
3) On selection or timeout, answers lock; correct/incorrect styling appears instantly.  
4) Progress updates per question; summary shows score and breakdown.

## Configuration
- Question source: select “Open Trivia DB” in the settings screen to fetch live questions.
- Difficulty: any/easy/medium/hard (applies to both API and local filtering).
- Time per question: set in the settings screen (10–90 seconds supported).

## Customization
- Local questions: edit `LOCAL_QUESTIONS` in `public/quiz/app.js`. Each item:
   ``` js
  { q: "Question text?", options: ["A","B","C","D"], a: 2, d: "easy" }
  // a = index of correct option (0-based), d = difficulty ("easy"|"medium"|"hard")
  ```
- Styles: adjust color tokens and animations in `public/quiz/styles.css`.
- UI/Layout: tweak HTML structure in `public/quiz/index.html`.

## Accessibility
- Keyboard: focusable options; press Enter/Space to select.  
- ARIA roles on interactive elements; high-contrast success/error colors.  
- Reduced motion can be supported by honoring `prefers-reduced-motion` in CSS.

## Deployment
- Static site friendly: deploy to Vercel, Netlify, GitHub Pages, or any static host.
- In this v0 workspace, click Publish to deploy; share the `/quiz/index.html` route.

## Notes on Open Trivia DB
- API: https://opentdb.com/api_config.php  
- If the API is unreachable or returns an error, the app falls back to the local bank seamlessly.

## Project Structure
```
public/
  quiz/
    index.html     # UI layout and screens (settings, quiz, summary)
    style.css     # Theme tokens, layout, animations, option states
    app.js         # Logic: state, timer, shuffling, feedback, API fallback
app/               # Next.js app router files (provided by v0)
...
```

## License
Use, modify, and distribute for educational and non‑commercial purposes. Add your preferred license if needed.
