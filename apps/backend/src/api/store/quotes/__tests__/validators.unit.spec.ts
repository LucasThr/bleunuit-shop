import { CreateQuoteSchema } from "../validators"

describe("CreateQuoteSchema", () => {
  it("accepts a valid payload", () => {
    const result = CreateQuoteSchema.safeParse({
      name: "Jean Dupont",
      email: "jean@example.com",
      phone: "0600000000",
      message: "Bonjour, je souhaite un devis.",
      product_id: "prod_1",
      product_title: "Matelas Confort",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a minimal payload (only required fields)", () => {
    const result = CreateQuoteSchema.safeParse({
      name: "Jean",
      email: "jean@example.com",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid email", () => {
    const result = CreateQuoteSchema.safeParse({
      name: "Jean",
      email: "not-an-email",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a missing required field (name)", () => {
    const result = CreateQuoteSchema.safeParse({
      email: "jean@example.com",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an empty name", () => {
    const result = CreateQuoteSchema.safeParse({
      name: "",
      email: "jean@example.com",
    })
    expect(result.success).toBe(false)
  })
})
