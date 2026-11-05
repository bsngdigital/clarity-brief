import express, { type Request, type Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { isSupabaseConfigured } from './supabase.js'
import { projectsRouter } from './routes/projects.js'
import { clientsRouter } from './routes/clients.js'
import { clientFormRouter } from './routes/clientForm.js'
import { assetsRouter } from './routes/assets.js'

dotenv.config()

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

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'clarity-backend',
    timestamp: new Date().toISOString(),
    supabaseConnected: isSupabaseConfigured,
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
  console.log(`===============================================`)
})
