import sanitizeHtml from "sanitize-html"

interface StringerOptions {
  htmlSanitize?: boolean,
  maximumCap?  : number,
  acceptNumbers?: boolean,
  trimmed?: boolean,
  returnNullIfResultIsEmpty?: boolean
}

export function stringer(value: any, options: StringerOptions = {
  htmlSanitize: true,
  maximumCap: 100,
  acceptNumbers: true,
  trimmed: true,
  returnNullIfResultIsEmpty: true
}): string | null {
  let sanitized: string = ""
  if(typeof value == "string" || (options.acceptNumbers && !isNaN(Number(value)))) sanitized = String(value)
    else return null

  sanitized = sanitizeHtml(sanitized, {
    allowedTags: options.htmlSanitize ? [] : sanitizeHtml.defaults.allowedTags,
    allowedAttributes: options.htmlSanitize ? {} : sanitizeHtml.defaults.allowedAttributes
  })
  if(options.trimmed) sanitized = sanitized.trim()
  if(options.maximumCap) sanitized = sanitized.slice(0, Math.abs(options.maximumCap))

  if(options.returnNullIfResultIsEmpty) return sanitized.length ? sanitized : null
    else return sanitized
}

export function numberer(value: any): number | null {
  if(isNaN(Number(value))) return null
  else return Number(value)
}