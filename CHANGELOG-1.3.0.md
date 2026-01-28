# Vimput v1.3.0 Changelog

## New Features

### Code Formatter
- **Local Formatter Worker**: New Python-based formatter service that runs locally
  - Download the script directly from extension settings
  - Runs as background daemon on `localhost:7483`
  - Auto-installs dependencies (Flask)
  - Prompts to install formatters (prettier, black) on first run
- **Supported Languages**: JavaScript, TypeScript, JSX, TSX, Python, CSS, HTML, JSON, Markdown, YAML, GraphQL, Bash, SQL, Go, Rust, Java, C, C++
- **Commands**: `:fmt` or `:format` to format current buffer
- **Shortcut**: `<Space>cf` in normal mode
- **Privacy**: 100% local - your code never leaves your machine

### Indentation Settings
- Choose between **tabs** or **spaces**
- Configurable indent size: **2, 4, or 8** spaces
- Settings apply to both editing and formatting

### Ace Editor Support
- Full compatibility with **Ace Editor** (used by Udemy and other platforms)
- Proper cursor positioning and text synchronization

### TypeScript Playground Compatibility
- Fixed compatibility via external page script injection
- Works with Monaco-based editors

## Improvements

### Cursor Behavior
- Improved cursor rendering and positioning
- Fixed cursor display on empty lines
- Better visual feedback across different editor types

### Default Settings
- `enterToSaveAndExit`: Now **enabled** by default (press Enter in Normal mode to save and close)
- More intuitive out-of-the-box experience

### Internal
- Normalized line endings in vim engine (CRLF → LF)
- Better cross-platform compatibility

## Technical Details

### Formatter Worker Architecture
```
[Vimput Extension] --HTTP--> [localhost:7483] --subprocess--> [prettier/black/gofmt/...]
```

The formatter worker bridges the gap between the browser extension (which can't execute local commands) and system-installed formatters.

### Supported Formatters
| Language | Formatters |
|----------|------------|
| JS/TS/JSX/TSX | prettier, biome |
| Python | ruff, black |
| CSS/HTML/JSON/MD/YAML/GraphQL | prettier |
| Bash | shfmt |
| SQL | sqlfluff, sql-formatter (built-in) |
| Go | gofmt |
| Rust | rustfmt |
| Java | google-java-format |
| C/C++ | clang-format |
