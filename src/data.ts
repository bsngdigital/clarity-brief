export type Status = 'draft' | 'sent' | 'in_progress' | 'submitted' | 'needs_clarification' | 'approved'
export type ProjectType = 'graphic' | 'uiux' | 'both'
export type StyleId =
  | 'minimal'
  | 'modern'
  | 'bold'
  | 'premium'
  | 'playful'
  | 'corporate'
  | 'editorial'
  | 'futuristic'

export type AssetState = 'provided' | 'pending' | 'not_applicable'

export interface Client {
  id: string
  name: string
  company?: string
  email?: string
  phone?: string
}

export interface Reference {
  id: string
  kind: 'image' | 'url'
  url: string
  note?: string
}

export interface AssetFile {
  id: string
  category: string
  file_name: string
  mime_type: string
  size_bytes: number
}

export interface Brief {
  version: number
  submitted_at?: string
  approved_at?: string
  audience: { target: string; age_range: string; demographic?: string; desired_reaction: string[] }
  visual_direction: {
    styles: StyleId[]
    styles_undecided: boolean
    avoid_styles: StyleId[]
    moods: string[]
    moods_undecided?: boolean
    likes: string[]
    avoid: string[]
    avoid_note?: string
    colors: { mode: 'brand_colors' | 'suggest' | 'custom'; palette: string[]; note?: string }
    typography?: string
  }
  content: { copy_status: 'will_provide' | 'in_preparation' | 'need_help'; copy?: string }
  assets_checklist: Record<string, AssetState>
  files: AssetFile[]
  references: Reference[]
  output: {
    graphic?: { usage: string[]; social_format?: string; print_size?: string; orientation?: string; final_formats: string[] }
    uiux?: {
      design_target: string
      platforms: string[]
      existing_product: boolean
      product_url?: string
      design_system: string
      final_formats: string[]
    }
  }
  designer_interpretation?: string
  questions?: { section: string; client_question: string }[]
}

export interface Project {
  id: string
  client_id: string
  name: string
  type: ProjectType
  objective: string
  deliverables: string[]
  deadline?: string
  language: 'id' | 'en'
  status: Status
  share_token: string
  link_enabled: boolean
  created_at: string
  progress?: number
  brief?: Brief
}

export const STATUS_META: Record<Status, { label: string; dot: string; cls: string }> = {
  draft: { label: 'Draft', dot: 'bg-muted/60', cls: 'bg-bg text-muted ring-line' },
  sent: { label: 'Sent', dot: 'bg-ink', cls: 'bg-surface text-ink ring-line' },
  in_progress: { label: 'In progress', dot: 'bg-warning', cls: 'bg-[#FBF3E3] text-[#8A5F12] ring-[#F1DDB4]' },
  submitted: { label: 'Submitted', dot: 'bg-primary-strong', cls: 'bg-soft text-ink ring-[#D8EFA3]' },
  needs_clarification: {
    label: 'Needs clarification',
    dot: 'bg-danger',
    cls: 'bg-[#FBEAEA] text-[#9E3434] ring-[#F3CFCF]',
  },
  approved: { label: 'Approved', dot: 'bg-success', cls: 'bg-[#E7F3EA] text-[#2F6B41] ring-[#CBE5D2]' },
}

export const TYPE_LABEL: Record<ProjectType, string> = { graphic: 'Graphic', uiux: 'UI/UX', both: 'Graphic + UI/UX' }

export const STYLES: { id: StyleId; name: string; desc: string }[] = [
  { id: 'minimal', name: 'Minimal', desc: 'Clean, simple & focused' },
  { id: 'modern', name: 'Modern', desc: 'Contemporary, tidy & refined' },
  { id: 'bold', name: 'Bold', desc: 'Strong, expressive & impactful' },
  { id: 'premium', name: 'Premium', desc: 'Sophisticated, elegant & luxurious' },
  { id: 'playful', name: 'Playful', desc: 'Fun, expressive & energetic' },
  { id: 'corporate', name: 'Corporate', desc: 'Professional, structured & trusted' },
  { id: 'editorial', name: 'Editorial', desc: 'Type-led, sophisticated & expressive' },
  { id: 'futuristic', name: 'Futuristic', desc: 'Innovative, digital & forward-looking' },
]

export const MOODS = [
  'trustworthy',
  'sophisticated',
  'friendly',
  'energetic',
  'calm',
  'luxurious',
  'bold',
  'warm',
  'serious',
  'innovative',
  'youthful',
  'timeless',
]

export const ASSET_CATEGORIES = [
  'logo',
  'brand_guideline',
  'brand_colors',
  'brand_fonts',
  'existing_design',
  'product_images',
  'icons',
  'illustrations',
  'other',
]

export const SECTIONS = [
  { id: 'audience', label: 'Audience' },
  { id: 'visual_direction', label: 'Visual direction' },
  { id: 'color', label: 'Color & typography' },
  { id: 'references', label: 'References' },
  { id: 'content', label: 'Content & assets' },
  { id: 'output', label: 'Output' },
]

export const humanize = (s: string) => {
  const t = s.replace(/_/g, ' ')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const formatBytes = (b: number) =>
  b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1000))} KB`

export const makeToken = () => {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = new Uint32Array(36)
  crypto.getRandomValues(arr)
  return Array.from(arr, (n) => chars[n % chars.length]).join('')
}

export const DESIGNER = { name: 'Nadia Pratama', email: 'nadia@studiopratama.co', initials: 'NP' }

export const initialClients: Client[] = [
  { id: 'c1', name: 'Raka Wibisono', company: 'Kopi Senja', email: 'raka@kopisenja.id', phone: '+62 812 3301 2290' },
  { id: 'c2', name: 'Maya Hartono', company: 'Lumen Health', email: 'maya@lumenhealth.co' },
  { id: 'c3', name: 'Daniel Sutanto', company: 'Arunika Living', email: 'daniel@arunika.id' },
  { id: 'c4', name: 'Sinta Lestari', company: 'Fleet.io', email: 'sinta@fleet.io' },
  { id: 'c5', name: 'Bima Aditya', company: 'Batik Kala', phone: '+62 813 7720 4451' },
]

const IMG = {
  helvetica:
    'https://images.unsplash.com/photo-1543487945-139a97f387d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  goldbox:
    'https://images.unsplash.com/photo-1716540103530-cc33cdd20cde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  boxes:
    'https://images.unsplash.com/photo-1617825295690-28ae56c56135?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  quote:
    'https://images.unsplash.com/photo-1581080247575-12fa86f6ef6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
  kraft:
    'https://images.unsplash.com/photo-1595246135406-803418233494?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
}

const kopiBrief: Brief = {
  version: 1,
  submitted_at: '2025-06-12T09:20:00Z',
  audience: {
    target: 'Young professionals and students who work from cafés in South Jakarta',
    age_range: '25-34',
    demographic: 'Urban, creative jobs, active on Instagram, value local craft',
    desired_reaction: ['belonging', 'calm', 'curiosity'],
  },
  visual_direction: {
    styles: ['minimal', 'editorial', 'premium'],
    styles_undecided: false,
    avoid_styles: ['corporate', 'futuristic'],
    moods: ['warm', 'sophisticated', 'timeless'],
    likes: ['whitespace', 'strong_typography', 'muted_colors', 'rich_imagery'],
    avoid: ['too_corporate', 'too_busy', 'bright_colors'],
    avoid_note: "Please don't make it look like a big chain coffee brand. No neon, no cartoon beans.",
    colors: { mode: 'custom', palette: ['#2B2420', '#C9A27E', '#F3EDE4', '#6E7B5B'], note: 'Earthy, like roasted beans and morning light.' },
    typography: 'serif',
  },
  content: {
    copy_status: 'will_provide',
    copy: 'Headline: "Slow coffee for fast cities." Sub: Single-origin beans from Flores, Toraja and Gayo.',
  },
  assets_checklist: {
    logo: 'provided',
    brand_guideline: 'pending',
    brand_colors: 'provided',
    brand_fonts: 'not_applicable',
    existing_design: 'not_applicable',
    product_images: 'provided',
    icons: 'not_applicable',
    illustrations: 'pending',
    other: 'not_applicable',
  },
  files: [
    { id: 'f1', category: 'logo', file_name: 'kopisenja-logo-primary.svg', mime_type: 'image/svg+xml', size_bytes: 48000 },
    { id: 'f2', category: 'brand_colors', file_name: 'palette-2024.pdf', mime_type: 'application/pdf', size_bytes: 1_240_000 },
    { id: 'f3', category: 'product_images', file_name: 'beans-flores.jpg', mime_type: 'image/jpeg', size_bytes: 3_800_000 },
    { id: 'f4', category: 'product_images', file_name: 'store-interior.jpg', mime_type: 'image/jpeg', size_bytes: 4_120_000 },
  ],
  references: [
    { id: 'r1', kind: 'image', url: IMG.kraft, note: 'Love the natural kraft texture and honest packaging.' },
    { id: 'r2', kind: 'image', url: IMG.helvetica, note: 'Big confident typography, lots of breathing room.' },
    { id: 'r3', kind: 'image', url: IMG.goldbox, note: 'The restrained gold detail feels special but not flashy.' },
    { id: 'r4', kind: 'url', url: 'https://www.behance.net/gallery/coffee-identity', note: 'Overall tone of voice.' },
  ],
  output: {
    graphic: { usage: ['instagram', 'print'], social_format: 'carousel', print_size: 'A5 menu & 250g bag label', orientation: 'portrait', final_formats: ['png', 'pdf', 'svg'] },
  },
}

const lumenBrief: Brief = {
  version: 2,
  submitted_at: '2025-06-02T14:00:00Z',
  approved_at: '2025-06-06T10:30:00Z',
  audience: {
    target: 'Patients booking clinic appointments and managing prescriptions',
    age_range: 'mixed',
    demographic: 'Families in Jabodetabek, varying digital literacy',
    desired_reaction: ['trust', 'calm', 'confidence'],
  },
  visual_direction: {
    styles: ['modern', 'minimal'],
    styles_undecided: false,
    avoid_styles: ['playful', 'bold'],
    moods: ['trustworthy', 'calm', 'friendly'],
    likes: ['clean_layout', 'rounded_shapes', 'whitespace'],
    avoid: ['dense_information', 'too_dark'],
    colors: { mode: 'brand_colors', palette: ['#1F5C4F', '#9ED8C3', '#F5F7F2'] },
    typography: 'sans',
  },
  content: { copy_status: 'in_preparation' },
  assets_checklist: {
    logo: 'provided',
    brand_guideline: 'provided',
    brand_colors: 'provided',
    brand_fonts: 'provided',
    existing_design: 'provided',
    product_images: 'not_applicable',
    icons: 'pending',
    illustrations: 'not_applicable',
    other: 'not_applicable',
  },
  files: [
    { id: 'f5', category: 'brand_guideline', file_name: 'lumen-brandbook-v3.pdf', mime_type: 'application/pdf', size_bytes: 12_400_000 },
    { id: 'f6', category: 'existing_design', file_name: 'current-app.fig', mime_type: 'application/octet-stream', size_bytes: 18_900_000 },
  ],
  references: [
    { id: 'r5', kind: 'url', url: 'https://www.oscar.health', note: 'Friendly, human, not clinical.' },
    { id: 'r6', kind: 'image', url: IMG.quote, note: 'Calm black & white contrast.' },
  ],
  output: {
    uiux: { design_target: 'mobile_app', platforms: ['mobile', 'tablet'], existing_product: true, product_url: 'https://app.lumenhealth.co', design_system: 'some_components', final_formats: ['figma'] },
  },
  designer_interpretation:
    'Keep the green brand anchor but soften it with generous whitespace. Booking flow in max 3 steps; large tap targets for older users. Explore a calmer illustration-free direction first.',
}

const arunikaBrief: Brief = {
  version: 1,
  submitted_at: '2025-06-10T08:00:00Z',
  audience: {
    target: 'Homeowners shopping for handcrafted furniture',
    age_range: '35-44',
    desired_reaction: ['trust', 'joy'],
  },
  visual_direction: {
    styles: [],
    styles_undecided: true,
    avoid_styles: ['futuristic'],
    moods: ['luxurious', 'warm'],
    likes: ['rich_imagery', 'whitespace'],
    avoid: ['too_playful'],
    colors: { mode: 'suggest', palette: [] },
    typography: 'not_sure',
  },
  content: { copy_status: 'need_help' },
  assets_checklist: {
    logo: 'provided',
    brand_guideline: 'not_applicable',
    brand_colors: 'pending',
    brand_fonts: 'not_applicable',
    existing_design: 'provided',
    product_images: 'pending',
    icons: 'not_applicable',
    illustrations: 'not_applicable',
    other: 'not_applicable',
  },
  files: [{ id: 'f7', category: 'logo', file_name: 'arunika-logo.png', mime_type: 'image/png', size_bytes: 320_000 }],
  references: [{ id: 'r7', kind: 'image', url: IMG.boxes, note: 'Playful color blocking, but maybe too much?' }],
  output: {
    graphic: { usage: ['instagram', 'website'], social_format: 'feed', final_formats: ['png', 'jpg'] },
    uiux: { design_target: 'website', platforms: ['desktop', 'mobile'], existing_product: true, product_url: 'https://arunika.id', design_system: 'none', final_formats: ['figma', 'png'] },
  },
  questions: [{ section: 'references', client_question: 'Could you add 2–3 interiors or brands you love? The current one feels far from "luxurious".' }],
}

export const initialProjects: Project[] = [
  { id: 'p1', client_id: 'c1', name: 'Kopi Senja — Brand Refresh', type: 'graphic', objective: 'Refresh the visual identity for the new Kemang flagship and roll it out across packaging and social.', deliverables: ['Logo refinement', 'Packaging label', 'Instagram templates'], deadline: '2025-07-15', language: 'id', status: 'submitted', share_token: makeToken(), link_enabled: true, created_at: '2025-06-01', brief: kopiBrief },
  { id: 'p2', client_id: 'c2', name: 'Lumen Patient App', type: 'uiux', objective: 'Redesign booking and prescription flows to reduce drop-off for older patients.', deliverables: ['Mobile app UI', 'Booking flow prototype'], deadline: '2025-08-01', language: 'en', status: 'approved', share_token: makeToken(), link_enabled: true, created_at: '2025-05-20', brief: lumenBrief },
  { id: 'p3', client_id: 'c3', name: 'Arunika Website & Launch Kit', type: 'both', objective: 'Launch the online store with a matching social campaign.', deliverables: ['Website (5 pages)', 'Launch social kit'], deadline: '2025-07-30', language: 'id', status: 'needs_clarification', share_token: makeToken(), link_enabled: true, created_at: '2025-06-03', brief: arunikaBrief },
  { id: 'p4', client_id: 'c4', name: 'Fleet.io Ops Dashboard', type: 'uiux', objective: 'Design a dispatcher dashboard for real-time fleet tracking.', deliverables: ['Dashboard UI', 'Design system starter'], deadline: '2025-09-10', language: 'en', status: 'in_progress', progress: 55, share_token: makeToken(), link_enabled: true, created_at: '2025-06-11' },
  { id: 'p5', client_id: 'c5', name: 'Batik Kala Lookbook', type: 'graphic', objective: 'Print and digital lookbook for the Kala Raya collection.', deliverables: ['Lookbook 24pp', 'Campaign poster'], deadline: '2025-08-20', language: 'id', status: 'sent', share_token: makeToken(), link_enabled: true, created_at: '2025-06-13' },
  { id: 'p6', client_id: 'c1', name: 'Kopi Senja — Loyalty Card', type: 'graphic', objective: 'Stamp card and digital wallet pass for repeat customers.', deliverables: ['Loyalty card', 'Wallet pass'], language: 'id', status: 'draft', share_token: makeToken(), link_enabled: true, created_at: '2025-06-14' },
]
