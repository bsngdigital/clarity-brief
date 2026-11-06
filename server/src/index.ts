import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

import { isSupabaseConfigured } from './supabase.js'
import { projectsRouter } from './routes/projects.js'
import { clientsRouter } from './routes/clients.js'
import { clientFormRouter } from './routes/clientForm.js'
import { assetsRouter } from './routes/assets.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: '*', // Allow local frontend or configured domain
    credentials: true,
  }),
)
app.use(express.json())

// Root status page
app.get('/', (_req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Clarity Backend API Server</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FBFBF9; color: #172019; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: white; border: 1px solid #EBEBE6; border-radius: 24px; padding: 36px; max-width: 520px; width: 100%; box-shadow: 0 20px 40px -24px rgba(23,32,25,0.15); }
        .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #E7F3EA; color: #2F6B41; margin-bottom: 16px; }
        .badge-dot { width: 8px; height: 8px; border-radius: 50%; background: #2F6B41; }
        h1 { font-size: 24px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.02em; }
        p { color: #737A74; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; }
        .btn { display: inline-block; background: #172019; color: white; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-size: 14px; font-weight: 600; transition: background 0.2s; margin-bottom: 24px; }
        .btn:hover { background: black; }
        .endpoints { border-top: 1px solid #EBEBE6; padding-top: 20px; font-size: 13px; }
        .endpoints h3 { font-size: 12px; text-transform: uppercase; color: #737A74; margin: 0 0 10px 0; letter-spacing: 0.05em; }
        .endpoints ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
        .endpoints a { color: #172019; font-family: monospace; text-decoration: none; font-weight: 600; }
        .endpoints a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">
          <span class="badge-dot"></span>
          ${isSupabaseConfigured ? 'Server Online & Terhubung Supabase' : 'Server Online (Local Mode)'}
        </div>
        <h1>Clarity Backend API Server</h1>
        <p>
          Server API ini sedang berjalan dengan lancar pada <code>port 3001</code>. Server ini bertugas melayani data dan integrasi Supabase untuk aplikasi Anda.
        </p>
        <div>
          <a href="http://localhost:8443" class="btn">👉 Buka Aplikasi Web Frontend (Port 8443)</a>
        </div>
        <div class="endpoints">
          <h3>Endpoint API Tersedia:</h3>
          <ul>
            <li><a href="/api/health">/api/health</a> &mdash; Pemeriksaan status server</li>
            <li><a href="/api/projects">/api/projects</a> &mdash; Daftar data proyek</li>
            <li><a href="/api/clients">/api/clients</a> &mdash; Daftar data klien</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `)
})

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'clarity-backend',
    timestamp: new Date().toISOString(),
    supabaseConnected: isSupabaseConfigured,
    supabaseUrl: process.env.SUPABASE_URL || null,
    message: isSupabaseConfigured
      ? 'Supabase is fully configured.'
      : 'Server is running! To connect your database, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env',
  })
})

// Routes
app.use('/api/projects', projectsRouter)
app.use('/api/clients', clientsRouter)
app.use('/api/c', clientFormRouter)
app.use('/api/c', assetsRouter)

// Error Handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('[SERVER ERROR]', err)
  res.status(500).json({ error: err?.message || 'Internal Server Error' })
})

app.listen(PORT, () => {
  console.log(`===============================================`)
  console.log(`🚀 Clarity Backend Server running on port ${PORT}`)
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`)
  console.log(`🔌 Supabase URL: ${process.env.SUPABASE_URL || 'Not configured'}`)
  console.log(`===============================================`)
})
