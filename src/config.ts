export const SERVER_URL: string =
	process.env['PS_SERVER_URL'] ?? 'wss://sim3.psim.us/showdown/websocket';

export const LOGIN_URL: string =
	process.env['PS_LOGIN_URL'] ?? 'https://play.pokemonshowdown.com/api/login';

export const USERNAME: string = process.env['PS_USERNAME'] ?? '';

export const PASSWORD: string = process.env['PS_PASSWORD'] ?? '';

export const ROOMS: string[] = (process.env['PS_ROOMS'] ?? '')
	.split(',')
	.map((r) => r.trim())
	.filter(Boolean);

export const AVATAR: string = process.env['PS_AVATAR'] ?? '';

export const RECONNECT_DELAY_MS: number = Number(
	process.env['PS_RECONNECT_DELAY_MS'] ?? '10000'
);

export const COMMAND_CHAR: string = process.env['PS_COMMAND_CHAR'] ?? '.';
