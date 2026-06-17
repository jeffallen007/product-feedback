"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { ProductContext } from "@/lib/feedback-data"

export function ProductContextForm({
  value,
  onChange,
}: {
  value: ProductContext
  onChange: (next: ProductContext) => void
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">
        Tell us what product you are analyzing
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Give the AI enough context to interpret feedback correctly.
      </p>

      <div className="mt-4 grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="product-name" className="text-xs font-medium">
            Product Name
          </Label>
          <Input
            id="product-name"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Acme Project Management"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="product-description" className="text-xs font-medium">
            Product Description
          </Label>
          <Textarea
            id="product-description"
            value={value.description}
            onChange={(e) =>
              onChange({ ...value, description: e.target.value })
            }
            placeholder="A B2B productivity tool for managing projects, tasks, notifications, and cross-functional workflows."
            className="min-h-24 resize-none"
          />
        </div>
      </div>
    </div>
  )
}
