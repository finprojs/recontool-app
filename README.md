# ReconTool Pro - Smart Bank Reconciliation

A modern, AI-powered bank reconciliation tool that matches transactions in minutes instead of hours.

## Features

- 🚀 Smart auto-matching with fuzzy logic
- 📊 Beautiful dashboard with real-time stats
- 🎯 Manual matching for edge cases
- 📥 CSV import/export
- 💎 Premium dark UI with animations
- ⚡ Fast and responsive

## Local Development

### Prerequisites
- Node.js 18+ installed

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:5173 in your browser

## Deployment

### Deploy to Vercel (Recommended)

1. Push this code to GitHub
2. Go to https://vercel.com
3. Click "Import Project"
4. Connect your GitHub repository
5. Click "Deploy"

Done! You'll get a free live URL like: `recontool.vercel.app`

### Deploy to Netlify

1. Push this code to GitHub
2. Go to https://netlify.com
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Click "Deploy"

## How to Use

1. Export your bank statement as CSV
2. Export your accounting records as CSV
3. Upload both files
4. Map the columns (date, amount, description)
5. Click "Run Smart Reconciliation"
6. Review matches and manually match any remaining items
7. Export results

## Tech Stack

- React 18
- Vite
- PapaParse (CSV parsing)
- Lucide Icons
- No external CSS frameworks (pure inline styles)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT
