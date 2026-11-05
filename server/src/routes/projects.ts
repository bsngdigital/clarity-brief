import { Router, type Request, type Response } from 'express'
import crypto from 'node:crypto'
import { supabase } from '../supabase.js'

export const projectsRouter = Router()

// Helper to generate cryptographic 32-character random share token (PRD Section 8 & 16)
function generateShareToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

// Normalize brief object to guarantee complete data structure and prevent null/undefined property crashes
function normalizeBrief(brief: any) {
  if (!brief) return null
  const b = Array.isArray(brief) ? brief[0] : brief
  if (!b) return null

  return {
    ...b,
    version: b.version ?? 1,
    audience: {
      target: b.audience?.target ?? '',
      age_range: b.audience?.age_range ?? '25-34',
      demographic: b.audience?.demographic ?? '',
      desired_reaction: Array.isArray(b.audience?.desired_reaction) ? b.audience.desired_reaction : [],
    },
    visual_direction: {
      styles: Array.isArray(b.visual_direction?.styles) ? b.visual_direction.styles : [],
      styles_undecided: Boolean(b.visual_direction?.styles_undecided),
      avoid_styles: Array.isArray(b.visual_direction?.avoid_styles) ? b.visual_direction.avoid_styles : [],
      moods: Array.isArray(b.visual_direction?.moods) ? b.visual_direction.moods : [],
      likes: Array.isArray(b.visual_direction?.likes) ? b.visual_direction.likes : [],
      avoid: Array.isArray(b.visual_direction?.avoid) ? b.visual_direction.avoid : [],
      avoid_note: b.visual_direction?.avoid_note ?? '',
      colors: {
        mode: b.visual_direction?.colors?.mode ?? 'suggest',
        palette: Array.isArray(b.visual_direction?.colors?.palette) ? b.visual_direction.colors.palette : [],
        note: b.visual_direction?.colors?.note ?? '',
      },
      typography: b.visual_direction?.typography ?? 'not_sure',
    },
    content: {
      copy_status: b.content?.copy_status ?? 'will_provide',
      copy: b.content?.copy ?? '',
    },
    assets_checklist: b.assets_checklist && typeof b.assets_checklist === 'object' ? b.assets_checklist : {},
    files: Array.isArray(b.files) ? b.files : [],
    references: Array.isArray(b.references) ? b.references : [],
    output: b.output && typeof b.output === 'object' ? b.output : {},
    questions: Array.isArray(b.questions) ? b.questions : [],
  }
}

// GET /api/projects — List all projects
projectsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*, client:clients(id, name, company), brief:briefs(*)')
      .order('created_at', { ascending: false })

    if (error) throw error

    const projects = (data || []).map((p: any) => ({
      ...p,
      deliverables: Array.isArray(p.deliverables) ? p.deliverables : [],
      brief: normalizeBrief(p.brief),
    }))

    res.json(projects)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/projects — Create a new project & initialize brief
projectsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { client_id, name, type, objective, deliverables, deadline, language } = req.body

    if (!name || !type || !objective) {
      res.status(400).json({ error: 'name, type, and objective are required fields' })
      return
    }

    const share_token = generateShareToken()

    // 1. Create project
    const { data: project, error: pError } = await supabase
      .from('projects')
      .insert([
        {
          client_id,
          name,
          type,
          objective,
          deliverables: deliverables || [],
          deadline: deadline || null,
          language: language || 'id',
          status: 'draft',
          share_token,
          link_enabled: true,
        },
      ])
      .select()
      .single()

    if (pError) throw pError

    // 2. Initialize corresponding brief (1-to-1)
    const { error: bError } = await supabase.from('briefs').insert([
      {
        project_id: project.id,
        version: 1,
        current_step: 'welcome',
      },
    ])

    if (bError) throw bError

    res.status(201).json(project)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/projects/:id — Get single project with all relations
projectsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('*, client:clients(*), brief:briefs(*)')
      .eq('id', id)
      .single()

    if (pError) throw pError
    if (!project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    const brief = normalizeBrief(project.brief)

    // Also fetch references, assets, and reviews for the brief
    if (brief) {
      const [refRes, assetRes, reviewsRes] = await Promise.all([
        supabase.from('references').select('*').eq('brief_id', brief.id),
        supabase.from('assets').select('*').eq('brief_id', brief.id),
        supabase.from('reviews').select('*, questions:review_questions(*)').eq('brief_id', brief.id).order('created_at', { ascending: false }),
      ])

      brief.references = refRes.data || []
      brief.files = assetRes.data || []
      brief.reviews = reviewsRes.data || []
    }

    project.deliverables = Array.isArray(project.deliverables) ? project.deliverables : []
    project.brief = brief

    res.json(project)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/projects/:id — Update project info
projectsRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, type, objective, deliverables, deadline, language } = req.body

    const { data, error } = await supabase
      .from('projects')
      .update({ name, type, objective, deliverables, deadline, language })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/projects/:id — Hard delete project
projectsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    res.json({ success: true, message: 'Project deleted' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/projects/:id/link/regenerate — Regenerate share link token (PRD AC-03)
projectsRouter.post('/:id/link/regenerate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const new_token = generateShareToken()

    const { data, error } = await supabase
      .from('projects')
      .update({ share_token: new_token, link_enabled: true })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, share_token: data.share_token })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/projects/:id/link/disable — Toggle link status (PRD AC-03)
projectsRouter.post('/:id/link/disable', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { link_enabled } = req.body

    const { data, error } = await supabase
      .from('projects')
      .update({ link_enabled: typeof link_enabled === 'boolean' ? link_enabled : false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, link_enabled: data.link_enabled })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/projects/:id/review — Designer Review (Approve, Clarify, Reopen) (PRD Section 13)
projectsRouter.post('/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { decision, internal_note, questions } = req.body
    // decision: 'approved' | 'needs_clarification' | 'reopen'

    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('*, brief:briefs(*)')
      .eq('id', id)
      .single()

    if (pError || !project) {
      res.status(404).json({ error: 'Project not found' })
      return
    }

    const brief = Array.isArray(project.brief) ? project.brief[0] : project.brief
    if (!brief) {
      res.status(404).json({ error: 'Associated brief not found' })
      return
    }

    if (decision === 'approved') {
      // Approve Brief
      await Promise.all([
        supabase.from('projects').update({ status: 'approved' }).eq('id', id),
        supabase.from('briefs').update({ approved_at: new Date().toISOString() }).eq('project_id', id),
        supabase.from('reviews').insert([
          {
            brief_id: brief.id,
            version: brief.version ?? 1,
            decision: 'approved',
            internal_note,
          },
        ]),
      ])
      res.json({ success: true, status: 'approved' })
      return
    }

    if (decision === 'needs_clarification') {
      // Needs clarification
      const { data: rev, error: revError } = await supabase
        .from('reviews')
        .insert([
          {
            brief_id: brief.id,
            version: brief.version ?? 1,
            decision: 'needs_clarification',
            internal_note,
          },
        ])
        .select()
        .single()

      if (revError) throw revError

      // Save questions
      if (Array.isArray(questions) && questions.length > 0) {
        const qRows = questions.map((q) => ({
          review_id: rev.id,
          section: q.section,
          client_question: q.client_question,
        }))
        await supabase.from('review_questions').insert(qRows)
      }

      await supabase.from('projects').update({ status: 'needs_clarification' }).eq('id', id)
      res.json({ success: true, status: 'needs_clarification' })
      return
    }

    if (decision === 'reopen') {
      // Reopen approved brief -> bumps version (PRD D6)
      const newVersion = (brief.version || 1) + 1
      await Promise.all([
        supabase.from('projects').update({ status: 'needs_clarification' }).eq('id', id),
        supabase.from('briefs').update({ version: newVersion, approved_at: null }).eq('project_id', id),
      ])
      res.json({ success: true, status: 'needs_clarification', version: newVersion })
      return
    }

    res.status(400).json({ error: 'Invalid review decision' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/projects/:id/interpretation — Update designer internal interpretation
projectsRouter.patch('/:id/interpretation', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { designer_interpretation } = req.body

    const { error } = await supabase
      .from('briefs')
      .update({ designer_interpretation })
      .eq('project_id', id)

    if (error) throw error
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

