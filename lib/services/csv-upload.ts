export interface ParsedCsvUploadSummary {
  fileName: string
  itemCount: number
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ""
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
        continue
      }
      inQuotes = !inQuotes
      continue
    }

    if (char === "," && !inQuotes) {
      values.push(current)
      current = ""
      continue
    }

    current += char
  }

  values.push(current)
  return values
}

export function countCsvFeedbackItems(csvText: string): number {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length < 2) {
    return 0
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase())
  const feedbackTextIndex = headers.indexOf("feedback_text")
  if (feedbackTextIndex === -1) {
    return 0
  }

  let count = 0
  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line)
    const feedbackText = values[feedbackTextIndex]?.trim() ?? ""
    if (feedbackText.length > 0) {
      count += 1
    }
  }

  return count
}

export async function parseCsvUpload(file: File): Promise<ParsedCsvUploadSummary> {
  const csvText = await file.text()
  return {
    fileName: file.name,
    itemCount: countCsvFeedbackItems(csvText),
  }
}
