#!/usr/bin/env python3
"""
Vimput Formatter Worker
A local HTTP server that formats code using system-installed formatters.

Usage:
    python vimput-formatter.py

The server runs on http://localhost:7483
Dependencies are installed automatically on first run.
"""

import subprocess
import shutil
import sys
import os
import platform

PORT = 7483
IS_WINDOWS = platform.system() == "Windows"


def pip_install(package: str) -> bool:
    """Try to install a package with pip using various strategies."""
    strategies = [
        [sys.executable, "-m", "pip", "install", "--quiet", package],
        [sys.executable, "-m", "pip", "install", "--quiet", "--user", package],
        [sys.executable, "-m", "pip", "install", "--quiet", "--break-system-packages", package],
    ]

    for cmd in strategies:
        try:
            subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return True
        except subprocess.CalledProcessError:
            continue
    return False


def ensure_flask():
    """Install Flask if not present."""
    try:
        import flask
    except ImportError:
        print("Installing Flask...")
        if pip_install("flask"):
            print("Flask installed.")
        else:
            print("Failed to install Flask. Please install manually: pip install flask")
            sys.exit(1)


# Install commands for each formatter
INSTALL_COMMANDS = {
    "prettier": {
        "npm": "npm install -g prettier",
        "desc": "JS/TS/CSS/HTML/JSON/MD/YAML/GraphQL",
    },
    "black": {
        "pip": "black",
        "desc": "Python",
    },
    "ruff": {
        "pip": "ruff",
        "desc": "Python (faster)",
    },
    "shfmt": {
        "brew": "shfmt",
        "go": "go install mvdan.cc/sh/v3/cmd/shfmt@latest",
        "desc": "Bash/Shell",
    },
    "gofmt": {
        "note": "Included with Go installation",
        "desc": "Go",
    },
    "rustfmt": {
        "note": "Included with Rust (rustup component add rustfmt)",
        "desc": "Rust",
    },
    "clang-format": {
        "brew": "clang-format",
        "apt": "clang-format",
        "desc": "C/C++",
    },
}

# Formatter configurations
FORMATTERS = {
    "javascript": [
        ("prettier", ["--parser", "babel", "--stdin-filepath", "file.js"], None),
        ("biome", ["format", "--stdin-file-path", "file.js"], None),
    ],
    "typescript": [
        ("prettier", ["--parser", "typescript", "--stdin-filepath", "file.ts"], None),
        ("biome", ["format", "--stdin-file-path", "file.ts"], None),
    ],
    "jsx": [
        ("prettier", ["--parser", "babel", "--stdin-filepath", "file.jsx"], None),
        ("biome", ["format", "--stdin-file-path", "file.jsx"], None),
    ],
    "tsx": [
        ("prettier", ["--parser", "typescript", "--stdin-filepath", "file.tsx"], None),
        ("biome", ["format", "--stdin-file-path", "file.tsx"], None),
    ],
    "python": [
        ("ruff", ["format", "-"], None),
        ("black", ["-"], None),
    ],
    "css": [
        ("prettier", ["--parser", "css", "--stdin-filepath", "file.css"], None),
    ],
    "html": [
        ("prettier", ["--parser", "html", "--stdin-filepath", "file.html"], None),
    ],
    "json": [
        ("prettier", ["--parser", "json", "--stdin-filepath", "file.json"], None),
        ("biome", ["format", "--stdin-file-path", "file.json"], None),
    ],
    "markdown": [
        ("prettier", ["--parser", "markdown", "--stdin-filepath", "file.md"], None),
    ],
    "yaml": [
        ("prettier", ["--parser", "yaml", "--stdin-filepath", "file.yaml"], None),
    ],
    "graphql": [
        ("prettier", ["--parser", "graphql", "--stdin-filepath", "file.graphql"], None),
    ],
    "bash": [
        ("shfmt", ["-"], None),
    ],
    "sql": [
        ("sqlfluff", ["fix", "-f", "ansi", "-"], None),
        ("sql-formatter", [], None),
    ],
    "go": [
        ("gofmt", [], None),
    ],
    "rust": [
        ("rustfmt", [], None),
    ],
    "java": [
        ("google-java-format", ["-"], None),
    ],
    "c": [
        ("clang-format", [], None),
    ],
    "cpp": [
        ("clang-format", [], None),
    ],
}


def get_available_formatters() -> dict[str, str]:
    """Get all available formatters for each language."""
    available = {}
    for lang, formatters in FORMATTERS.items():
        for cmd, _, _ in formatters:
            if shutil.which(cmd):
                available[lang] = cmd
                break
    return available


def get_missing_formatters() -> list[str]:
    """Get list of recommended formatters that are not installed."""
    recommended = ["prettier", "black", "shfmt", "gofmt", "rustfmt", "clang-format"]
    return [f for f in recommended if not shutil.which(f)]


def prompt_install_formatters():
    """Ask user if they want to install missing formatters."""
    missing = get_missing_formatters()
    if not missing:
        return

    print("\n  Missing formatters:")
    for fmt in missing:
        info = INSTALL_COMMANDS.get(fmt, {})
        desc = info.get("desc", "")
        print(f"    - {fmt} ({desc})")

    print("\n  Install options:")

    # Show pip installable
    pip_fmts = [f for f in missing if "pip" in INSTALL_COMMANDS.get(f, {})]
    if pip_fmts:
        pkgs = " ".join(INSTALL_COMMANDS[f]["pip"] for f in pip_fmts)
        print(f"    pip install {pkgs}")

    # Show npm installable
    npm_fmts = [f for f in missing if "npm" in INSTALL_COMMANDS.get(f, {})]
    if npm_fmts:
        for f in npm_fmts:
            print(f"    {INSTALL_COMMANDS[f]['npm']}")

    # Show brew installable (macOS)
    if platform.system() == "Darwin":
        brew_fmts = [f for f in missing if "brew" in INSTALL_COMMANDS.get(f, {})]
        if brew_fmts:
            pkgs = " ".join(INSTALL_COMMANDS[f]["brew"] for f in brew_fmts)
            print(f"    brew install {pkgs}")

    # Show notes
    for fmt in missing:
        info = INSTALL_COMMANDS.get(fmt, {})
        if "note" in info:
            print(f"    # {fmt}: {info['note']}")

    print("")

    # Ask about npm packages (prettier)
    if npm_fmts and shutil.which("npm"):
        try:
            answer = input("  Install prettier via npm? [Y/n] ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print("")
            return

        if answer != "n":
            print("  Installing prettier globally...")
            try:
                subprocess.check_call(
                    ["npm", "install", "-g", "prettier"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
                print("  prettier installed.")
            except subprocess.CalledProcessError:
                print("  Failed to install prettier. Try: npm install -g prettier")

    # Ask about pip packages
    if pip_fmts:
        try:
            answer = input("  Install Python formatters (black)? [Y/n] ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            print("")
            return

        if answer != "n":
            for fmt in pip_fmts:
                pkg = INSTALL_COMMANDS[fmt]["pip"]
                print(f"  Installing {pkg}...")
                if pip_install(pkg):
                    print(f"  {pkg} installed.")
                else:
                    print(f"  Failed to install {pkg}.")


def find_formatter(language: str) -> tuple[str, list[str]] | None:
    """Find the first available formatter for a language."""
    if language not in FORMATTERS:
        return None

    for cmd, args, _ in FORMATTERS[language]:
        if shutil.which(cmd):
            return (cmd, args)

    return None


def format_code(code: str, language: str, options: dict) -> tuple[bool, str, str | None]:
    """Format code using the appropriate formatter."""
    formatter = find_formatter(language)
    if not formatter:
        return (False, code, f"No formatter found for {language}")

    cmd, args = formatter
    indent_type = options.get("indentType", "spaces")
    indent_size = options.get("indentSize", 2)

    full_cmd = [cmd] + args

    # Add indent options for formatters that support them
    if cmd == "prettier":
        full_cmd.extend(["--tab-width", str(indent_size)])
        if indent_type == "tabs":
            full_cmd.append("--use-tabs")
    elif cmd == "biome":
        full_cmd.extend(["--indent-width", str(indent_size)])
        if indent_type == "tabs":
            full_cmd.extend(["--indent-style", "tab"])
    elif cmd == "shfmt":
        full_cmd.extend(["-i", str(indent_size) if indent_type == "spaces" else "0"])
    elif cmd == "clang-format":
        style = f"{{IndentWidth: {indent_size}, UseTab: {'Always' if indent_type == 'tabs' else 'Never'}}}"
        full_cmd.extend([f"--style={style}"])
    elif cmd == "rustfmt":
        full_cmd.extend(["--config", f"tab_spaces={indent_size}"])
        if indent_type == "tabs":
            full_cmd.extend(["--config", "hard_tabs=true"])

    try:
        result = subprocess.run(
            full_cmd,
            input=code,
            capture_output=True,
            text=True,
            timeout=10,
        )

        if result.returncode == 0:
            return (True, result.stdout, None)
        else:
            if result.stdout and result.stdout.strip():
                return (True, result.stdout, None)
            error = result.stderr or f"{cmd} exited with code {result.returncode}"
            return (False, code, error)

    except subprocess.TimeoutExpired:
        return (False, code, "Formatter timed out")
    except Exception as e:
        return (False, code, str(e))


def run_server():
    """Run the Flask server."""
    from flask import Flask, request, jsonify

    app = Flask(__name__)

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "version": "1.0.0"})

    @app.route("/formatters", methods=["GET"])
    def formatters():
        return jsonify(get_available_formatters())

    @app.route("/format", methods=["POST"])
    def format_endpoint():
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No JSON body"}), 400

        code = data.get("code", "")
        language = data.get("language", "")
        options = data.get("options", {})

        if not language:
            return jsonify({"success": False, "error": "Language is required"}), 400

        success, result, error = format_code(code, language, options)
        response = {"success": success, "result": result}
        if error:
            response["error"] = error
        return jsonify(response)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    @app.route("/format", methods=["OPTIONS"])
    @app.route("/formatters", methods=["OPTIONS"])
    @app.route("/health", methods=["OPTIONS"])
    def handle_options():
        return "", 204

    import logging
    log = logging.getLogger("werkzeug")
    log.setLevel(logging.ERROR)

    app.run(host="127.0.0.1", port=PORT, debug=False)


def start_background():
    """Start the server in background and return the PID."""
    if IS_WINDOWS:
        # Windows: use subprocess with CREATE_NEW_PROCESS_GROUP
        CREATE_NEW_PROCESS_GROUP = 0x00000200
        DETACHED_PROCESS = 0x00000008

        proc = subprocess.Popen(
            [sys.executable, __file__, "--daemon"],
            creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            stdin=subprocess.DEVNULL,
        )
        return proc.pid
    else:
        # Unix: double fork to daemonize, use pipe to get real PID
        read_fd, write_fd = os.pipe()

        pid = os.fork()
        if pid > 0:
            # Parent: wait for real PID from pipe
            os.close(write_fd)
            real_pid = os.read(read_fd, 32).decode().strip()
            os.close(read_fd)
            os.waitpid(pid, 0)  # Reap first child
            return int(real_pid) if real_pid else pid

        # First child: create new session
        os.close(read_fd)
        os.setsid()

        # Second fork
        pid = os.fork()
        if pid > 0:
            # Send grandchild PID to parent
            os.write(write_fd, str(pid).encode())
            os.close(write_fd)
            os._exit(0)

        # Grandchild: close pipe and redirect std streams
        os.close(write_fd)
        sys.stdout.flush()
        sys.stderr.flush()

        with open(os.devnull, 'r') as devnull:
            os.dup2(devnull.fileno(), sys.stdin.fileno())
        with open(os.devnull, 'w') as devnull:
            os.dup2(devnull.fileno(), sys.stdout.fileno())
            os.dup2(devnull.fileno(), sys.stderr.fileno())

        run_server()
        os._exit(0)


def main():
    ensure_flask()

    # If called with --daemon, just run server (for Windows background process)
    if "--daemon" in sys.argv:
        run_server()
        return

    print("")
    print("  Vimput Formatter Worker v1.0.0")
    print("  ==============================")

    available = get_available_formatters()
    if available:
        print("\n  Available formatters:")
        for lang, cmd in sorted(available.items()):
            print(f"    {lang:<12} -> {cmd}")
    else:
        print("\n  No formatters found.")

    # Prompt to install missing formatters
    prompt_install_formatters()

    # Refresh available formatters after potential install
    available = get_available_formatters()

    # Start in background
    print("\n  Starting server in background...")
    pid = start_background()

    # Give server a moment to start
    import time
    time.sleep(0.5)

    print(f"""
  Server running on http://localhost:{PORT}
  PID: {pid}
""")

    if IS_WINDOWS:
        print(f"  To stop: taskkill /PID {pid} /F")
    else:
        print(f"  To stop: kill {pid}")

    print("")


if __name__ == "__main__":
    main()
