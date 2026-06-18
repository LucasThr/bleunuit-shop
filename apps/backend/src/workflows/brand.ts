import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createBrandStep,
  updateBrandStep,
  deleteBrandStep,
} from "./steps/brand"

export const createBrandWorkflow = createWorkflow(
  "create-brand",
  function (input: Record<string, unknown>) {
    return new WorkflowResponse(createBrandStep(input))
  }
)

export const updateBrandWorkflow = createWorkflow(
  "update-brand",
  function (input: { id: string } & Record<string, unknown>) {
    return new WorkflowResponse(updateBrandStep(input))
  }
)

export const deleteBrandWorkflow = createWorkflow(
  "delete-brand",
  function (input: { id: string }) {
    return new WorkflowResponse(deleteBrandStep(input))
  }
)
