# Showdown-TurBOOT

A bot for Pokemon Showdown that connects over WebSocket, logs into your account, auto-joins rooms, and listens to chat. Built with TypeScript and designed to be easy to extend with your own commands and features.

## What it does

- Connects to the official Pokemon Showdown server (or a custom one)
- Logs in with your account credentials
- Automatically joins rooms you specify
- Logs chat messages, PMs, room joins/leaves, and server popups to the console
- Reconnects on its own if the connection drops
- Shuts down cleanly when you press Ctrl+C

## Requirements

- Node.js 20 or newer
- A Pokemon Showdown account (optional — the bot works as a guest without one)

## Setup

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/TurboRx/Showdown-TurBOOT.git
cd Showdown-TurBOOT
npm install
```

2. Copy the example environment file and fill in your details:

```bash
cp .env.example .env
```

3. Open `.env` in any text editor and set your bot's username and password:

```env
PS_USERNAME=YourBotName
PS_PASSWORD=YourBotPassword
PS_ROOMS=botdevelopment
```

If you leave the username blank, the bot will connect as a guest.

## Running the bot

```bash
npm start
```

To kill/stop the bot, press `Ctrl+C`.

## Configuration

All settings are controlled through the `.env` file. Here is the full list:

| Variable | Default | Description |
|---|---|---|
| PS_USERNAME | _(empty, connects as guest)_ | Your bot's Pokemon Showdown username |
| PS_PASSWORD | _(empty)_ | Your bot's password |
| PS_ROOMS | _(empty)_ | Comma-separated list of rooms to auto-join |
| PS_SERVER_URL | wss://sim3.psim.us/showdown/websocket | WebSocket server URL |
| PS_LOGIN_URL | https://play.pokemonshowdown.com/api/login | Login API endpoint |
| PS_AVATAR | _(empty)_ | Avatar ID to set after login |
| PS_RECONNECT_DELAY_MS | 10000 | Milliseconds to wait before reconnecting |
| PS_COMMAND_CHAR | . | Prefix character for bot commands |

## Troubleshooting

**The bot connects but stays as a guest**
Make sure `PS_USERNAME` and `PS_PASSWORD` are set correctly in your `.env` file. The account must be registered on Pokemon Showdown.

**If Connection keeps dropping**
This is usually a network issue. The bot will automatically try to reconnect after the delay set in `PS_RECONNECT_DELAY_MS` (default 10 seconds).

**Login assertion error**
This means the Pokemon Showdown login server rejected your credentials. Double-check your username and password. If your account uses a special character in the password, make sure it is not being stripped by the .env parser.

## License

[MIT](LICENSE)
