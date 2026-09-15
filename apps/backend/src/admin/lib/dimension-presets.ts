// Standard French bedding sizes, offered as a preset so a product's sizes are
// picked rather than retyped. Editing this list is the supported way to add a
// size: it only feeds the picker, so changing it never affects products that
// were already created.
export const OPTION_TITLE = "Dimensions"

export type DimensionGroup = {
  label: string
  values: string[]
}

export const DIMENSION_GROUPS: DimensionGroup[] = [
  {
    label: "Matelas et sommiers",
    values: [
      "80×200",
      "90×190",
      "90×200",
      "140×190",
      "140×200",
      "160×200",
      "180×200",
      "200×200",
    ],
  },
  {
    label: "Oreillers",
    values: ["40×60", "50×70", "60×60", "65×65"],
  },
  {
    label: "Couettes",
    values: ["140×200", "200×200", "220×240", "240×260"],
  },
]
