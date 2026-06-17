import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  upsertHomepageStep,
  type UpsertHomepageInput,
} from "./steps/upsert-homepage"

const updateHomepageWorkflow = createWorkflow(
  "update-homepage",
  function (input: UpsertHomepageInput) {
    const homepage = upsertHomepageStep(input)

    return new WorkflowResponse(homepage)
  }
)

export default updateHomepageWorkflow
