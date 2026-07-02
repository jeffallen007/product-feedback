import { describe, expect, it } from "vitest"

import { countCsvFeedbackItems } from "@/lib/services/csv-upload"

describe("csv-upload", () => {
  it("counts valid feedback_text rows and ignores blanks", () => {
    const count = countCsvFeedbackItems(
      'feedback_text,rating\n"First issue",2\n"",3\n" Second issue ",4\n',
    )

    expect(count).toBe(2)
  })

  it("returns zero when the feedback_text header is missing", () => {
    const count = countCsvFeedbackItems("comment,rating\nHello,5\n")

    expect(count).toBe(0)
  })
})
