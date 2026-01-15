const hasLetters = (value: string) => /\p{L}/u.test(value)

const uppercaseRatio = (value: string) => {
  const letters = value.replace(/[^\p{L}]/gu, '')
  if (!letters) return 0
  const uppercase = letters.replace(/[^\p{Lu}]/gu, '')
  return uppercase.length / letters.length
}

const isTitleCandidate = (line: string) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 120) return false
  if (/[.!?]$/.test(trimmed)) return false
  if (/[;,]/.test(trimmed)) return false
  const words = trimmed.split(/\s+/).length
  if (words > 12) return false
  return uppercaseRatio(trimmed) > 0.55 || words <= 10
}

const isBylineCandidate = (line: string) => {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (/\b\d{4}\b/.test(trimmed)) return true
  if (/[.!?]$/.test(trimmed)) return false
  const words = trimmed.split(/\s+/)
  if (words.length > 5) return false
  return words.every((word) => !hasLetters(word) || /\p{Lu}/u.test(word[0] ?? ''))
}

const isTaglineCandidate = (line: string) => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 70) return false
  if (trimmed.split(/\s+/).length > 12) return false
  return true
}

const splitSentences = (text: string) => {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter('fr', { granularity: 'sentence' })
    return Array.from(segmenter.segment(text))
      .map((item) => item.segment.trim())
      .filter(Boolean)
  }

  return text
    .split(/(?<=[.!?])\s+(?=(?:["'(]*\p{Lu}|\d))/gu)
    .map((part) => part.trim())
    .filter(Boolean)
}

const groupSentences = (sentences: string[], maxLength: number) => {
  const paragraphs: string[] = []
  let current = ''

  sentences.forEach((sentence) => {
    const trimmed = sentence.trim()
    if (!trimmed) return
    if (!current) {
      current = trimmed
      return
    }

    const nextLength = current.length + 1 + trimmed.length
    if (nextLength > maxLength) {
      paragraphs.push(current)
      current = trimmed
      return
    }

    current = `${current} ${trimmed}`
  })

  if (current) paragraphs.push(current)
  return paragraphs
}

export const formatComprehensionText = (text: string) => {
  const normalized = text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return ''

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  let headerLines: string[] = []
  let bodyStart = 0

  if (lines.length >= 2 && isTitleCandidate(lines[0]) && isBylineCandidate(lines[1])) {
    headerLines = [lines[0], lines[1]]
    bodyStart = 2
    if (lines[2] && isTaglineCandidate(lines[2])) {
      headerLines.push(lines[2])
      bodyStart = 3
    }
  }

  const bodyText = lines.slice(bodyStart).join('\n')
  const dehyphenated = bodyText.replace(/(\p{L})-\n(\p{L})/gu, '$1$2')
  const rawParagraphs = dehyphenated
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter(Boolean)

  let paragraphs = rawParagraphs
  if (rawParagraphs.length === 1 && rawParagraphs[0]) {
    const sentences = splitSentences(rawParagraphs[0])
    paragraphs = groupSentences(sentences, 420)
  }

  const formattedBody = paragraphs.join('\n\n')
  if (!headerLines.length) return formattedBody
  if (!formattedBody) return headerLines.join('\n')
  return `${headerLines.join('\n')}\n\n${formattedBody}`
}
