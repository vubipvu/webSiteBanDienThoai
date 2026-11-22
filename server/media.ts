import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer, { type FileFilterCallback } from 'multer'
import { randomBytes } from 'node:crypto'
import type { Request } from 'express'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const persistRoot = process.env.ATM66_PERSIST_ROOT?.trim()
export const uploadsRoot =
  process.env.ATM66_UPLOADS_DIR?.trim() ||
  (persistRoot
    ? path.join(persistRoot, 'uploads')
    : path.join(__dirname, '..', 'uploads'))

fs.mkdirSync(path.join(uploadsRoot, 'products'), { recursive: true })
fs.mkdirSync(path.join(uploadsRoot, 'brand'), { recursive: true })
fs.mkdirSync(path.join(uploadsRoot, 'articles'), { recursive: true })
fs.mkdirSync(path.join(uploadsRoot, 'pages'), { recursive: true })

function safeExt(original: string) {
  const ext = path.extname(original).toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) return ext
  return '.jpg'
}

function disk(subdir: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dest = path.join(uploadsRoot, subdir)
      fs.mkdirSync(dest, { recursive: true })
      cb(null, dest)
    },
    filename: (_req, file, cb) => {
      cb(
        null,
        `${Date.now()}-${randomBytes(4).toString('hex')}${safeExt(file.originalname)}`,
      )
    },
  })
}

function imageFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Chỉ nhận file ảnh'))
    return
  }
  cb(null, true)
}

export const productUpload = multer({
  storage: disk('products'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
})

export const brandUpload = multer({
  storage: disk('brand'),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFilter,
})

export const articleUpload = multer({
  storage: disk('articles'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
})

export const pageUpload = multer({
  storage: disk('pages'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
})

export function publicPath(absOrRel: string): string {
  if (absOrRel.startsWith('http') || absOrRel.startsWith('/uploads/')) return absOrRel
  const rel = path.relative(uploadsRoot, absOrRel).replace(/\\/g, '/')
  return `/uploads/${rel}`
}

export function unlinkUpload(publicOrAbs: string) {
  if (!publicOrAbs || publicOrAbs.startsWith('http')) return
  const rel = publicOrAbs.replace(/^\/uploads\//, '')
  const full = path.join(uploadsRoot, rel)
  if (full.startsWith(uploadsRoot) && fs.existsSync(full)) {
    fs.unlinkSync(full)
  }
}
