import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Claude Agent SDK OAuth 미들웨어
function claudeApiMiddleware() {
  return {
    name: 'claude-api-middleware',
    configureServer(server) {
      // POST /api/generate -- SDK query()로 Claude 호출
      server.middlewares.use('/api/generate', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { system, user } = JSON.parse(body);
            if (!system && !user) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'system 또는 user 필드 필요' }));
              return;
            }

            const { query } = await import('@anthropic-ai/claude-agent-sdk');

            const prompt = system
              ? `<system>${system}</system>\n\n${user}`
              : user;

            const response = query({
              prompt,
              options: {
                maxTurns: 1,
                allowedTools: [],
                permissionMode: 'dontAsk',
                model: 'claude-sonnet-4-6',
                persistSession: false,
              }
            });

            let resultText = '';
            for await (const msg of response) {
              if (msg.type === 'result' && msg.subtype === 'success') {
                resultText = msg.result;
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ text: resultText }));
          } catch (e) {
            console.error('[claude-api-middleware]', e.message);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), claudeApiMiddleware()],
  server: {
    port: parseInt(process.env.PORT) || 5173,
  },
})
