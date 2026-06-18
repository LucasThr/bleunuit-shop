import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createQuoteStep,
  updateQuoteStep,
  deleteQuoteStep,
} from "./steps/quote"

export const createQuoteWorkflow = createWorkflow(
  "create-quote",
  function (input: Record<string, unknown>) {
    return new WorkflowResponse(createQuoteStep(input))
  }
)

export const updateQuoteWorkflow = createWorkflow(
  "update-quote",
  function (input: { id: string } & Record<string, unknown>) {
    return new WorkflowResponse(updateQuoteStep(input))
  }
)

export const deleteQuoteWorkflow = createWorkflow(
  "delete-quote",
  function (input: { id: string }) {
    return new WorkflowResponse(deleteQuoteStep(input))
  }
)
