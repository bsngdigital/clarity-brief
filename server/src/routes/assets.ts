import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { supabase } from '../supabase.js'

export const assetsRouter = Router()

// Memory storage for multer so we can directly pipe the buffer to Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max per file (PRD Section 12)
  },
})

const BUCKET_NAME = 'project-assets'

// POST /api/c/:token/assets — Upload file asset for a project brief
assetsRouter.post('/:token/assets', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    const category = (req.body.category as string) || 'other'
    const file = req.file

    if (!file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    // 1. Find project and brief
    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id, link_enabled, brief:briefs(id)')
      .eq('share_token', token)
      .single()

    if (pError || !project || !project.link_enabled || !project.brief) {
      res.status(403).json({ error: 'Invalid token or inactive link' })
      return
    }

    const briefId = (project.brief as any).id
    const fileExt = file.originalname.split('.').pop()
    const storagePath = `${briefId}/${Date.now()}_${file.originalname}`

    // 2. Upload to Supabase Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      })

    if (storageError) {
      // If bucket doesn't exist, provide a descriptive error
      res.status(500).json({
        error: `Supabase Storage upload failed: ${storageError.message}. Please ensure bucket '${BUCKET_NAME}' is created in Supabase.`,
      })
      return
    }

    // 3. Insert record in `assets` table
    const { data: asset, error: dbError } = await supabase
      .from('assets')
      .insert([
        {
          brief_id: briefId,
          category,
          file_name: file.originalname,
          mime_type: file.mimetype,
          size_bytes: file.size,
          storage_key: storagePath,
          status: 'ready',
        },
      ])
      .select()
      .single()

    if (dbError) throw dbError

    res.status(201).json(asset)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/c/:token/assets/:assetId — Delete asset
assetsRouter.delete('/:token/assets/:assetId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, assetId } = req.params

    // 1. Verify project
    const { data: project, error: pError } = await supabase
      .from('projects')
      .select('id, brief:briefs(id)')
      .eq('share_token', token)
      .single()

    if (pError || !project || !project.brief) {
      res.status(403).json({ error: 'Unauthorized' })
      return
    }

    // 2. Find asset record
    const { data: asset, error: aError } = await supabase
      .from('assets')
      .select('id, storage_key')
      .eq('id', assetId)
      .single()

    if (aError || !asset) {
      res.status(404).json({ error: 'Asset not found' })
      return
    }

    // 3. Remove from storage and DB
    await Promise.all([
      supabase.storage.from(BUCKET_NAME).remove([asset.storage_key]),
      supabase.from('assets').delete().eq('id', assetId),
    ])

    res.json({ success: true, message: 'Asset deleted' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

