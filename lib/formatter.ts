import { format as formatSQL } from "sql-formatter";

const WORKER_URL = "http://localhost:7483";

// Languages supported by the local formatter worker
const WORKER_LANGUAGES = new Set([
	"javascript",
	"typescript",
	"jsx",
	"tsx",
	"python",
	"css",
	"html",
	"json",
	"markdown",
	"yaml",
	"graphql",
	"bash",
	"sql",
	"go",
	"rust",
	"java",
	"c",
	"cpp",
]);

// Fallback: SQL is always supported via bundled sql-formatter
const BUILTIN_LANGUAGES = new Set(["sql"]);

// Formatter suggestions per language
const FORMATTER_SUGGESTIONS: Record<string, string> = {
	javascript: "prettier (npm install -g prettier)",
	typescript: "prettier (npm install -g prettier)",
	jsx: "prettier (npm install -g prettier)",
	tsx: "prettier (npm install -g prettier)",
	css: "prettier (npm install -g prettier)",
	html: "prettier (npm install -g prettier)",
	json: "prettier (npm install -g prettier)",
	markdown: "prettier (npm install -g prettier)",
	yaml: "prettier (npm install -g prettier)",
	graphql: "prettier (npm install -g prettier)",
	python: "black or ruff (pip install black)",
	bash: "shfmt (brew install shfmt)",
	go: "gofmt (included with Go)",
	rust: "rustfmt (rustup component add rustfmt)",
	java: "google-java-format",
	c: "clang-format (brew install clang-format)",
	cpp: "clang-format (brew install clang-format)",
};

function getFormatterSuggestion(language: string): string {
	return FORMATTER_SUGGESTIONS[language] || "a formatter";
}

export interface FormatOptions {
	indentType: "tabs" | "spaces";
	indentSize: 2 | 4 | 8;
}

export interface WorkerStatus {
	available: boolean;
	formatters: Record<string, string>;
}

let workerStatus: WorkerStatus | null = null;
let lastWorkerCheck = 0;
const WORKER_CHECK_INTERVAL = 5000; // 5 seconds

/**
 * Check if the formatter worker is running and get available formatters.
 */
export async function checkWorkerStatus(): Promise<WorkerStatus> {
	const now = Date.now();

	// Use cached status if recent
	if (workerStatus && now - lastWorkerCheck < WORKER_CHECK_INTERVAL) {
		return workerStatus;
	}

	try {
		const [healthRes, formattersRes] = await Promise.all([
			fetch(`${WORKER_URL}/health`, { method: "GET" }),
			fetch(`${WORKER_URL}/formatters`, { method: "GET" }),
		]);

		if (healthRes.ok && formattersRes.ok) {
			const formatters = await formattersRes.json();
			workerStatus = { available: true, formatters };
			lastWorkerCheck = now;
			return workerStatus;
		}
	} catch {
		// Worker not running
	}

	workerStatus = { available: false, formatters: {} };
	lastWorkerCheck = now;
	return workerStatus;
}

/**
 * Check if a language has formatter support (either via worker or builtin).
 */
export function isFormatterSupported(language: string): boolean {
	return WORKER_LANGUAGES.has(language) || BUILTIN_LANGUAGES.has(language);
}

/**
 * Check if a language is supported by the worker (when available).
 */
export function isWorkerLanguage(language: string): boolean {
	return WORKER_LANGUAGES.has(language);
}

/**
 * Get all languages that could be formatted.
 */
export function getFormatterSupportedLanguages(): string[] {
	return Array.from(WORKER_LANGUAGES);
}

/**
 * Format code using the worker if available, otherwise use builtin formatter.
 */
export async function formatCode(
	code: string,
	language: string,
	options: FormatOptions,
): Promise<{ success: boolean; result: string; error?: string }> {
	// Check if language is supported at all
	if (!isFormatterSupported(language)) {
		return {
			success: false,
			result: code,
			error: `No formatter for ${language}`,
		};
	}

	// Try worker first for all supported languages
	if (WORKER_LANGUAGES.has(language)) {
		const status = await checkWorkerStatus();

		if (status.available) {
			// Check if worker has a formatter for this language
			if (status.formatters[language]) {
				try {
					const response = await fetch(`${WORKER_URL}/format`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ code, language, options }),
					});

					if (response.ok) {
						const data = await response.json();
						if (data.success) {
							return { success: true, result: data.result };
						}
						return {
							success: false,
							result: code,
							error: data.error || "Formatter error",
						};
					}
				} catch (err) {
					// Worker request failed, try builtin fallback
				}
			} else {
				// Worker running but no formatter for this language
				if (!BUILTIN_LANGUAGES.has(language)) {
					const suggestions = getFormatterSuggestion(language);
					return {
						success: false,
						result: code,
						error: `No ${language} formatter installed. Install ${suggestions} and restart the worker.`,
					};
				}
			}
		} else {
			// Worker not running
			if (!BUILTIN_LANGUAGES.has(language)) {
				return {
					success: false,
					result: code,
					error: "Formatter worker not running. Start it to format this language.",
				};
			}
		}
	}

	// Builtin fallback for SQL
	if (language === "sql") {
		try {
			const formatted = formatSQL(code, {
				tabWidth: options.indentSize,
				useTabs: options.indentType === "tabs",
				keywordCase: "upper",
			});
			return { success: true, result: formatted };
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			return {
				success: false,
				result: code,
				error: errorMessage,
			};
		}
	}

	return {
		success: false,
		result: code,
		error: `Unknown language: ${language}`,
	};
}

/**
 * Get the URL to download the formatter worker script.
 */
export function getWorkerDownloadUrl(): string {
	return browser.runtime.getURL("vimput-formatter.py");
}
