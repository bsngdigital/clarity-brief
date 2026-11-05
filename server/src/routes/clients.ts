import { Router, type Request, type Response } from 'express'
import { supabase } from '../supabase.js'

export const clientsRouter = Router()

// GET /api/clients — List all clients
clientsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*, projects:projects(id, name, status, type)')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/clients — Create a new client
clientsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, company, email, phone } = req.body
    if (!name) {
      res.status(400).json({ error: 'Client name is required' })
      return
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([{ name, company, email, phone }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/clients/:id — Get client details
clientsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('clients')
      .select('*, projects(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) {
      res.status(404).json({ error: 'Client not found' })
      return
    }

    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/clients/:id — Update client details
clientsRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, company, email, phone } = req.body

    const { data, error } = await supabase
      .from('clients')
      .update({ name, company, email, phone })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/clients/:id — Delete client and cascade
clientsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true, message: 'Client deleted' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

