import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { db } from './db.ts'

const isProd = process.env.NODE_ENV === 'production'
const envSecret = process.env.ATM66_JWT_SECRET?.trim()

if (isProd && (!envSecret || envSecret === 'atm66-dev-secret-change-later')) {
  console.error(
    '[ATM66] Production yêu cầu ATM66_JWT_SECRET mạnh (không dùng secret mặc định).',
  )
  process.exit(1)
}

const JWT_SECRET = envSecret || 'atm66-dev-secret-change-later'

export type AuthUser = {
  id: number
  username: string
  role: string
  displayName: string
  phone?: string | null
}

type JwtPayload = {
  sub: number
  username: string
  role: string
}

export type AuthedRequest = Request & { user?: AuthUser }

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role } satisfies JwtPayload,
    JWT_SECRET,
    { expiresIn: isProd ? '12h' : '7d' },
  )
}

function readUser(payload: JwtPayload): AuthUser | null {
  const row = db
    .prepare(
      `SELECT id, username, role, display_name, phone FROM users WHERE id = ?`,
    )
    .get(payload.sub) as
    | {
        id: number
        username: string
        role: string
        display_name: string
        phone: string | null
      }
    | undefined
  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    displayName: row.display_name,
    phone: row.phone,
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload
      ;(req as AuthedRequest).user = readUser(payload) ?? undefined
    } catch {
      /* guest */
    }
  }
  next()
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!(req as AuthedRequest).user) {
      res.status(401).json({ error: 'Chưa đăng nhập' })
      return
    }
    next()
  })
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if ((req as AuthedRequest).user?.role !== 'admin') {
      res.status(403).json({ error: 'Không đủ quyền admin' })
      return
    }
    next()
  })
}

export function login(username: string, password: string): AuthUser | null {
  const row = db
    .prepare(
      `SELECT id, username, password_hash, role, display_name, phone FROM users WHERE username = ?`,
    )
    .get(username) as
    | {
        id: number
        username: string
        password_hash: string
        role: string
        display_name: string
        phone: string | null
      }
    | undefined

  if (!row || !bcrypt.compareSync(password, row.password_hash)) return null

  return {
    id: row.id,
    username: row.username,
    role: row.role,
    displayName: row.display_name,
    phone: row.phone,
  }
}

export function registerCustomer(input: {
  username: string
  password: string
  displayName: string
  phone?: string
}): AuthUser {
  const hash = bcrypt.hashSync(input.password, 10)
  const info = db
    .prepare(
      `INSERT INTO users (username, password_hash, role, display_name, phone)
       VALUES (?, ?, 'customer', ?, ?)`,
    )
    .run(input.username, hash, input.displayName, input.phone ?? null)

  return {
    id: Number(info.lastInsertRowid),
    username: input.username,
    role: 'customer',
    displayName: input.displayName,
    phone: input.phone ?? null,
  }
}
