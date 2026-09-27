# QVAC Journal Prompt Generator

Enter a mood or topic and an on-device AI writes a thoughtful, reflective journal prompt that fits it. No cloud call, no API key.

## How it works

1. You type a mood or topic (e.g. `feeling behind on everything`) into the single input field and submit.
2. The server sends your text to the on-device model with a system instruction that asks for exactly one open-ended reflective question grounded in what you wrote — not a generic journaling prompt.
3. The reply is streamed token-by-token, cleaned up (stripped of quotes, preambles like "Here's..." and extra lines), and forced to end in a question mark.
4. `logic.js` sanity-checks the result: if the model refuses, rambles past 260 characters, or produces something that doesn't actually reference any keyword from your input, the app discards it and returns a guaranteed-relevant fallback prompt instead.

### Example

- Input: `feeling behind on everything`
- Typical output: `"What is the one task on your list that, if you finally finished it, would make the rest feel lighter?"`

### QVAC functions used

- `loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 })` — loads the model on-device at startup (`src/gui.js`).
- `completion({ modelId, history, stream: true, completionOpts })` — generates the journal prompt, streamed via `run.tokenStream` (`src/logic.js`).
- `unloadModel({ modelId })` — releases the model when the server shuts down (`src/gui.js`).

## Run

```bash
npm install
npm start
```

Then open http://localhost:31022

The port can be overridden with the `PORT` environment variable.

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## License

MIT
