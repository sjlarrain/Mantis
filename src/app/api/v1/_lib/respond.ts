import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

// Uniform JSON responses for the API.

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 })
}

export function error(code: string, message: string, status: number): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status })
}

export const unauthorized = () => error('unauthorized', 'Missing or invalid credentials', 401)
export const forbidden = (scope?: string) =>
  error('forbidden', scope ? `Requires scope ${scope}` : 'Not allowed', 403)
export const notFound = (what = 'Resource') => error('not_found', `${what} not found`, 404)

export function invalid(err: ZodError): NextResponse {
  return NextResponse.json(
    { error: { code: 'invalid_request', message: 'Validation failed', issues: err.issues } },
    { status: 422 }
  )
}
