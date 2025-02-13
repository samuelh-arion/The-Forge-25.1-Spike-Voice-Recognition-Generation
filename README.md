# Voice-Controlled Name Confirmation List

A web application that uses OpenAI's WebRTC Realtime API to manage a voice-controlled name confirmation list. This project is a fork of [talk-to-javascript-openai-workers](https://github.com/craigsdennis/talk-to-javascript-openai-workers) by Craig Dennis, modified by the SureName team (Nati Vallejo and Samuel Heinrichs) for the Forge 25.1 Spike.

## Demo

Watch the [Demo Video](https://github.com/samuelh-arion/The-Forge-25.1-Spike-Voice-Recognition-Generation/raw/refs/heads/main/demo.webm) to see the voice-controlled name confirmation list in action.

## Features

- Voice-controlled interface for managing names
- Real-time name list updates
- Confirmation status tracking
- Tool call logging
- Secure API key handling through Cloudflare Workers
- Beautiful and responsive UI

## Technology Stack

- [Cloudflare Workers](https://developers.cloudflare.com/workers/) for backend services
- [Hono](https://honojs.dev) for API routing
- [OpenAI Realtime API](https://platform.openai.com/docs/api-reference/realtime) for voice processing
- WebRTC for real-time communication
- Vanilla JavaScript for frontend functionality

## Getting Started

### Prerequisites

- Node.js and npm installed
- OpenAI API key
- Cloudflare account (for deployment)

### Development Setup

1. Clone the repository:

```bash
git https://github.com/samuelh-arion/The-Forge-25.1-Spike-Voice-Recognition-Generation.git
cd The-Forge-25.1-Spike-Voice-Recognition-Generation
```

2. Copy the environment variables example file:

```bash
cp .dev.vars.example .dev.vars
```

3. Add your OpenAI API key to `.dev.vars`

4. Install dependencies:

```bash
npm install
```

5. Start the development server:

```bash
npm run dev
```

### Deployment

1. Set up your OpenAI API key in Cloudflare:

```bash
npx wrangler secret put OPENAI_API_KEY
```

2. Deploy to Cloudflare Workers:

```bash
npm run deploy
```

## Features

### Voice Commands

The application supports various voice commands to:

- Add new names to the list
- Update existing names
- Delete names
- Confirm names
- Get the current list of names
- End the conversation

### Tool Logging

All tool calls are logged in real-time, providing transparency about the system's operations and helping with debugging.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

- Original Project: [talk-to-javascript-openai-workers](https://github.com/craigsdennis/talk-to-javascript-openai-workers) by Craig Dennis
- Modified by: SureName team (Nati Vallejo and Samuel Heinrichs)

## License

This project is licensed under the same terms as the original project by Craig Dennis.
