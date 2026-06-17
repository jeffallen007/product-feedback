"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Send, MessageSquarePlus } from "lucide-react"
import {
  CANNED_CHAT_RESPONSES,
  CHAT_SCOPE_OPTIONS,
  DEFAULT_CHAT_RESPONSE,
  SUGGESTED_PROMPTS,
  type ChatMessage,
} from "@/lib/mocks/dashboard"
import type { ChatRequest, ChatResponse } from "@/lib/types/contracts"

function resolveAnswer(prompt: string): ChatResponse {
  const normalized = prompt.toLowerCase()
  const match = CANNED_CHAT_RESPONSES.find((c) =>
    normalized.includes(c.match),
  )
  return match ? match.response : DEFAULT_CHAT_RESPONSE
}

function toScopeLabel(scope: ChatRequest["scope"]): string {
  return (
    CHAT_SCOPE_OPTIONS.find((option) => option.value === scope)?.label ??
    "All Sources"
  )
}

function toAssistantMessage(response: ChatResponse): ChatMessage {
  return {
    role: "assistant",
    content: response.answer,
    followUps: response.followUpSuggestions,
  }
}

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [scope, setScope] = useState<ChatRequest["scope"]>("all")
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, thinking])

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || thinking) return
    const userMsg: ChatMessage = {
      role: "user",
      content: trimmed,
      scope: toScopeLabel(scope),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setThinking(true)
    setTimeout(() => {
      setMessages((prev) => [...prev, toAssistantMessage(resolveAnswer(trimmed))])
      setThinking(false)
    }, 750)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Ask about this analysis
            </h2>
            <p className="text-xs text-muted-foreground">
              Source-aware feedback assistant
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="h-full px-4 py-4">
          {isEmpty ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-card">
                <MessageSquarePlus
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                Ask a follow-up question
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                The assistant answers using only the analyzed feedback. Try a
                suggested prompt to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <ChatBubble
                  key={i}
                  message={msg}
                  onFollowUp={(t) => send(t)}
                />
              ))}
              {thinking && (
                <div className="flex items-center gap-1.5 rounded-lg rounded-tl-sm bg-secondary px-3 py-2.5">
                  <Dot delay="0ms" />
                  <Dot delay="150ms" />
                  <Dot delay="300ms" />
                </div>
              )}
            </div>
          )}

          {/* Suggested prompts */}
          {(isEmpty || !thinking) && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {isEmpty ? "Suggested prompts" : "Try another"}
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.slice(0, isEmpty ? 7 : 4).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="border-t border-border bg-card px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Answer using:</span>
          <Select
            value={scope}
            onValueChange={(value) => {
              if (value) setScope(value)
            }}
          >
            <SelectTrigger className="h-7 w-auto gap-1.5 border-border bg-secondary px-2.5 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAT_SCOPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            rows={1}
            placeholder="Ask a follow-up about themes, sources, roadmap priorities, or evidence…"
            className="max-h-28 min-h-[40px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || thinking}
            aria-label="Send message"
            className="size-10 shrink-0"
          >
            <Send className="size-4" aria-hidden="true" />
          </Button>
        </form>
      </div>
    </div>
  )
}

function ChatBubble({
  message,
  onFollowUp,
}: {
  message: ChatMessage
  onFollowUp: (text: string) => void
}) {
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[88%] rounded-lg rounded-tr-sm bg-primary px-3 py-2 text-sm leading-relaxed text-primary-foreground">
          {message.content}
        </div>
        {message.scope && message.scope !== "All Sources" && (
          <span className="mt-1 text-[11px] text-muted-foreground">
            Scope: {message.scope}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[92%] whitespace-pre-line rounded-lg rounded-tl-sm bg-secondary px-3 py-2.5 text-sm leading-relaxed text-foreground">
        {message.content}
      </div>
      {message.followUps && message.followUps.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {message.followUps.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onFollowUp(f)}
              className="rounded-full border border-primary/30 bg-accent/40 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
      style={{ animationDelay: delay }}
    />
  )
}
