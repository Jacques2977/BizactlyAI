# Bizactly.AI - AI Startup Coach

An AI-powered platform designed to help first-time founders validate ideas, plan MVPs, and launch successful startups.

## Features

- **AI Startup Coach**: Get personalized guidance from an AI trained on startup best practices
- **Idea Validation**: Validate your startup concept with market analysis and feedback
- **MVP Planning**: Create detailed MVP plans with feature prioritization
- **Lean Canvas Generator**: Automatically generate business model canvases
- **Launch Strategy**: Get step-by-step launch plans and growth tactics

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure OpenAI API**:
   - Copy `.env.example` to `.env`
   - Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Add your API key to the `.env` file:
     ```
     VITE_OPENAI_API_KEY=your_actual_api_key_here
     ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

- `VITE_OPENAI_API_KEY`: Your OpenAI API key for AI coaching features

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4
- **Icons**: Lucide React

## Usage

1. Visit the landing page to learn about BizactlyAI
1. Visit the landing page to learn about Bizactly.AI
2. Click "Try It Free" to access the dashboard
3. Use the AI Coach to get personalized startup guidance
4. Track your progress through the analytics dashboard
5. Access curated resources for founders

## Security Note

This implementation uses the OpenAI API directly from the browser for demo purposes. In a production environment, you should:

1. Move API calls to a secure backend server
2. Implement proper authentication and rate limiting
3. Store API keys securely on the server side
4. Add input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details