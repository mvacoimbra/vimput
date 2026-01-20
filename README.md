# Vimput

Edit browser inputs with Vim bindings for enhanced productivity.

## Build Instructions

### Requirements

- **Operating System**: macOS, Linux, or Windows
- **Node.js**: v20.0.0 or higher (tested with v25.1.0)
- **pnpm**: v9.0.0 or higher (tested with v10.18.1)

### Installing Node.js

Download and install from https://nodejs.org/ or use a version manager like nvm:

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20
```

### Installing pnpm

```bash
npm install -g pnpm
```

Or see https://pnpm.io/installation for other methods.

### Build Steps

1. Clone the repository:
```bash
git clone https://github.com/mvacoimbra/vimput.git
cd vimput
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the extension for Firefox:
```bash
pnpm run build:firefox
```

4. The built extension will be in `.output/firefox-mv2/`

### Creating a ZIP for Distribution

```bash
pnpm run zip:firefox
```

The ZIP file will be created in `.output/` directory.

### Verifying the Build

After building, the `.output/firefox-mv2/` directory should contain:
- `manifest.json`
- `background.js`
- `content-scripts/`
- `popup.html`
- `icons/`
- Other bundled assets

## Development

```bash
# Start development server for Firefox
pnpm run dev:firefox

# Start development server for Chrome
pnpm run dev
```

## License

MIT
