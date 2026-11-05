import { Router, type Request, type Response } from 'express'
import { supabase } from '../supabase.js'

export const clientFormRouter = Router()

// GET /api/c/:token — Get project info & brief for client intake
clientFormRouter.get('/:token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params

    // 1. Fetch project by share_token
    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id, name, type, objective, deliverables, deadline, language, status, link_enabled, share_token')
      .eq('share_token', token)
      .single()

    if (pError || !project) {
      res.status(404).json({ error: 'Brief link not found or invalid' })
      return
    }

    if (!project.link_enabled) {
      res.status(403).json({ error: 'This brief link has been disabled by the designer', link_disabled: true })
      return
    }

    // 2. Fetch associated brief
    const { data: brief, error: bError } = await supabase
      .from('briefs')
      .select('id, version, current_step, audience, visual_direction, content, assets_checklist, output')
      .eq('project_id', project.id)
      .single()

    if (bError || !brief) {
      res.status(404).json({ error: 'Brief record missing' })
      return
    }

    // 3. Fetch references and assets
    const [refRes, assetRes, reviewsRes] = await Promise.all([
      supabase.from('references').select('id, kind, url, note, position').eq('brief_id', brief.id),
      supabase.from('assets').select('id, category, file_name, mime_type, size_bytes').eq('brief_id', brief.id),
      // If project needs clarification, get the latest review questions
      project.status === 'needs_clarification'
        ? supabase.from('reviews').select('id, questions:review_questions(section, client_question)').eq('brief_id', brief.id).order('created_at', { ascending: false }).limit(1).single()
        : Promise.resolve({ data: null }),
    ])

    const questions = reviewsRes.data?.questions || []

    res.json({
      project,
      brief: {
        ...brief,
        references: refRes.data || [],
        files: assetRes.data || [],
        questions,
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/c/:token/brief — Autosave brief draft (PRD D4)
clientFormRouter.patch('/:token/brief', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    const { current_step, audience, visual_direction, content, assets_checklist, output, references } = req.body

    // 1. Verify project & token
    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id, status, link_enabled')
      .eq('share_token', token)
      .single()

    if (pError || !project || !project.link_enabled) {
      res.status(403).json({ error: 'Unauthorized or link inactive' })
      return
    }

    // Update status to in_progress if still 'sent'
    if (project.status === 'sent') {
      await supabase.from('projects').update({ status: 'in_progress' }).eq('id', project.id)
    }

    // 2. Update brief
    const updatePayload: Record<string, any> = {}
    if (current_step) updatePayload.current_step = current_step
    if (audience) updatePayload.audience = audience
    if (visual_direction) updatePayload.visual_direction = visual_direction
    if (content) updatePayload.content = content
    if (assets_checklist) updatePayload.assets_checklist = assets_checklist
    if (output) updatePayload.output = output

    const { data: updatedBrief, error: bError } = await supabase
      .from('briefs')
      .update(updatePayload)
      .eq('project_id', project.id)
      .select('id')
      .single()

    if (bError) throw bError

    // 3. Update references if provided
    if (Array.isArray(references) && updatedBrief) {
      // Replace references cleanly
      await supabase.from('references').delete().eq('brief_id', updatedBrief.id)
      if (references.length > 0) {
        const refRows = references.map((r: any, idx: number) => ({
          brief_id: updatedBrief.id,
          kind: r.kind || 'url',
          url: r.url,
          note: r.note || null,
          position: idx,
        }))
        await supabase.from('references').insert(refRows)
      }
    }

    res.json({ success: true, message: 'Autosaved successfully' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/c/:token/submit — Submit completed brief (PRD AC-10)
clientFormRouter.post('/:token/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id, status, link_enabled')
      .eq('share_token', token)
      .single()

    if (pError || !project || !project.link_enabled) {
      res.status(403).json({ error: 'Link disabled or invalid' })
      return
    }

    // Transition project status to 'submitted'
    await Promise.all([
      supabase.from('projects').update({ status: 'submitted' }).eq('id', project.id),
      supabase.from('briefs').update({ submitted_at: new Date().toISOString() }).eq('project_id', project.id),
      // Record analytics event (PRD Section 19)
      supabase.from('events').insert([
        {
          project_id: project.id,
          name: 'form_submitted',
          meta: { timestamp: new Date().toISOString() },
        },
      ]),
    ])

    res.json({ success: true, message: 'Brief successfully submitted to designer' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

