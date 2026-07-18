// OpenAPI 3.1 description of the Mantis REST API. Served at /api/v1/openapi.json
// and used as the source of truth for docs/API.md.

export function buildOpenApi(baseUrl: string) {
  const bearer = [{ bearerAuth: [] }]
  const listOf = (item: string) => ({
    type: 'object',
    properties: { items: { type: 'array', items: { $ref: `#/components/schemas/${item}` } } },
  })

  return {
    openapi: '3.1.0',
    info: {
      title: 'Mantis API',
      version: '1.0.0',
      description:
        'Networking CRM. Authenticate with a Supabase JWT (interactive) or a Mantis PAT ' +
        '(mnt_… bearer token, from Settings → API tokens). Every response is owner-scoped.',
    },
    servers: [{ url: `${baseUrl}/api/v1` }],
    security: bearer,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', description: 'Supabase JWT or mnt_ PAT' },
      },
      schemas: {
        Company: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            website: { type: 'string', nullable: true },
            industry: { type: 'string', nullable: true },
            location: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            recruiting_channel_tag_id: { type: 'string', nullable: true },
            priority_tag_id: { type: 'string', nullable: true },
          },
        },
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            company_id: { type: 'string', format: 'uuid' },
            full_name: { type: 'string' },
            title_free: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            linkedin_url: { type: 'string', nullable: true },
            next_follow_up_date: { type: 'string', nullable: true },
          },
        },
        BundleResult: {
          type: 'object',
          properties: {
            company_id: { type: 'string' },
            contact_id: { type: 'string' },
            action_id: { type: 'string', nullable: true },
            note_id: { type: 'string', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: { code: { type: 'string' }, message: { type: 'string' } },
            },
          },
        },
      },
    },
    paths: {
      '/companies': {
        get: { summary: 'List companies', security: bearer, responses: json200(listOf('Company')) },
        post: {
          summary: 'Create a company',
          security: bearer,
          requestBody: bodyOf('CompanyInput'),
          responses: { '201': ref('Company'), '409': ref('Error') },
        },
      },
      '/companies/{id}': {
        get: { summary: 'Get a company', ...idParam(), responses: { '200': ref('Company'), '404': ref('Error') } },
        patch: { summary: 'Update a company', ...idParam(), responses: { '200': ref('Company') } },
        delete: { summary: 'Soft-delete a company', ...idParam(), responses: json200() },
      },
      '/contacts': {
        get: { summary: 'List contacts', security: bearer, responses: json200(listOf('Contact')) },
        post: {
          summary: 'Create a contact (with inline company, optional first action + note)',
          description: 'Atomic: company is linked by id or created by name; a person is never saved without a company.',
          security: bearer,
          responses: { '201': ref('BundleResult'), '409': ref('Error'), '422': ref('Error') },
        },
      },
      '/contacts/{id}': {
        get: { summary: 'Get a contact with actions and notes', ...idParam(), responses: { '200': ref('Contact') } },
        patch: { summary: 'Update a contact', ...idParam(), responses: { '200': ref('Contact') } },
        delete: { summary: 'Soft-delete a contact', ...idParam(), responses: json200() },
      },
      '/actions': {
        get: { summary: 'List actions (optional ?contact_id=)', security: bearer, responses: json200() },
        post: { summary: 'Log an action', security: bearer, responses: json200() },
      },
      '/notes': { post: { summary: 'Create a note', security: bearer, responses: json200() } },
      '/inbox': {
        get: { summary: 'List unclassified inbox notes', security: bearer, responses: json200() },
        post: {
          summary: 'Quick-capture a note (idempotent on source_ref)',
          description: 'Used by Secretariat/WhatsApp. Requires scope inbox:write. Returns 201 for a new note, 200 when a matching source_ref was already saved.',
          security: bearer,
          responses: {
            '200': { description: 'Deduplicated (existing note)' },
            '201': { description: 'Created' },
          },
        },
      },
      '/tags': {
        get: { summary: 'List tags (optional ?category=&active=true)', security: bearer, responses: json200() },
        post: { summary: 'Create a tag', security: bearer, responses: json200() },
      },
      '/search': { get: { summary: 'Search companies, contacts, notes (?q=)', security: bearer, responses: json200() } },
      '/follow-ups': {
        get: { summary: 'Follow-ups and quiet contacts (?due=today|overdue|quiet|all)', security: bearer, responses: json200() },
      },
    },
  }
}

function ref(schema: string) {
  return { description: schema, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } } }
}
function json200(schema?: object) {
  return { '200': { description: 'OK', content: { 'application/json': { schema: schema ?? { type: 'object' } } } } }
}
function bodyOf(_name: string) {
  return { required: true, content: { 'application/json': { schema: { type: 'object' } } } }
}
function idParam() {
  return {
    security: [{ bearerAuth: [] }],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
  }
}
