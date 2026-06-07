# ⚡ Token Sorter

A lightweight web app that parses **BPDB prepaid meter SMS messages** and displays tokens in sequence order for easy meter input. No frameworks, no build step — just fast, static HTML/CSS/JS that works offline.

## Features

- **Smart SMS Parsing** — Handles multiple SMS formats (`SeqNo:`, `SquNo:`, `Seq-`) including negative and range sequences
- **Meter Info Extraction** — Displays Meter No, Vending Amount, Energy Cost, VAT, Rebate, etc.
- **Sequential Navigation** — Step through tokens one-by-one with Previous/Next buttons
- **Copy to Clipboard** — One tap to copy any token (`C` key shortcut)
- **Progress Tracking** — Visual progress bar showing completion status
- **Session Persistence** — Refresh the page and resume where you left off (localStorage)
- **Clickable Table** — Jump to any token directly from the table
- **Keyboard Shortcuts** — Arrow keys, Space, C, N for fast navigation
- **Dark Mode** — Toggle with saved preference, respects system theme
- **PWA / Offline** — Install to home screen, works without internet
- **Duplicate Detection** — Automatically removes duplicate tokens
- **Print Support** — Print token list for paper reference
- **Bilingual** — Instructions in English and Bengali (বাংলা)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `→` or `Space` | Next token |
| `←` | Previous token |
| `C` | Copy current token |
| `N` | New token (reset) |

## Getting Started

### Use Online
Visit the deployed site and paste your SMS message.

### Run Locally
```bash
# Clone the repo
git clone https://github.com/MeSrabon/meter-token.git
cd meter-token

# Serve with any static server
npx serve .
# or
python3 -m http.server 3000
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```
Or connect the GitHub repo to [vercel.com](https://vercel.com) for automatic deployments.

## How It Works

1. Copy the **entire** SMS from BPDB (e.g., `Successful!Your BPDBprepaid Prepaid Token is 5120-0213-...`)
2. Paste into the input box
3. Click **Start Inserting**
4. Tokens appear one-by-one in sequence — enter each into your meter
5. Use **Next/Previous** or arrow keys to navigate
6. Check current sequence on meter: press **889**

## SMS Format Support

The parser handles these common BPDB SMS formats:

```
Successful!Your BPDBprepaid Prepaid Token is 5120-0213-9522-2448-3237,2232-0497-...,SquNo:-1~9 for offline Meter No:10110430442,Vending Amt:400.0,Enrg Cost: 258.64,...
```

```
Your prepaid token is 1234-5678-9012-3456-7890, SeqNo:5 ...
```

```
Token: 1234-5678-9012-3456-7890, Seq-3 ...
```

## Project Structure

```
meter-token/
├── index.html          # Main HTML
├── script.js           # App logic & parsing
├── style.css           # Styles & dark mode
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline cache)
├── vercel.json         # Vercel deployment config
├── package.json        # Project metadata
├── files/
│   └── codes.pdf       # Meter short code reference
└── README.md
```

## Contributing

1. Fork the [repository](https://github.com/MeSrabon/meter-token)
2. Create a branch: `git checkout -b my-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin my-feature`
5. Submit a pull request

## License

[GNU GPL v3.0](LICENSE)

## Credits

- Built by **Srabon Khan**
- Icons: [FontAwesome](https://fontawesome.com/)
