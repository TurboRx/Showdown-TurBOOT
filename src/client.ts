import WebSocket from 'ws';
import {
	SERVER_URL,
	LOGIN_URL,
	USERNAME,
	PASSWORD,
	ROOMS,
	AVATAR,
	RECONNECT_DELAY_MS,
} from './config.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(...args: unknown[]): void {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}]`, ...args);
}

function warn(...args: unknown[]): void {
	const timestamp = new Date().toISOString();
	console.warn(`[${timestamp}] ⚠`, ...args);
}

function error(...args: unknown[]): void {
	const timestamp = new Date().toISOString();
	console.error(`[${timestamp}] ✖`, ...args);
}

// ─── PS Client ──────────────────────────────────────────────────────────────

export class PSClient {
	private ws: WebSocket | null = null;
	private connected = false;
	private loggedIn = false;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private intentionalClose = false;

	/** Start the bot — connects and auto-reconnects forever. */
	connect(): void {
		if (this.ws) {
			warn('Already connected or connecting — ignoring duplicate connect()');
			return;
		}

		this.intentionalClose = false;
		log(`Connecting to ${SERVER_URL}…`);

		this.ws = new WebSocket(SERVER_URL);

		this.ws.on('open', () => {
			this.connected = true;
			log('WebSocket connection established.');
		});

		this.ws.on('message', (data: WebSocket.Data) => {
			const raw = data.toString();
			this.handleRawMessage(raw);
		});

		this.ws.on('close', (code: number, reason: Buffer) => {
			const wasConnected = this.connected;
			this.connected = false;
			this.loggedIn = false;
			this.ws = null;

			if (this.intentionalClose) {
				log('Connection closed intentionally.');
				return;
			}

			warn(
				`Connection closed (code=${code}, reason=${reason.toString() || 'none'}).` +
					(wasConnected ? '' : ' (never fully connected)')
			);

			this.scheduleReconnect();
		});

		this.ws.on('error', (err: Error) => {
			error('WebSocket error:', err.message);
			// The 'close' event fires after 'error', so reconnect is handled there.
		});
	}

	/** Gracefully disconnect without auto-reconnect. */
	disconnect(): void {
		this.intentionalClose = true;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.connected = false;
		this.loggedIn = false;
		log('Disconnected.');
	}

	/** Send a raw message to the server. */
	send(message: string): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			warn('Cannot send — not connected.');
			return;
		}
		this.ws.send(message);
	}

	/** Send a message to a specific room (or globally if room is empty). */
	sendToRoom(room: string, message: string): void {
		this.send(`${room}|${message}`);
	}

	// ─── Internal ─────────────────────────────────────────────────────────

	private scheduleReconnect(): void {
		if (this.reconnectTimer) return;

		const delaySec = RECONNECT_DELAY_MS / 1000;
		log(`Reconnecting in ${delaySec}s…`);

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connect();
		}, RECONNECT_DELAY_MS);
	}

	/**
	 * Handle a raw WebSocket frame from the server.
	 * A frame can contain multiple newline-separated messages,
	 * optionally prefixed with `>ROOMID\n`.
	 */
	private handleRawMessage(raw: string): void {
		const lines = raw.split('\n');
		let room = '';

		for (const line of lines) {
			if (line.startsWith('>')) {
				room = line.slice(1).trim();
				continue;
			}
			if (!line.startsWith('|')) continue;

			const parts = line.slice(1).split('|');
			const type = parts[0]!;
			this.handleMessage(room, type, parts.slice(1));
		}
	}

	/**
	 * Handle a single parsed PS protocol message.
	 */
	private handleMessage(room: string, type: string, params: string[]): void {
		switch (type) {
			case 'challstr': {
				const challstr = params.join('|');
				log('Received challstr, authenticating…');
				void this.login(challstr);
				break;
			}

			case 'updateuser': {
				const rawName = params[0] ?? '';
				const username = rawName.trim();
				const isGuest = params[1] === '0';

				if (isGuest) {
					warn(`Logged in as guest (${username}).`);
				} else {
					this.loggedIn = true;
					log(`✔ Successfully logged in as ${username}`);
					this.onLogin();
				}
				break;
			}

			case 'init': {
				const roomType = params[0];
				log(`Joined room: ${room} (${roomType})`);
				break;
			}

			case 'deinit': {
				log(`Left room: ${room}`);
				break;
			}

			case 'popup': {
				const content = params.join('|');
				warn(`Popup: ${content}`);
				break;
			}

			case 'pm': {
				const from = params[0]?.trim() ?? '';
				const to = params[1]?.trim() ?? '';
				const message = params.slice(2).join('|');
				log(`PM from ${from} to ${to}: ${message}`);
				break;
			}

			case 'c':
			case 'chat': {
				const user = params[0]?.trim() ?? '';
				const message = params.slice(1).join('|');
				log(`[${room}] ${user}: ${message}`);
				break;
			}

			case 'j':
			case 'join':
			case 'J': {
				// User joined a room — ignored for now.
				break;
			}

			case 'l':
			case 'leave':
			case 'L': {
				// User left a room — ignored for now.
				break;
			}

			case 'n':
			case 'name':
			case 'N': {
				// User renamed — ignored for now.
				break;
			}

			default: {
				// Unhandled message types are silently ignored.
				break;
			}
		}
	}

	/**
	 * Authenticate with the PS login server and send the
	 * resulting assertion to the game server.
	 */
	private async login(challstr: string): Promise<void> {
		if (!USERNAME) {
			warn('No PS_USERNAME set — staying as guest.');
			return;
		}

		try {
			const body = new URLSearchParams();
			body.append('name', USERNAME);
			body.append('pass', PASSWORD);
			body.append('challstr', challstr);

			// The login server returns `]` followed by JSON.
			const response = await fetch(LOGIN_URL, {
				method: 'POST',
				body,
			});

			const text = await response.text();
			const json: { assertion?: string; actionsuccess?: boolean; curuser?: { loggedin: boolean } } =
				JSON.parse(text.startsWith(']') ? text.slice(1) : text) as {
					assertion?: string;
					actionsuccess?: boolean;
					curuser?: { loggedin: boolean };
				};

			if (!json.assertion) {
				error('Login failed — no assertion returned.', json);
				return;
			}

			// If the assertion starts with ";;" it means the login failed with an error message.
			if (json.assertion.startsWith(';;')) {
				error('Login assertion error:', json.assertion.slice(2));
				return;
			}

			log('Login assertion received, sending to server…');
			this.send(`|/trn ${USERNAME},0,${json.assertion}`);
		} catch (err) {
			error('Login request failed:', err);
		}
	}

	/**
	 * Called after a successful login (`|updateuser|` with logged-in state).
	 */
	private onLogin(): void {
		// Set avatar if configured.
		if (AVATAR) {
			this.send(`|/avatar ${AVATAR}`);
			log(`Setting avatar to ${AVATAR}`);
		}

		// Auto-join configured rooms.
		for (const room of ROOMS) {
			log(`Joining room: ${room}`);
			this.send(`|/join ${room}`);
		}
	}
}
