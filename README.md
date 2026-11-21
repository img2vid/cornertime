# Corner Time

Choose a timed duty, such as staying in place or observing quiet time. The app gives spoken instructions and tells you when your time is served. [Open Corner Time](https://img2vid.github.io/cornertime/).

From **Session studio**, start a Classic timer immediately, choose an on-device activity, or open **Classic tools** for presets and reports. Use **All activities** to return to the directory.

## School penalties beyond corner time

[Open **School penalties**](https://img2vid.github.io/cornertime/#school) to choose from 36 duties you can do entirely on your phone, tablet or computer. Choose assigned lines, alternating lines, numbered entries, exact copies, ordered taps or timed acknowledgements. Each group offers **30, 45, 60, 90, 120 and 180 minutes**. The duration appears on the card before you begin.

Select **Begin duty**. Each round requires a full minute on the duty screen and the entries shown. For example, Assigned lines requires three correct copies per minute for 30 minutes (90 copies altogether). If you finish typing early, wait for the next round. If time runs out first, you can finish the current entry without losing progress. Timed acknowledgements open in the final ten seconds of each minute.

Use **Pause** for a break. Leaving or hiding the tab pauses the timer. Your saved round, time and draft are available when you return on the same browser and device. You can repeat a completed duty. Earlier worksheet responses are available in the read-only archive if this browser has them.

## Continuous typing and chain challenges

[Continuous typing](https://img2vid.github.io/cornertime/#continuous) has 12 duties, including numbered registers, alternating lines, punctuation, reversed word order and case changes. Choose 30 minutes to 3 hours for a standalone duty. Type the next correct character to earn the time since your previous correct keystroke, up to five seconds apart. Longer gaps, pasted text and retyping deleted characters earn no time. Lines advance automatically. When the timer reaches zero, finish the current line. The 36 minute-round school penalties remain available separately.

In [Chain challenge](https://img2vid.github.io/cornertime/#chain), choose a preset and generate the plan before you start. Each combination begins with a randomly timed Classic corner-time session with the usual movement monitoring and warnings, followed by a shuffled selection of distinct continuous typing penalties. Each stage starts automatically when the previous one finishes. Presets 1 through 10 assign 1 through 10 hours and default to 3, 6, 9, through 30 combinations. You can enter any count from 3 to 30 while keeping the preset time budget. Later presets allow more typing duties per combination. Chain typing duties use the duration shown in the plan.

Preset 1 assigns exactly one hour, including Classic preparation. Actual completion may take longer due to movement penalties, idle time, corrections, and breaks. Pausing or leaving saves the assigned order and your place in this browser. Return to the same mode and choose **Begin or resume**.

## Use the classic timer

Open **Classic tools** for a longer session with spoken instructions. On the main screen choose **Fixed duration** and type minutes, or **Random duration** and enter a starting and ending number of minutes. Both endpoints are included. Select **Start Classic session**. A separate button starts the original 10–15 minute session. Movement can trigger a warning or add time. The position and noise readings are for your information in this mode.

Choose **Design preset** to set your own times and spoken phrases. A preset is a set of session instructions you can reuse. To use one someone has shared, choose **Import preset** and paste the whole preset, including its first and last lines. At the end of a classic session, you can copy its report. Choose **View report** to read a report you saved or received.

## Appearance and local assistant

Open **Appearance** on any screen. System follows the device's light or dark setting. Light and Dark override it. Forest, Ocean, and Plum work in every mode. This browser remembers both choices.

### Generative AI chat on GitHub Pages

Open **Local assistant** and send a message. For example, ask “Write a four-line poem about a rainy classroom.” Then ask “Rewrite the second line in Bengali.” The assistant generates new text and receives recent conversation turns with each request. It can also explain the current activity. **New conversation** clears the transcript and starts fresh.

The first free-form message downloads SmolLM2-360M-Instruct (approximately 365 MB of 8-bit weights), its tokenizer and the inference runtime. Keep the tab open during setup. A progress indicator shows the current download, and replies appear as the model produces them. The browser can cache model files between visits. Private browsing, storage limits, or clearing site data can cause a fresh download. **Stop generation** interrupts loading or inference and releases the worker. **Retry message** repeats a failed request.

The browser runs inference on its CPU through single-threaded WebAssembly in a dedicated module worker. This runs on static HTTPS hosting, including the repository’s GitHub Pages project path, without an inference server, API key, GPU, cross-origin isolation headers, or preinstalled browser AI. The first use needs access to jsDelivr for Transformers.js and the WebAssembly runtime, and Hugging Face for model files. Messages and generated text are processed on the device. A small model can make factual mistakes and struggle with complex instructions or longer conversations. The panel retains up to 40 messages in memory and sends a bounded recent history to the model.

### Taking actions

Ask “Could you take me to the activity that combines timers and typing?” When the model suggests a supported command, **Apply action** runs it against the current page. You can also enter explicit commands directly, including while model files are unavailable.

1. **Open chain challenge** opens setup.
2. **Set combinations to 4** changes the combination count.
3. **Generate chain** builds the plan. **Open assigned plan** expands it.
4. **Begin or resume**, **Pause**, and **Time left** operate on the current session.
5. **Switch to dark mode** or **use ocean** changes appearance.

From the home screen, **start a 5-minute timer** begins Classic corner time. Use **list controls** to discover labels, **click [label]** to activate a control, or **set [field] to [value]** to edit a field. Existing session rules and form validation apply.

### Voice and troubleshooting

**Listen** accepts one spoken message using on-device English (US) speech recognition. Allow microphone access on HTTPS or localhost and install the browser’s English speech pack if prompted. **Speak replies** reads the answer using an installed voice. Text chat works independently of microphone permission and speech support.

If loading fails, check that both download hosts are reachable, use a current WebAssembly SIMD-capable browser, and free memory by closing other tabs. Choose **Retry message**. For a local Pages preview, run the production build with `bash deploy.sh`, then serve the repository with `python -m http.server 8000` and visit `http://localhost:8000/docs/`.

[Model and license](https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct) · [Transformers.js](https://huggingface.co/docs/transformers.js/)
