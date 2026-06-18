import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createTestimonialStep,
  updateTestimonialStep,
  deleteTestimonialStep,
} from "./steps/testimonial"

export const createTestimonialWorkflow = createWorkflow(
  "create-testimonial",
  function (input: Record<string, unknown>) {
    return new WorkflowResponse(createTestimonialStep(input))
  }
)

export const updateTestimonialWorkflow = createWorkflow(
  "update-testimonial",
  function (input: { id: string } & Record<string, unknown>) {
    return new WorkflowResponse(updateTestimonialStep(input))
  }
)

export const deleteTestimonialWorkflow = createWorkflow(
  "delete-testimonial",
  function (input: { id: string }) {
    return new WorkflowResponse(deleteTestimonialStep(input))
  }
)
