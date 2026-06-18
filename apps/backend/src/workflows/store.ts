import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createStoreStep,
  updateStoreStep,
  deleteStoreStep,
} from "./steps/store"

export const createStoreWorkflow = createWorkflow(
  "create-store",
  function (input: Record<string, unknown>) {
    return new WorkflowResponse(createStoreStep(input))
  }
)

export const updateStoreWorkflow = createWorkflow(
  "update-store",
  function (input: { id: string } & Record<string, unknown>) {
    return new WorkflowResponse(updateStoreStep(input))
  }
)

export const deleteStoreWorkflow = createWorkflow(
  "delete-store",
  function (input: { id: string }) {
    return new WorkflowResponse(deleteStoreStep(input))
  }
)
