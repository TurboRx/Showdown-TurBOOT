/**
 * Bot configuration — loaded from environment variables.
 *
 * Create a `.env` file in the project root (see `.env.example`) or export
 * the variables in your shell before starting the bot.
 */

/** PS WebSocket server URL */
export const SERVER_URL: string =
	process.env['PS_SERVER_URL'] ?? 'wss://sim3.psim.us/showdown/websocket';

/** PS login server (used for authentication) */
export const LOGIN_URL: string =
	process.env['PS_LOGIN_URL'] ?? 'https://play.pokemonshowdown.com/api/login';

/** Bot username on PS */
export const USERNAME: string = process.env['PS_USERNAME'] ?? '';

/** Bot password on PS (leave empty for unregistered accounts) */
export const PASSWORD: string = process.env['PS_PASSWORD'] ?? '';

/** Comma-separated list of rooms to auto-join after login */
export const ROOMS: string[] = (process.env['PS_ROOMS'] ?? '')
	.split(',')
	.map((r) => r.trim())
	.filter(Boolean);

/** Avatar ID to set after login (optional) */
export const AVATAR: string = process.env['PS_AVATAR'] ?? '';

/** Delay in ms before attempting reconnection */
export const RECONNECT_DELAY_MS: number = Number(
	process.env['PS_RECONNECT_DELAY_MS'] ?? '10000'
);

/** Command character for the bot */
export const COMMAND_CHAR: string = process.env['PS_COMMAND_CHAR'] ?? '.';
