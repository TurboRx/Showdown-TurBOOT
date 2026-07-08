/**
 * Showdown-TurBOOT — A Pokémon Showdown Battle/ChatBot
 *
 * Entry point: loads environment, creates the PS client, and connects.
 */

// Load .env file if present (using Node's built-in --env-file won't work
// with tsx, so we load it manually).
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnv(): void {
	const envPath = resolve(import.meta.dirname ?? '.', '..', '.env');
	if (!existsSync(envPath)) return;

	const content = readFileSync(envPath, 'utf-8');
	for (const line of content.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const eqIndex = trimmed.indexOf('=');
		if (eqIndex === -1) continue;

		const key = trimmed.slice(0, eqIndex).trim();
		const value = trimmed.slice(eqIndex + 1).trim();

		// Don't override existing env vars.
		if (!(key in process.env)) {
			process.env[key] = value;
		}
	}
}

loadEnv();

// ─── Start the bot ──────────────────────────────────────────────────────────

import { PSClient } from './client.js';

const bot = new PSClient();

console.log('');
console.log('  ╔══════════════════════════════════════╗');
console.log('  ║       Showdown-TurBOOT  v1.0.0              ║');
console.log('  ║   A Pokémon Showdown Battle/ChatBot         ║');
console.log('  ╚══════════════════════════════════════╝');
console.log('');

bot.connect();

// Graceful shutdown.
function shutdown(signal: string): void {
	console.log(`\nReceived ${signal}. Shutting down…`);
	bot.disconnect();
	process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
