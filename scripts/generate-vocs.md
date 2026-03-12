# Script to generate 50 vocabulary items with TTS audio and images

We will write a Node.js script that:
1. Includes a list of 50 English words and their Vietnamese meanings.
2. Uses `google-tts-api` to download mp3 files.
3. Downloads a relevant Unsplash image for each word.
4. Saves them to `data/` folder.
5. Generates the TS code for `vocs.ts`.
