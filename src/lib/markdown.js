// Markdown ringan untuk balasan chatbot. Teks di-escape dulu sehingga aman dipakai dengan dangerouslySetInnerHTML.
export function renderMarkdown(text) {
  if (!text) return ''

  // Step 1: Escape HTML entities
  let safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Step 2: Inline formatting (before line processing)
  safe = safe
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(127,127,127,.18);padding:1px 6px;border-radius:4px;font-size:13px;font-family:monospace">$1</code>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    // URL otomatis jadi tautan (teks sudah di-escape; tanda baca di ujung tidak ikut)
    .replace(/(https?:\/\/[^\s<]+?)([.,;:!?)]*)(?=\s|$|<)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>$2')

  // Step 3: Process line by line
  const lines = safe.split('\n')
  let result = ''
  let ulOpen = false
  let olOpen = false

  for (const line of lines) {
    const trimmed = line.trim()

    // Unordered list
    if (trimmed.startsWith('- ')) {
      if (olOpen) { result += '</ol>'; olOpen = false }
      if (!ulOpen) { result += '<ul style="margin:4px 0 4px 16px;list-style-type:disc">'; ulOpen = true }
      result += `<li style="margin:2px 0">${trimmed.slice(2)}</li>`
      continue
    }

    // Ordered list
    const olMatch = trimmed.match(/^\d+\.\s+(.*)/)
    if (olMatch) {
      if (ulOpen) { result += '</ul>'; ulOpen = false }
      if (!olOpen) { result += '<ol style="margin:4px 0 4px 16px;list-style-type:decimal">'; olOpen = true }
      result += `<li style="margin:2px 0">${olMatch[1]}</li>`
      continue
    }

    // Close any open list
    if (ulOpen) { result += '</ul>'; ulOpen = false }
    if (olOpen) { result += '</ol>'; olOpen = false }

    // Headers
    if (trimmed.startsWith('### ')) {
      result += `<div style="font-weight:bold;font-size:14px;margin:8px 0 4px">${trimmed.slice(4)}</div>`
    } else if (trimmed.startsWith('## ')) {
      result += `<div style="font-weight:bold;font-size:14px;margin:8px 0 4px">${trimmed.slice(3)}</div>`
    } else if (trimmed.startsWith('# ')) {
      result += `<div style="font-weight:bold;font-size:15px;margin:8px 0 4px">${trimmed.slice(2)}</div>`
    } else if (trimmed === '') {
      result += '<div style="height:8px"></div>'
    } else {
      result += `<div style="margin:2px 0">${trimmed}</div>`
    }
  }

  if (ulOpen) result += '</ul>'
  if (olOpen) result += '</ol>'

  return result
}
