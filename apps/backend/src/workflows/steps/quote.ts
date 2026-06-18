import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { QUOTES_MODULE } from "../../modules/quotes"
import QuotesModuleService from "../../modules/quotes/service"

export const createQuoteStep = createStep(
  "create-quote-step",
  async (input: Record<string, unknown>, { container }) => {
    const quotes: QuotesModuleService = container.resolve(QUOTES_MODULE)
    const created = await quotes.createQuoteRequests(input as any)
    return new StepResponse(created, created.id)
  },
  async (id, { container }) => {
    if (!id) return
    const quotes: QuotesModuleService = container.resolve(QUOTES_MODULE)
    await quotes.deleteQuoteRequests(id)
  }
)

export const updateQuoteStep = createStep(
  "update-quote-step",
  async (input: { id: string } & Record<string, unknown>, { container }) => {
    const quotes: QuotesModuleService = container.resolve(QUOTES_MODULE)
    const updated = await quotes.updateQuoteRequests(input as any)
    return new StepResponse(updated)
  }
)

export const deleteQuoteStep = createStep(
  "delete-quote-step",
  async ({ id }: { id: string }, { container }) => {
    const quotes: QuotesModuleService = container.resolve(QUOTES_MODULE)
    await quotes.deleteQuoteRequests(id)
    return new StepResponse(id)
  }
)
