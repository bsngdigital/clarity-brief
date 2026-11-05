import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Lock,
  MessageCircleQuestion,
  Palette,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import type { Ctx } from '../App'
import {
  ASSET_CATEGORIES,
  MOODS,
  SECTIONS,
  STYLES,
  TYPE_LABEL,
  formatBytes,
  formatDate,
  humanize,
  type AssetState,
  type Brief,
  type Project,
  type Reference,
  type StyleId,
} from '../data'
import { Button, Chip, StyleThumb, cx } from '../ui'
import { api } from '../api'

type FormStep =
  | 'welcome'
  | 'audience'
  | 'style'
  | 'mood'
  | 'preferences'
  | 'color'
  | 'references'
  | 'content'
  | 'conditional'
  | 'review'
  | 'submitted'

const PREFERENCE_LIKES = [
  'whitespace',
  'strong_typography',
  'clean_layout',
  'rich_imagery',
  'illustration',
  'bright_colors',
  'muted_colors',
  'dark_theme',
  'rounded_shapes',
  'sharp_geometry',
  'animation',
  'dense_information',
]

const PREFERENCE_AVOIDS = [
  'too_corporate',
  'too_dark',
  'too_playful',
  'too_busy',
  'bright_colors',
  'dense_information',
]

const AGE_RANGES = [
  { id: '<18', label: 'Under 18' },
  { id: '18-24', label: '18 – 24 years' },
  { id: '25-34', label: '25 – 34 years' },
  { id: '35-44', label: '35 – 44 years' },
  { id: '45-54', label: '45 – 54 years' },
  { id: '55+', label: '55+ years' },
  { id: 'mixed', label: 'All ages / Diverse' },
]

const DESIRED_REACTIONS = [
  { id: 'trust', label: 'Trust & Credibility', desc: 'Terpercaya, profesional & aman' },
  { id: 'excitement', label: 'Excitement & Energy', desc: 'Antusias, bersemangat & seru' },
  { id: 'calm', label: 'Calm & Comfort', desc: 'Menenangkan, damai & ramah' },
  { id: 'curiosity', label: 'Curiosity & Discovery', desc: 'Memancing rasa ingin tahu' },
  { id: 'confidence', label: 'Confidence & Power', desc: 'Percaya diri & meyakinkan' },
  { id: 'joy', label: 'Joy & Delight', desc: 'Gembira, menyenangkan & segar' },
  { id: 'urgency', label: 'Urgency & Action', desc: 'Dorongan bertindak segera' },
  { id: 'belonging', label: 'Belonging & Connection', desc: 'Rasa terhubung & komunitas' },
]

export function ClientForm({
  token,
  ctx,
  initialStep = 'welcome',
  onBackToDesigner,
}: {
  token: string
  ctx: Ctx
  initialStep?: string
  onBackToDesigner?: () => void
}) {
  const project = ctx.projects.find((p) => p.share_token === token)
  const client = project ? ctx.clients.find((c) => c.id === project.client_id) : undefined

  // Language state (defaults to project.language or 'id')
  const [lang, setLang] = useState<'id' | 'en'>(project?.language ?? 'id')

  // Current step state
  const [step, setStep] = useState<FormStep>((initialStep as FormStep) || 'welcome')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savedTick, setSavedTick] = useState(false)

  // Local draft of brief
  const [brief, setBrief] = useState<Brief>(() => {
    if (project?.brief) {
      return JSON.parse(JSON.stringify(project.brief))
    }
    return {
      version: 1,
      audience: {
        target: '',
        age_range: '25-34',
        demographic: '',
        desired_reaction: [],
      },
      visual_direction: {
        styles: [],
        styles_undecided: false,
        avoid_styles: [],
        moods: [],
        moods_undecided: false,
        likes: [],
        avoid: [],
        avoid_note: '',
        colors: {
          mode: 'suggest',
          palette: ['#172019', '#B7EF2A', '#EFF9D6'],
          note: '',
        },
        typography: 'not_sure',
      },
      content: {
        copy_status: 'will_provide',
        copy: '',
      },
      assets_checklist: {
        logo: 'pending',
        brand_guideline: 'not_applicable',
        brand_colors: 'pending',
        brand_fonts: 'not_applicable',
        existing_design: 'not_applicable',
        product_images: 'pending',
        icons: 'not_applicable',
        illustrations: 'not_applicable',
        other: 'not_applicable',
      },
      files: [],
      references: [],
      output: {
        graphic: project?.type === 'uiux' ? undefined : {
          usage: ['instagram', 'website'],
          social_format: 'feed',
          print_size: 'A4',
          orientation: 'portrait',
          final_formats: ['png', 'jpg'],
        },
        uiux: project?.type === 'graphic' ? undefined : {
          design_target: 'website',
          platforms: ['desktop', 'mobile'],
          existing_product: false,
          product_url: '',
          design_system: 'none',
          final_formats: ['figma'],
        },
      },
    }
  })

  // Debounced autosave back into project state & Supabase
  useEffect(() => {
    if (!project) return
    const timer = setTimeout(() => {
      ctx.update(project.id, (p) => {
        // If first interaction, move from 'sent' to 'in_progress'
        const nextStatus = p.status === 'sent' && step !== 'welcome' ? 'in_progress' : p.status
        return {
          ...p,
          status: nextStatus,
          brief: {
            ...brief,
          },
        }
      })

      // Sync to live Supabase backend
      api.clientForm
        .autosave(token, {
          current_step: step,
          audience: brief.audience,
          visual_direction: brief.visual_direction,
          content: brief.content,
          assets_checklist: brief.assets_checklist,
          output: brief.output,
          references: brief.references,
        })
        .catch(() => {})

      setSavedTick(true)
      const tickTimer = setTimeout(() => setSavedTick(false), 1800)
      return () => clearTimeout(tickTimer)
    }, 800)

    return () => clearTimeout(timer)
  }, [brief, step, project?.id, token])

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setErrors({})
  }, [step])

  if (!project || !project.link_enabled) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="grid size-16 place-items-center rounded-3xl bg-danger/10 text-danger ring-1 ring-danger/20">
          <Lock className="size-8" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
          {lang === 'id' ? 'Tautan Tidak Aktif' : 'Link Inactive or Expired'}
        </h1>
        <p className="mt-2.5 max-w-md text-sm text-muted">
          {lang === 'id'
            ? 'Tautan form brief ini telah dinonaktifkan oleh desainer atau tidak valid. Silakan hubungi desainer Anda untuk meminta tautan baru.'
            : 'This brief link is disabled or no longer valid. Please contact your designer to request a new link.'}
        </p>
        {onBackToDesigner && (
          <Button variant="dark" onClick={onBackToDesigner} className="mt-8 rounded-full">
            <ArrowLeft className="size-4" /> Back to Designer View
          </Button>
        )}
      </div>
    )
  }

  const isClarificationMode = project.status === 'needs_clarification'
  const questions = project.brief?.questions || []

  // Check which sections have active clarification questions
  const clarificationSections = new Set(questions.map((q) => q.section))

  // Steps definition
  const STEPS: { id: FormStep; labelId: string; labelEn: string; num: number }[] = [
    { id: 'welcome', labelId: 'Selamat Datang', labelEn: 'Welcome', num: 1 },
    { id: 'audience', labelId: 'Target Audiens', labelEn: 'Audience', num: 2 },
    { id: 'style', labelId: 'Gaya Visual', labelEn: 'Visual Style', num: 3 },
    { id: 'mood', labelId: 'Suasana & Mood', labelEn: 'Mood', num: 4 },
    { id: 'preferences', labelId: 'Preferensi Visual', labelEn: 'Preferences', num: 5 },
    { id: 'color', labelId: 'Warna & Tipografi', labelEn: 'Color & Typography', num: 6 },
    { id: 'references', labelId: 'Referensi', labelEn: 'References', num: 7 },
    { id: 'content', labelId: 'Konten & Aset', labelEn: 'Content & Assets', num: 8 },
    { id: 'conditional', labelId: 'Detail Output', labelEn: 'Output Details', num: 9 },
    { id: 'review', labelId: 'Review & Kirim', labelEn: 'Review & Submit', num: 10 },
  ]

  const currentStepObj = STEPS.find((s) => s.id === step)
  const currentStepIndex = STEPS.findIndex((s) => s.id === step)
  const progressPercent = Math.max(8, Math.round(((currentStepIndex + 1) / STEPS.length) * 100))

  // Validate step before proceeding
  const validateStep = (current: FormStep): boolean => {
    const newErrors: Record<string, string> = {}

    if (current === 'audience') {
      if (!brief.audience.target || brief.audience.target.trim().length < 3) {
        newErrors.target = lang === 'id' ? 'Harap isi siapa target audiens desain ini (min. 3 karakter).' : 'Please describe who will see or use this design (min. 3 characters).'
      }
      if (!brief.audience.desired_reaction.length) {
        newErrors.desired_reaction = lang === 'id' ? 'Pilih minimal 1 reaksi yang diinginkan.' : 'Select at least 1 desired reaction.'
      }
    }

    if (current === 'style') {
      if (!brief.visual_direction.styles_undecided && brief.visual_direction.styles.length === 0) {
        newErrors.styles = lang === 'id' ? 'Pilih 1–3 gaya visual atau centang "Serahkan ke desainer".' : 'Select 1–3 visual styles or choose "Let designer decide".'
      }
    }

    if (current === 'mood') {
      if (!brief.visual_direction.moods_undecided && brief.visual_direction.moods.length === 0) {
        newErrors.moods = lang === 'id' ? 'Pilih minimal 1 mood atau centang "Belum yakin".' : 'Select at least 1 mood or choose "Not sure".'
      }
    }

    if (current === 'conditional') {
      if (project.type === 'graphic' || project.type === 'both') {
        if (!brief.output.graphic?.usage?.length) {
          newErrors.graphic_usage = lang === 'id' ? 'Pilih minimal satu media penggunaan desain grafis.' : 'Select at least one intended graphic usage.'
        }
      }
      if (project.type === 'uiux' || project.type === 'both') {
        if (!brief.output.uiux?.design_target) {
          newErrors.uiux_target = lang === 'id' ? 'Pilih jenis produk UI/UX yang akan didesain.' : 'Select the primary UI/UX design target.'
        }
        if (!brief.output.uiux?.platforms?.length) {
          newErrors.uiux_platforms = lang === 'id' ? 'Pilih minimal satu platform target.' : 'Select at least one target platform.'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goNext = () => {
    if (!validateStep(step)) return

    const currentIndex = STEPS.findIndex((s) => s.id === step)
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1].id)
    } else if (step === 'review') {
      submitBrief()
    }
  }

  const goPrev = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === step)
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1].id)
    }
  }

  const submitBrief = () => {
    // Validate everything
    const isValid = validateStep('audience') && validateStep('style') && validateStep('mood') && validateStep('conditional')
    if (!isValid) {
      setStep('audience')
      return
    }

    ctx.update(project.id, (p) => ({
      ...p,
      status: 'submitted',
      brief: {
        ...brief,
        submitted_at: new Date().toISOString(),
        questions: undefined, // cleared on resubmit
      },
    }))
    // Sync to Supabase
    api.clientForm.submit(token).catch(() => {})
    setStep('submitted')
    ctx.notify(lang === 'id' ? 'Brief berhasil dikirim ke desainer!' : 'Brief successfully submitted to designer!')
  }

  return (
    <div className="relative min-h-screen bg-bg text-ink selection:bg-primary selection:text-ink">
      {/* Top Banner if in preview mode */}
      {onBackToDesigner && (
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <span className="grid size-5 place-items-center rounded-full bg-primary text-ink">
              <Eye className="size-3" />
            </span>
            <span>{lang === 'id' ? 'Pratinjau Klien (Sebagai Klien)' : 'Client Preview Mode'}</span>
            <span className="hidden sm:inline">· {project.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="flex items-center gap-1 rounded-full border border-line bg-bg px-2.5 py-1 text-xs font-bold transition hover:bg-surface"
            >
              <Globe className="size-3" /> {lang === 'id' ? 'English' : 'Bahasa'}
            </button>
            <Button size="sm" variant="dark" onClick={onBackToDesigner} className="rounded-full">
              <ArrowLeft className="size-3.5" /> {lang === 'id' ? 'Kembali ke Dashboard' : 'Back to Designer'}
            </Button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header / Brand & Progress */}
        {step !== 'submitted' && (
          <header className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-xl bg-ink text-white">
                  <span className="size-3 rounded-full bg-primary" />
                </span>
                <div>
                  <div className="text-xs font-extrabold tracking-tight uppercase text-muted">Design Brief</div>
                  <div className="text-sm font-bold">{project.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {savedTick && (
                  <span className="flex items-center gap-1 text-xs font-medium text-muted transition animate-fade-in">
                    <Check className="size-3 text-success" />
                    <span className="hidden sm:inline">{lang === 'id' ? 'Tersimpan' : 'Autosaved'}</span>
                  </span>
                )}
                {step !== 'welcome' && (
                  <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-muted ring-1 ring-line">
                    Step {currentStepObj?.num} / 10
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {step !== 'welcome' && (
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface ring-1 ring-line">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </header>
        )}

        {/* Clarification Alert if active */}
        {isClarificationMode && step !== 'submitted' && (
          <div className="mb-6 rounded-2xl border border-[#F3CFCF] bg-[#FBEAEA] p-4 text-[#9E3434]">
            <div className="flex items-start gap-3">
              <MessageCircleQuestion className="size-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">
                  {lang === 'id' ? 'Permintaan Klarifikasi dari Desainer' : 'Clarification Requested by Designer'}
                </h4>
                <p className="mt-1 text-xs leading-relaxed opacity-90">
                  {lang === 'id'
                    ? 'Desainer Anda memerlukan beberapa klarifikasi tambahan sebelum brief disetujui. Periksa pertanyaan di bawah dan sesuaikan jawaban Anda.'
                    : 'Your designer needs clarification on certain sections. Please review the highlighted questions below and update your responses.'}
                </p>
                {questions.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-[#F3CFCF]/60 pt-2">
                    {questions.map((q, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-bold uppercase tracking-wider">{humanize(q.section)}:</span> {q.client_question}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP CONTENT */}
        <main className="rounded-[24px] border border-line bg-surface p-6 shadow-sm sm:p-8">
          {step === 'welcome' && (
            <StepWelcome
              project={project}
              lang={lang}
              onStart={() => setStep('audience')}
            />
          )}

          {step === 'audience' && (
            <StepAudience
              brief={brief}
              setBrief={setBrief}
              errors={errors}
              lang={lang}
            />
          )}

          {step === 'style' && (
            <StepStyle
              brief={brief}
              setBrief={setBrief}
              errors={errors}
              lang={lang}
            />
          )}

          {step === 'mood' && (
            <StepMood
              brief={brief}
              setBrief={setBrief}
              errors={errors}
              lang={lang}
            />
          )}

          {step === 'preferences' && (
            <StepPreferences
              brief={brief}
              setBrief={setBrief}
              lang={lang}
            />
          )}

          {step === 'color' && (
            <StepColor
              brief={brief}
              setBrief={setBrief}
              lang={lang}
            />
          )}

          {step === 'references' && (
            <StepReferences
              brief={brief}
              setBrief={setBrief}
              lang={lang}
            />
          )}

          {step === 'content' && (
            <StepContent
              brief={brief}
              setBrief={setBrief}
              lang={lang}
              token={token}
            />
          )}

          {step === 'conditional' && (
            <StepConditional
              project={project}
              brief={brief}
              setBrief={setBrief}
              errors={errors}
              lang={lang}
            />
          )}

          {step === 'review' && (
            <StepReview
              project={project}
              brief={brief}
              lang={lang}
              onEditStep={(s) => setStep(s)}
            />
          )}

          {step === 'submitted' && (
            <StepSubmitted
              project={project}
              lang={lang}
              onBackToDesigner={onBackToDesigner}
            />
          )}

          {/* Bottom Navigation Buttons */}
          {step !== 'welcome' && step !== 'submitted' && (
            <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
              <Button
                variant="ghost"
                onClick={goPrev}
                disabled={currentStepIndex === 0}
                className="rounded-full"
              >
                <ChevronLeft className="size-4" />
                {lang === 'id' ? 'Kembali' : 'Back'}
              </Button>

              <Button
                variant="primary"
                onClick={goNext}
                className="rounded-full px-6"
              >
                {step === 'review' ? (
                  <>
                    <Send className="size-4" />
                    {lang === 'id' ? 'Kirim Brief Sekarang' : 'Submit Brief Now'}
                  </>
                ) : (
                  <>
                    {lang === 'id' ? 'Lanjutkan' : 'Next Step'}
                    <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

/* ---------------- STEP 1: WELCOME ---------------- */
function StepWelcome({
  project,
  lang,
  onStart,
}: {
  project: Project
  lang: 'id' | 'en'
  onStart: () => void
}) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-soft px-3 py-1 text-xs font-bold text-ink ring-1 ring-[#D8EFA3]">
        <Sparkles className="size-3.5 text-primary-strong" />
        {lang === 'id' ? 'Panduan Brief Interaktif' : 'Visual Brief Intake'}
      </div>

      <h1 className="mt-4 text-[32px] font-extrabold leading-tight tracking-tight sm:text-[40px]">
        {lang === 'id' ? 'Kumpulkan Kebutuhan Desain Anda' : 'Let’s Build Your Design Brief'}
      </h1>

      <p className="mx-auto mt-3 max-w-lg text-sm text-muted leading-relaxed sm:text-base">
        {lang === 'id'
          ? 'Formulir ini memandu Anda menyampaikan preferensi visual, audiens, dan referensi agar desainer memahami ekspektasi Anda secara akurat.'
          : 'A visual, progressive form designed to turn your ideas into a crystal-clear creative brief. Takes only 5–10 minutes.'}
      </p>

      {/* Project summary card */}
      <div className="my-8 rounded-2xl border border-line bg-bg/50 p-5 text-left text-sm space-y-3">
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <span className="text-muted font-medium">{lang === 'id' ? 'Proyek' : 'Project'}</span>
          <span className="font-bold">{project.name}</span>
        </div>
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <span className="text-muted font-medium">{lang === 'id' ? 'Tipe' : 'Type'}</span>
          <span className="font-semibold">{TYPE_LABEL[project.type]}</span>
        </div>
        <div>
          <span className="text-muted font-medium block mb-1">{lang === 'id' ? 'Tujuan' : 'Objective'}</span>
          <p className="text-ink/90 font-medium leading-relaxed">{project.objective}</p>
        </div>
        {project.deliverables?.length > 0 && (
          <div>
            <span className="text-muted font-medium block mb-1">{lang === 'id' ? 'Deliverables' : 'Deliverables'}</span>
            <div className="flex flex-wrap gap-1.5">
              {project.deliverables.map((d, i) => (
                <span key={i} className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold ring-1 ring-line">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-muted mb-8">
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" /> 5–10 {lang === 'id' ? 'menit' : 'minutes'}
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="size-4 text-success" /> {lang === 'id' ? 'Tersimpan otomatis' : 'Autosaved'}
        </span>
      </div>

      <Button variant="primary" size="lg" onClick={onStart} className="w-full rounded-full sm:w-auto sm:px-10">
        {lang === 'id' ? 'Mulai Sekarang' : 'Get Started'} <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}

/* ---------------- STEP 2: AUDIENCE ---------------- */
function StepAudience({
  brief,
  setBrief,
  errors,
  lang,
}: {
  brief: Brief
  setBrief: React.Dispatch<React.SetStateAction<Brief>>
  errors: Record<string, string>
  lang: 'id' | 'en'
}) {
  const { target, age_range, demographic, desired_reaction } = brief.audience

  const toggleReaction = (id: string) => {
    setBrief((b) => {
      const current = b.audience.desired_reaction
      const exists = current.includes(id)
      if (exists) {
        return { ...b, audience: { ...b.audience, desired_reaction: current.filter((x) => x !== id) } }
      }
      if (current.length >= 3) return b
      return { ...b, audience: { ...b.audience, desired_reaction: [...current, id] } }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {lang === 'id' ? 'Langkah 2 dari 10' : 'Step 2 of 10'}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {lang === 'id' ? 'Siapa target audiens Anda?' : 'Who is this design for?'}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {lang === 'id'
            ? 'Bantu desainer memahami audiens yang akan melihat dan berinteraksi dengan karya ini.'
            : 'Help the designer visualize who will interact with your final design.'}
        </p>
      </div>

      {/* Target input */}
      <div>
        <label className="block text-sm font-bold mb-1.5">
          {lang === 'id' ? 'Deskripsi Target Audiens' : 'Primary Target Audience'} <span className="text-danger">*</span>
        </label>
        <textarea
          rows={3}
          value={target}
          onChange={(e) => setBrief((b) => ({ ...b, audience: { ...b.audience, target: e.target.value } }))}
          placeholder={lang === 'id' ? 'Contoh: Profesional muda usia 25-35 tahun di kota besar yang menyukai kopi spesialti...' : 'e.g. Young professionals in urban areas looking for healthier food choices...'}
          className={cx(
            'w-full rounded-xl border bg-surface p-3.5 text-sm outline-none transition',
            errors.target ? 'border-danger focus:ring-2 focus:ring-danger/20' : 'border-line focus:border-ink/40 focus:ring-4 focus:ring-primary/20',
          )}
        />
        {errors.target && <p className="mt-1 text-xs font-medium text-danger">{errors.target}</p>}
      </div>

      {/* Age range */}
      <div>
        <label className="block text-sm font-bold mb-1.5">
          {lang === 'id' ? 'Rentang Usia Dominan' : 'Dominant Age Range'} <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AGE_RANGES.map((ar) => (
            <button
              key={ar.id}
              type="button"
              onClick={() => setBrief((b) => ({ ...b, audience: { ...b.audience, age_range: ar.id } }))}
              className={cx(
                'rounded-xl border p-2.5 text-center text-xs font-bold transition',
                age_range === ar.id
                  ? 'border-ink bg-ink text-white shadow-sm'
                  : 'border-line bg-surface text-muted hover:border-ink/20 hover:text-ink',
              )}
            >
              {ar.label}
            </button>
          ))}
        </div>
      </div>

      {/* Demographic / Optional */}
      <div>
        <label className="block text-sm font-bold mb-1.5">
          {lang === 'id' ? 'Karakteristik Tambahan (Opsional)' : 'Additional Demographics (Optional)'}
        </label>
        <input
          type="text"
          value={demographic || ''}
          onChange={(e) => setBrief((b) => ({ ...b, audience: { ...b.audience, demographic: e.target.value } }))}
          placeholder={lang === 'id' ? 'Profesi, gaya hidup, minat, lokasi geografis...' : 'Profession, interests, lifestyle, region...'}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition focus:border-ink/40 focus:ring-4 focus:ring-primary/20"
        />
      </div>

      {/* Desired reaction */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-bold">
            {lang === 'id' ? 'Reaksi / Kesan yang Diinginkan' : 'Desired Emotional Reaction'} <span className="text-danger">*</span>
          </label>
          <span className="text-xs font-medium text-muted">
            {desired_reaction.length} / 3 {lang === 'id' ? 'terpilih' : 'selected'}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {DESIRED_REACTIONS.map((dr) => {
            const isSelected = desired_reaction.includes(dr.id)
            return (
              <button
                key={dr.id}
                type="button"
                onClick={() => toggleReaction(dr.id)}
                className={cx(
                  'flex items-start gap-3 rounded-xl border p-3 text-left transition',
                  isSelected
                    ? 'border-ink bg-soft ring-1 ring-primary/40'
                    : 'border-line bg-surface hover:border-ink/20',
                )}
              >
                <div
                  className={cx(
                    'grid size-5 shrink-0 place-items-center rounded-md border text-xs transition mt-0.5',
                    isSelected ? 'border-ink bg-ink text-white' : 'border-line bg-white',
                  )}
                >
                  {isSelected && <Check className="size-3.5" strokeWidth={3} />}
                </div>
                <div>
                  <div className="text-xs font-bold">{dr.label}</div>
                  <div className="text-[11px] text-muted leading-tight mt-0.5">{dr.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
        {errors.desired_reaction && <p className="mt-1 text-xs font-medium text-danger">{errors.desired_reaction}</p>}
      </div>
    </div>
  )
}

/* ---------------- STEP 3: VISUAL STYLE ---------------- */
function StepStyle({
  brief,
  setBrief,
  errors,
  lang,
}: {
  brief: Brief
  setBrief: React.Dispatch<React.SetStateAction<Brief>>
  errors: Record<string, string>
  lang: 'id' | 'en'
}) {
  const { styles, styles_undecided } = brief.visual_direction

  const toggleStyle = (id: StyleId) => {
    setBrief((b) => {
      const cur = b.visual_direction.styles
      const exists = cur.includes(id)
      if (exists) {
        return {
          ...b,
          visual_direction: { ...b.visual_direction, styles: cur.filter((x) => x !== id), styles_undecided: false },
        }
      }
      if (cur.length >= 3) return b
      return {
        ...b,
        visual_direction: { ...b.visual_direction, styles: [...cur, id], styles_undecided: false },
      }
    })
  }

  const setUndecided = (checked: boolean) => {
    setBrief((b) => ({
      ...b,
      visual_direction: {
        ...b.visual_direction,
        styles: checked ? [] : b.visual_direction.styles,
        styles_undecided: checked,
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {lang === 'id' ? 'Langkah 3 dari 10' : 'Step 3 of 10'}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {lang === 'id' ? 'Arah gaya visual yang Anda sukai' : 'What visual style feels right?'}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {lang === 'id' ? 'Pilih hingga 3 gaya visual yang paling mendekati selera Anda.' : 'Choose up to 3 visual styles that reflect your brand persona.'}
        </p>
      </div>

      {/* Undecided toggle */}
      <button
        type="button"
        onClick={() => setUndecided(!styles_undecided)}
        className={cx(
          'flex w-full items-center justify-between rounded-xl border p-3 text-sm font-semibold transition',
          styles_undecided
            ? 'border-ink bg-soft ring-1 ring-primary/40 text-ink'
            : 'border-dashed border-line bg-surface text-muted hover:text-ink',
        )}
      >
        <span>{lang === 'id' ? 'Belum yakin — serahkan rekomendasi kepada desainer' : 'Not sure — let the designer suggest'}</span>
        <div
          className={cx(
            'grid size-5 place-items-center rounded-md border text-xs',
            styles_undecided ? 'border-ink bg-ink text-white' : 'border-line bg-white',
          )}
        >
          {styles_undecided && <Check className="size-3.5" strokeWidth={3} />}
        </div>
      </button>

      {/* Style Grid */}
      <div className={cx('grid grid-cols-2 gap-3 sm:grid-cols-4', styles_undecided && 'pointer-events-none opacity-40')}>
        {STYLES.map((s) => {
          const isSelected = styles.includes(s.id)
          const disabled = !isSelected && styles.length >= 3
          return (
            <button
              key={s.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleStyle(s.id)}
              className={cx(
                'group relative flex flex-col overflow-hidden rounded-2xl border text-left transition',
                isSelected
                  ? 'border-ink ring-2 ring-primary bg-soft'
                  : 'border-line bg-surface hover:border-ink/20',
                disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <StyleThumb id={s.id} className="h-full w-full transition-transform duration-300 group-hover:scale-105" />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{s.name}</span>
                  {isSelected && (
                    <span className="grid size-4 place-items-center rounded-full bg-ink text-white">
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted">{s.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
      {errors.styles && <p className="text-xs font-medium text-danger">{errors.styles}</p>}
    </div>
  )
}

/* ---------------- STEP 4: MOOD ---------------- */
function StepMood({
  brief,
  setBrief,
  errors,
  lang,
}: {
  brief: Brief
  setBrief: React.Dispatch<React.SetStateAction<Brief>>
  errors: Record<string, string>
  lang: 'id' | 'en'
}) {
  const { moods, moods_undecided } = brief.visual_direction

  const toggleMood = (m: string) => {
    setBrief((b) => {
      const cur = b.visual_direction.moods
      const exists = cur.includes(m)
      if (exists) {
        return {
          ...b,
          visual_direction: { ...b.visual_direction, moods: cur.filter((x) => x !== m), moods_undecided: false },
        }
      }
      if (cur.length >= 3) return b
      return {
        ...b,
        visual_direction: { ...b.visual_direction, moods: [...cur, m], moods_undecided: false },
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {lang === 'id' ? 'Langkah 4 dari 10' : 'Step 4 of 10'}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {lang === 'id' ? 'Suasana & Karakter Mood' : 'What mood should it convey?'}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {lang === 'id' ? 'Pilih maksimal 3 kata sifat yang paling menggambarkan nuansa proyek ini.' : 'Select up to 3 adjectives describing the personality of this piece.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => {
          const isSelected = moods.includes(m)
          const disabled = !isSelected && moods.length >= 3
          return (
            <button
              key={m}
              type="button"
              disabled={disabled}
              onClick={() => toggleMood(m)}
              className={cx(
                'rounded-full px-4 py-2 text-xs font-bold capitalize transition',
                isSelected
                  ? 'bg-ink text-white ring-1 ring-ink shadow-sm'
                  : 'bg-surface text-muted ring-1 ring-line hover:border-ink/20 hover:text-ink',
                disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              {m}
            </button>
          )
        })}
      </div>
      {errors.moods && <p className="text-xs font-medium text-danger">{errors.moods}</p>}
    </div>
  )
}

/* ---------------- STEP 5: PREFERENCES & AVOID ---------------- */
function StepPreferences({
  brief,
  setBrief,
  lang,
}: {
  brief: Brief
  setBrief: React.Dispatch<React.SetStateAction<Brief>>
  lang: 'id' | 'en'
}) {
  const { likes, avoid, avoid_note } = brief.visual_direction

  const toggleLike = (item: string) => {
    setBrief((b) => {
      const cur = b.visual_direction.likes
      return {
        ...b,
        visual_direction: {
          ...b.visual_direction,
          likes: cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item],
        },
      }
    })
  }

  const toggleAvoid = (item: string) => {
    setBrief((b) => {
      const cur = b.visual_direction.avoid
      return {
        ...b,
        visual_direction: {
          ...b.visual_direction,
          avoid: cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item],
        },
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {lang === 'id' ? 'Langkah 5 dari 10' : 'Step 5 of 10'}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {lang === 'id' ? 'Hal yang Disukai & Hal yang Dihindari' : 'What you like & what to avoid'}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {lang === 'id'
            ? 'Memberi tahu apa yang TIDAK diinginkan sama pentingnya dengan apa yang diinginkan.'
            : 'Knowing what you want to steer away from is just as crucial.'}
        </p>
      </div>

      {/* Likes */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
          {lang === 'id' ? 'Elemen yang Anda Sukai (Likes)' : 'Elements you like'}
        </label>
        <div className="flex flex-wrap gap-2">
          {PREFERENCE_LIKES.map((l) => {
            const isSelected = likes.includes(l)
            return (
              <button
                key={l}
                type="button"
                onClick={() => toggleLike(l)}
                className={cx(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition',
                  isSelected
                    ? 'bg-soft text-ink ring-1 ring-[#D8EFA3]'
                    : 'bg-surface text-muted ring-1 ring-line hover:text-ink',
                )}
              >
                {humanize(l)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Avoid */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-danger mb-2">
          {lang === 'id' ? 'Hal yang TIDAK Diinginkan (Avoid)' : 'Things to strictly avoid'}
        </label>
        <div className="flex flex-wrap gap-2">
          {PREFERENCE_AVOIDS.map((a) => {
            const isSelected = avoid.includes(a)
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAvoid(a)}
                className={cx(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition',
                  isSelected
                    ? 'bg-[#FBEAEA] text-[#9E3434] ring-1 ring-[#F3CFCF] line-through'
                    : 'bg-surface text-muted ring-1 ring-line hover:text-ink',
                )}
              >
                {humanize(a)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Avoid note */}
      <div>
        <label className="block text-xs font-bold text-muted mb-1.5">
          {lang === 'id' ? 'Catatan Tambahan Mengenai Hal yang Dihindari' : 'Specific avoid notes (optional)'}
        </label>
        <textarea
          rows={2}
          maxLength={300}
          value={avoid_note || ''}
          onChange={(e) =>
            setBrief((b) => ({
              ...b,
              visual_direction: { ...b.visual_direction, avoid_note: e.target.value },
            }))
          }
          placeholder={lang === 'id' ? 'Contoh: Jangan gunakan warna neon atau ilustrasi kartun kekanak-kanakan...' : 'e.g. Please avoid gradients, clip-art, or overly dark moody backgrounds...'}
          className="w-full rounded-xl border border-line bg-surface p-3 text-xs outline-none focus:border-ink/40 focus:ring-4 focus:ring-primary/20"
        />
      </div>
    </div>
  )
}

/* ---------------- STEP 6: COLOR & TYPOGRAPHY ---------------- */
function StepColor({
  brief,
  setBrief,
  lang,
}: {
  brief: Brief
  setBrief: React.Dispatch<React.SetStateAction<Brief>>
  lang: 'id' | 'en'
}) {
  const { colors, typography } = brief.visual_direction

  const setMode = (mode: 'brand_colors' | 'suggest' | 'custom') => {
    setBrief((b) => ({
      ...b,
      visual_direction: {
        ...b.visual_direction,
        colors: { ...b.visual_direction.colors, mode },
      },
    }))
  }

  const updatePalette = (index: number, val: string) => {
    setBrief((b) => {
      const p = [...b.visual_direction.colors.palette]
      p[index] = val
      return {
        ...b,
        visual_direction: {
          ...b.visual_direction,
          colors: { ...b.visual_direction.colors, palette: p },
        },
      }
    })
  }

  const addColor = () => {
    if (colors.palette.length >= 5) return
    setBrief((b) => ({
      ...b,
      visual_direction: {
        ...b.visual_direction,
        colors: {
          ...b.visual_direction.colors,
          palette: [...b.visual_direction.colors.palette, '#7CF7FF'],
        },
      },
    }))
  }

  const removeColor = (idx: number) => {
    setBrief((b) => ({
      ...b,
      visual_direction: {
        ...b.visual_direction,
        colors: {
          ...b.visual_direction.colors,
          palette: b.visual_direction.colors.palette.filter((_, i) => i !== idx),
        },
      },
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {lang === 'id' ? 'Langkah 6 dari 10' : 'Step 6 of 10'}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {lang === 'id' ? 'Palet Warna & Karakter Huruf' : 'Colors & Typography'}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {lang === 'id' ? 'Pilih bagaimana desainer sebaiknya menentukan warna karya Anda.' : 'Tell us how you would like color choices to be handled.'}
        </p>
      </div>

      {/* Mode selection */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            id: 'brand_colors',
            label: lang === 'id' ? 'Gunakan Brand Guide' : 'Existing Brand Colors',
            desc: lang === 'id' ? 'Sesuai warna identitas yang sudah ada' : 'Follow our brand guideline palette',
          },
          {
            id: 'suggest',
            label: lang === 'id' ? 'Rekomendasi Desainer' : 'Designer Recommends',
            desc: lang === 'id' ? 'Bebaskan desainer mengeksplorasi warna' : 'Let the designer craft a fresh palette',
          },
          {
            id: 'custom',
            label: lang === 'id' ? 'Pilih Sendiri' : 'Custom Palette',
            desc: lang === 'id' ? 'Tentukan sendiri warna heksadesimal' : 'Pick specific hex colors you love',
          },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id as any)}
            className={cx(
              'rounded-xl border p-3.5 text-left transition',
              colors.mode === m.id
                ? 'border-ink bg-soft ring-1 ring-primary/40'
                : 'border-line bg-surface hover:border-ink/20',
            )}
          >
            <div className="text-xs font-bold">{m.label}</div>
            <div className="mt-1 text-[11px] text-muted">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Custom palette UI if custom */}
      {colors.mode === 'custom' && (
        <div className="rounded-xl border border-line bg-bg/50 p-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-muted">
            {lang === 'id' ? 'Warna Pilihan Anda (Hingga 5)' : 'Your Selected Colors (Up to 5)'}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {colors.palette.map((hex, idx) => (
              <div key={idx} className="flex items-center gap-1.5 rounded-xl border border-line bg-surface p-1.5 shadow-sm">
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => updatePalette(idx, e.target.value)}
                  className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono font-bold pr-1">{hex}</span>
                {colors.palette.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColor(idx)}
                    className="grid size-5 place-items-center rounded text-muted hover:text-danger"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            ))}
            {colors.palette.length < 5 && (
              <button
                type="button"
                onClick={addColor}
                className="flex items-center gap-1 rounded-xl border border-dashed border-line bg-surface px-3 py-2 text-xs font-bold text-muted hover:border-ink hover:text-ink"
              >
                <Plus className="size-3.5" /> {lang === 'id' ? 'Tambah Warna' : 'Add Color'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Typography preference */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
          {lang === 'id' ? 'Karakter Tipografi yang Diinginkan' : 'Typography Preference'}
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            { id: 'sans', label: 'Clean Sans-Serif', sample: 'Modern & readable' },
            { id: 'serif', label: 'Classic Serif', sample: 'Editorial & elegant' },
            { id: 'display', label: 'Bold Display', sample: 'High impact' },
            { id: 'handwritten', label: 'Handwritten / Script', sample: 'Warm & human' },
            { id: 'not_sure', label: 'Not Sure', sample: 'Let designer choose' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                setBrief((b) => ({
                  ...b,
                  visual_direction: { ...b.visual_direction, typography: t.id },
                }))
              }
              className={cx(
                'rounded-xl border p-2.5 text-center text-xs transition',
                typography === t.id
                  ? 'border-ink bg-ink text-white font-bold'
                  : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              <div>{t.label}</div>
              <div className="text-[10px] opacity-70 mt-0.5">{t.sample}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------------- STEP 7: REFERENCES ---------------- */
function StepReferences({
  brief,
  setBrief,
  lang,
}: {
  brief: Brief
  setBrief: React.Dispatch<React.SetStateAction<Brief>>
  lang: 'id' | 'en'
}) {
  const [newUrl, setNewUrl] = useState('')
  const [newNote, setNewNote] = useState('')

  const addReference = () => {
    if (!newUrl.trim()) return
    const refItem: Reference = {
      id: `ref_${Date.now()}`,
      kind: 'url',
      url: newUrl.trim(),
      note: newNote.trim() || undefined,
    }
    setBrief((b) => ({ ...b, references: [...b.references, refItem] }))
    setNewUrl('')
    setNewNote('')
  }

  const removeReference = (id: string) => {
    setBrief((b) => ({ ...b, references: b.references.filter((r) => r.id !== id) }))
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {lang === 'id' ? 'Langkah 7 dari 10' : 'Step 7 of 10'}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {lang === 'id' ? 'Referensi & Contoh yang Menginspirasi' : 'Visual References & Inspiration'}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {lang === 'id'
            ? 'Tautan Pinterest, Behance, Dribbble, atau website yang memiliki getaran/vibes yang Anda sukai.'
            : 'Add up to 6 links to designs or products that inspire the direction you want.'}
        </p>
      </div>

      {/* Add new reference box */}
      <div className="rounded-2xl border border-line bg-bg/50 p-4 space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-muted">
          {lang === 'id' ? 'Tambah Tautan Referensi' : 'Add Reference URL'}
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://behance.net/... or https://pinterest.com/..."
            className="flex-1 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm outline-none focus:border-ink/40"
          />
          <Button variant="dark" onClick={addReference} disabled={!newUrl.trim() || brief.references.length >= 6}>
            <Plus className="size-4" /> {lang === 'id' ? 'Tambah' : 'Add'}
          </Button>
        </div>
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder={lang === 'id' ? 'Catatan singkat: Apa yang kamu suka dari link ini?' : 'Note: What do you like about this example?'}
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-xs outline-none focus:border-ink/40"
        />
      </div>

      {/* Existing references list */}
      <div className="space-y-2">
        {brief.references.map((r, i) => (
          <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-surface p-3 text-xs">
            <div className="min-w-0 flex-1">
              <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-bold text-ink hover:underline truncate">
                <LinkIcon className="size-3.5 text-muted shrink-0" />
                {r.url}
              </a>
              {r.note && <p className="mt-1 text-muted leading-relaxed">{r.note}</p>}
            </div>
            <button
              type="button"
              onClick={() => removeReference(r.id)}
              className="grid size-6 place-items-center rounded text-muted hover:text-danger"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- STEP 8: CONTENT & ASSETS ---------------- */
function StepContent({
  brief,
  setBrief,
  lang,
  token,
}: {
  brief: Brief
  setBrief: React.Dispatch<React.SetStateAction<Brief>>
  lang: 'id' | 'en'
  token: string
}) {
  const { copy_status, copy } = brief.content
  const checklist = brief.assets_checklist
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const setChecklistState = (cat: string, state: AssetState) => {
    setBrief((b) => ({
      ...b,
      assets_checklist: { ...b.assets_checklist, [cat]: state },
    }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const res = await api.clientForm.uploadAsset(token, file, 'other')
      if (res?.id) {
        setBrief((b) => ({ ...b, files: [...b.files, res] }))
      }
    } catch {
      // Fallback local representation if storage bucket is not configured yet
      const fakeId = `file_${Date.now()}`
      const fakeFile = {
        id: fakeId,
        category: 'other',
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size,
      }
      setBrief((b) => ({ ...b, files: [...b.files, fakeFile] }))
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {lang === 'id' ? 'Langkah 8 dari 10' : 'Step 8 of 10'}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {lang === 'id' ? 'Konten Teks & Aset yang Tersedia' : 'Content & Asset Availability'}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {lang === 'id' ? 'Tentukan status naskah (copywriting) dan ketersediaan aset seperti logo atau foto.' : 'Clarify text readiness and asset inventory for this project.'}
        </p>
      </div>

      {/* Copy status */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
          {lang === 'id' ? 'Status Naskah / Teks Desain' : 'Copywriting & Text Readiness'}
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            { id: 'will_provide', label: lang === 'id' ? 'Naskah Sudah Siap' : 'Ready / Will Provide', desc: lang === 'id' ? 'Teks final siap ditempel' : 'Final copy ready to place' },
            { id: 'in_preparation', label: lang === 'id' ? 'Sedang Disiapkan' : 'In Preparation', desc: lang === 'id' ? 'Naskah akan menyusul segera' : 'Drafting now, sending soon' },
            { id: 'need_help', label: lang === 'id' ? 'Butuh Bantuan Desainer' : 'Need Copywriting Help', desc: lang === 'id' ? 'Bantu susun copywriting' : 'Need copy recommendations' },
          ].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setBrief((b) => ({ ...b, content: { ...b.content, copy_status: c.id as any } }))}
              className={cx(
                'rounded-xl border p-3 text-left transition',
                copy_status === c.id
                  ? 'border-ink bg-soft ring-1 ring-primary/40 font-bold'
                  : 'border-line bg-surface hover:border-ink/20',
              )}
            >
              <div className="text-xs">{c.label}</div>
              <div className="text-[11px] text-muted font-normal mt-0.5">{c.desc}</div>
            </button>
          ))}
        </div>
        {copy_status === 'will_provide' && (
          <textarea
            rows={3}
            value={copy || ''}
            onChange={(e) => setBrief((b) => ({ ...b, content: { ...b.content, copy: e.target.value } }))}
            placeholder={lang === 'id' ? 'Tempel draft naskah atau headline di sini...' : 'Paste your headline or body copy draft here...'}
            className="mt-3 w-full rounded-xl border border-line bg-surface p-3 text-xs outline-none focus:border-ink/40"
          />
        )}
      </div>

      {/* Assets Checklist */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
          {lang === 'id' ? 'Katalog Ketersediaan Aset' : 'Asset Inventory Checklist'}
        </label>
        <div className="space-y-2">
          {ASSET_CATEGORIES.map((cat) => {
            const st = checklist[cat] || 'not_applicable'
            return (
              <div key={cat} className="flex items-center justify-between rounded-xl border border-line bg-surface p-2.5 text-xs">
                <span className="font-semibold">{humanize(cat)}</span>
                <div className="flex gap-1">
                  {(['provided', 'pending', 'not_applicable'] as AssetState[]).map((stateOpt) => (
                    <button
                      key={stateOpt}
                      type="button"
                      onClick={() => setChecklistState(cat, stateOpt)}
                      className={cx(
                        'rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition',
                        st === stateOpt
                          ? stateOpt === 'provided'
                            ? 'bg-success text-white'
                            : stateOpt === 'pending'
                            ? 'bg-warning text-white'
                            : 'bg-muted/40 text-white'
                          : 'bg-bg text-muted hover:text-ink',
                      )}
                    >
                      {stateOpt === 'not_applicable' ? 'N/A' : stateOpt}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* File Upload zone */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
          {lang === 'id' ? 'Unggah File & Aset (Logo, Dokumen, dll)' : 'Upload Asset Files'}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-bg/40 p-6 text-center transition hover:border-ink/40"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-surface ring-1 ring-line text-muted">
            <Upload className="size-5" />
          </span>
          <div className="mt-2 text-xs font-bold">
            {isUploading
              ? lang === 'id'
                ? 'Sedang mengunggah...'
                : 'Uploading...'
              : lang === 'id'
              ? 'Klik untuk memilih file atau seret ke sini'
              : 'Click to upload or drag files here'}
          </div>
          <div className="text-[11px] text-muted mt-0.5">JPG, PNG, SVG, PDF, ZIP (Max 25MB)</div>
        </div>

        {/* Uploaded file list */}
        {brief.files.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {brief.files.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="size-4 text-muted shrink-0" />
                  <span className="font-semibold truncate">{f.file_name}</span>
                  <span className="text-muted">({formatBytes(f.size_bytes)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBrief((b) => ({ ...b, files: b.files.filter((x) => x.id !== f.id) }))}
                  className="text-muted hover:text-danger"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- STEP 9: CONDITIONAL OUTPUT ---------------- */
function StepConditional({
  project,
  brief,
  setBrief,
  errors,
  lang,
}: {
  project: Project
  brief: Brief
  setBrief: React.Dispatch<React.SetStateAction<Brief>>
  errors: Record<string, string>
  lang: 'id' | 'en'
}) {
  const isGraphic = project.type === 'graphic' || project.type === 'both'
  const isUiux = project.type === 'uiux' || project.type === 'both'

  const g = brief.output.graphic || {
    usage: [],
    final_formats: ['png', 'jpg'],
  }
  const u = brief.output.uiux || {
    design_target: 'website',
    platforms: ['desktop', 'mobile'],
    existing_product: false,
    design_system: 'none',
    final_formats: ['figma'],
  }

  const toggleGraphicUsage = (item: string) => {
    const cur = g.usage || []
    const updated = cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item]
    setBrief((b) => ({
      ...b,
      output: { ...b.output, graphic: { ...g, usage: updated } },
    }))
  }

  const togglePlatform = (p: string) => {
    const cur = u.platforms || []
    const updated = cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]
    setBrief((b) => ({
      ...b,
      output: { ...b.output, uiux: { ...u, platforms: updated } },
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {lang === 'id' ? 'Langkah 9 dari 10' : 'Step 9 of 10'}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {lang === 'id' ? 'Spesifikasi Format & Output' : 'Deliverable & Format Details'}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {lang === 'id' ? 'Pertanyaan khusus sesuai jenis proyek Anda.' : 'Specific questions tailored to your project type.'}
        </p>
      </div>

      {/* Graphic Design Block */}
      {isGraphic && (
        <div className="rounded-2xl border border-line bg-bg/40 p-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-ink">
            {lang === 'id' ? 'Pertanyaan Desain Grafis' : 'Graphic Design Specifications'}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-2">
              {lang === 'id' ? 'Media Penggunaan Desain' : 'Intended Usage'} <span className="text-danger">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {['instagram', 'linkedin', 'website', 'print', 'billboard', 'presentation', 'advertisement', 'other'].map((use) => (
                <button
                  key={use}
                  type="button"
                  onClick={() => toggleGraphicUsage(use)}
                  className={cx(
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition',
                    g.usage?.includes(use)
                      ? 'bg-ink text-white ring-1 ring-ink'
                      : 'bg-surface text-muted ring-1 ring-line hover:text-ink',
                  )}
                >
                  {humanize(use)}
                </button>
              ))}
            </div>
            {errors.graphic_usage && <p className="mt-1 text-xs text-danger">{errors.graphic_usage}</p>}
          </div>

          {(g.usage?.includes('instagram') || g.usage?.includes('linkedin')) && (
            <div>
              <label className="block text-xs font-bold text-muted mb-1.5">
                {lang === 'id' ? 'Format Konten Media Sosial' : 'Social Media Content Format'}
              </label>
              <div className="flex gap-2">
                {['feed', 'story', 'carousel'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() =>
                      setBrief((b) => ({
                        ...b,
                        output: { ...b.output, graphic: { ...g, social_format: fmt } },
                      }))
                    }
                    className={cx(
                      'rounded-xl border px-3 py-1.5 text-xs font-bold capitalize transition',
                      g.social_format === fmt ? 'border-ink bg-soft text-ink' : 'border-line bg-surface text-muted',
                    )}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {g.usage?.includes('print') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  {lang === 'id' ? 'Ukuran Cetak (Mis. A4, Poster)' : 'Print Size'}
                </label>
                <input
                  type="text"
                  value={g.print_size || ''}
                  onChange={(e) =>
                    setBrief((b) => ({
                      ...b,
                      output: { ...b.output, graphic: { ...g, print_size: e.target.value } },
                    }))
                  }
                  placeholder="A4, 250g bag label..."
                  className="w-full rounded-xl border border-line bg-surface px-3 py-1.5 text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  {lang === 'id' ? 'Orientasi' : 'Orientation'}
                </label>
                <div className="flex gap-2">
                  {['portrait', 'landscape'].map((ori) => (
                    <button
                      key={ori}
                      type="button"
                      onClick={() =>
                        setBrief((b) => ({
                          ...b,
                          output: { ...b.output, graphic: { ...g, orientation: ori } },
                        }))
                      }
                      className={cx(
                        'flex-1 rounded-xl border py-1.5 text-xs font-bold capitalize transition',
                        g.orientation === ori ? 'border-ink bg-soft text-ink' : 'border-line bg-surface text-muted',
                      )}
                    >
                      {ori}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* UI/UX Design Block */}
      {isUiux && (
        <div className="rounded-2xl border border-line bg-bg/40 p-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-ink">
            {lang === 'id' ? 'Pertanyaan Desain UI/UX' : 'UI/UX Design Specifications'}
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-2">
              {lang === 'id' ? 'Target Produk Digital' : 'Product Type'} <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {['website', 'web_app', 'mobile_app', 'dashboard', 'saas', 'other'].map((tgt) => (
                <button
                  key={tgt}
                  type="button"
                  onClick={() =>
                    setBrief((b) => ({
                      ...b,
                      output: { ...b.output, uiux: { ...u, design_target: tgt } },
                    }))
                  }
                  className={cx(
                    'rounded-xl border p-2.5 text-center text-xs font-bold capitalize transition',
                    u.design_target === tgt ? 'border-ink bg-soft text-ink' : 'border-line bg-surface text-muted',
                  )}
                >
                  {humanize(tgt)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-2">
              {lang === 'id' ? 'Target Platform' : 'Target Platforms'} <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2">
              {['desktop', 'mobile', 'tablet'].map((plat) => (
                <button
                  key={plat}
                  type="button"
                  onClick={() => togglePlatform(plat)}
                  className={cx(
                    'rounded-full px-4 py-1.5 text-xs font-bold capitalize transition',
                    u.platforms?.includes(plat)
                      ? 'bg-ink text-white ring-1 ring-ink'
                      : 'bg-surface text-muted ring-1 ring-line',
                  )}
                >
                  {plat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-muted mb-1.5">
              {lang === 'id' ? 'Status Design System Saat Ini' : 'Current Design System'}
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { id: 'full', label: 'Full System' },
                { id: 'some_components', label: 'Some Components' },
                { id: 'none', label: 'None (From scratch)' },
                { id: 'not_sure', label: 'Not Sure' },
              ].map((ds) => (
                <button
                  key={ds.id}
                  type="button"
                  onClick={() =>
                    setBrief((b) => ({
                      ...b,
                      output: { ...b.output, uiux: { ...u, design_system: ds.id } },
                    }))
                  }
                  className={cx(
                    'rounded-xl border p-2 text-center text-xs font-bold transition',
                    u.design_system === ds.id ? 'border-ink bg-soft text-ink' : 'border-line bg-surface text-muted',
                  )}
                >
                  {ds.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- STEP 10: REVIEW ---------------- */
function StepReview({
  project,
  brief,
  lang,
  onEditStep,
}: {
  project: Project
  brief: Brief
  lang: 'id' | 'en'
  onEditStep: (s: FormStep) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          {lang === 'id' ? 'Langkah 10 dari 10' : 'Step 10 of 10'}
        </span>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">
          {lang === 'id' ? 'Tinjau Seluruh Ringkasan Brief' : 'Review Your Design Brief'}
        </h2>
        <p className="mt-1.5 text-sm text-muted">
          {lang === 'id' ? 'Periksa kembali jawaban Anda sebelum dikirimkan ke desainer.' : 'Take a quick glance before submitting. You can click Edit on any section.'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Section: Audience */}
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{lang === 'id' ? 'Audiens' : 'Audience'}</span>
            <Button size="sm" variant="ghost" onClick={() => onEditStep('audience')}>
              {lang === 'id' ? 'Ubah' : 'Edit'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-ink/90 font-medium">“{brief.audience.target || '—'}”</p>
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted">
            <span className="rounded-full bg-bg px-2.5 py-0.5 font-bold">{brief.audience.age_range}</span>
            {brief.audience.desired_reaction.map((r) => (
              <span key={r} className="rounded-full bg-soft px-2.5 py-0.5 font-semibold text-ink">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Section: Visual Style */}
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{lang === 'id' ? 'Gaya & Mood' : 'Style & Mood'}</span>
            <Button size="sm" variant="ghost" onClick={() => onEditStep('style')}>
              {lang === 'id' ? 'Ubah' : 'Edit'}
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {brief.visual_direction.styles_undecided ? (
              <span className="text-xs italic text-muted">{lang === 'id' ? 'Diserahkan ke desainer' : 'Designer choice'}</span>
            ) : (
              brief.visual_direction.styles.map((s) => (
                <span key={s} className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white capitalize">
                  {s}
                </span>
              ))
            )}
            {brief.visual_direction.moods.map((m) => (
              <span key={m} className="rounded-full bg-bg px-3 py-1 text-xs font-medium text-ink capitalize ring-1 ring-line">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Section: Colors */}
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{lang === 'id' ? 'Warna & Tipografi' : 'Color & Typography'}</span>
            <Button size="sm" variant="ghost" onClick={() => onEditStep('color')}>
              {lang === 'id' ? 'Ubah' : 'Edit'}
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-bold capitalize">{brief.visual_direction.colors.mode.replace('_', ' ')}</span>
            {brief.visual_direction.colors.palette.map((hex, i) => (
              <span key={i} className="size-4 rounded-full ring-1 ring-black/10" style={{ background: hex }} />
            ))}
            <span className="text-xs text-muted ml-auto capitalize">{brief.visual_direction.typography || 'not sure'}</span>
          </div>
        </div>

        {/* Section: Content & Assets */}
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">{lang === 'id' ? 'Konten & Aset' : 'Content & Assets'}</span>
            <Button size="sm" variant="ghost" onClick={() => onEditStep('content')}>
              {lang === 'id' ? 'Ubah' : 'Edit'}
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted">
            {lang === 'id' ? 'Status Copy:' : 'Copy status:'} <strong className="text-ink font-semibold">{brief.content.copy_status}</strong> · {brief.files.length} {lang === 'id' ? 'file terunggah' : 'files uploaded'}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- STEP 11: SUBMITTED ---------------- */
function StepSubmitted({
  project,
  lang,
  onBackToDesigner,
}: {
  project: Project
  lang: 'id' | 'en'
  onBackToDesigner?: () => void
}) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-soft text-primary-strong ring-1 ring-[#D8EFA3]">
        <Check className="size-8 stroke-[3]" />
      </div>

      <h1 className="mt-6 text-3xl font-extrabold sm:text-4xl">
        {lang === 'id' ? 'Brief Berhasil Dikirim!' : 'Brief Successfully Submitted!'}
      </h1>

      <p className="mx-auto mt-3 max-w-md text-sm text-muted leading-relaxed">
        {lang === 'id'
          ? 'Terima kasih telah melengkapi kebutuhan desain. Desainer Anda telah menerima notifikasi dan akan segera meninjau brief ini.'
          : 'Thank you for providing structured requirements. Your designer has been notified and will review your brief shortly.'}
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-bg/50 p-4 text-xs text-muted max-w-sm mx-auto">
        <div>
          {lang === 'id' ? 'Proyek:' : 'Project:'} <strong className="text-ink font-bold">{project.name}</strong>
        </div>
        <div className="mt-1">
          {lang === 'id' ? 'Status:' : 'Status:'} <strong className="text-success font-bold">Submitted (Pending Review)</strong>
        </div>
      </div>

      {onBackToDesigner && (
        <div className="mt-8">
          <Button variant="dark" onClick={onBackToDesigner} className="rounded-full">
            <ArrowLeft className="size-4" /> {lang === 'id' ? 'Kembali ke Dashboard Desainer' : 'Return to Designer View'}
          </Button>
        </div>
      )}
    </div>
  )
}

