import { describe, it, expect } from "vitest"
import { mapProviderStatusToShipmentStatus } from "../../lib/shipping"

describe("mapProviderStatusToShipmentStatus", () => {
  it("maps statuses correctly", () => {
    expect(mapProviderStatusToShipmentStatus("out_for_delivery")).toBe("OUT_FOR_DELIVERY")
    expect(mapProviderStatusToShipmentStatus("delivered")).toBe("DELIVERED")
    expect(mapProviderStatusToShipmentStatus("exception")).toBe("EXCEPTION")
    expect(mapProviderStatusToShipmentStatus("in_transit")).toBe("IN_TRANSIT")
    expect(mapProviderStatusToShipmentStatus("pre_transit")).toBe("PRE_TRANSIT")
  })
})