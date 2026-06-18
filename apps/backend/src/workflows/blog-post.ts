import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createBlogPostStep,
  updateBlogPostStep,
  deleteBlogPostStep,
} from "./steps/blog-post"

export const createBlogPostWorkflow = createWorkflow(
  "create-blog-post",
  function (input: Record<string, unknown>) {
    return new WorkflowResponse(createBlogPostStep(input))
  }
)

export const updateBlogPostWorkflow = createWorkflow(
  "update-blog-post",
  function (input: { id: string } & Record<string, unknown>) {
    return new WorkflowResponse(updateBlogPostStep(input))
  }
)

export const deleteBlogPostWorkflow = createWorkflow(
  "delete-blog-post",
  function (input: { id: string }) {
    return new WorkflowResponse(deleteBlogPostStep(input))
  }
)
