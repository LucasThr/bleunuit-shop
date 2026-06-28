import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  upsertContactStep,
  type UpsertContactInput,
} from "./steps/upsert-contact"

const updateContactWorkflow = createWorkflow(
  "update-contact",
  function (input: UpsertContactInput) {
    const contact = upsertContactStep(input)

    return new WorkflowResponse(contact)
  }
)

export default updateContactWorkflow
