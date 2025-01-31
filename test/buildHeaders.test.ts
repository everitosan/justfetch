import { Fetch } from "../src"

class CatApi extends Fetch {}

const w = new CatApi("https://api.thecatapi.com")
  .setOptions({credentials: "same-origin"})
  .addHeader("Authorization", "Bearer fhsofu023elkqjr09iqldjaw-edowqaoeu09fa")

describe("Build Request", () => {
  it("should set content type for json", async () => {
    let data = {
      some: "content"
    }
    const { headers } = w.buildRequestDetails('POST', {payload: data})

    let found = false
    if (headers && typeof headers != "string") {
      //@ts-ignore
      for (const [key, value] of headers.entries()) {
        if (key === "content-type" && value === "application/json") found = true
      }
      expect(found).toBe(true)

    } else {
      throw "Content Type was not automatically setted"
    }
  })

  it("should delete content-type header if payload is FormData", async () => {
    let data = new FormData()
    w.addHeader("Content-Type", "multiform-data")

    const { headers } = w.buildRequestDetails('POST', {payload: data})

    let found = false
    if (headers && typeof headers != "string") {
      //@ts-ignore
      for (const [key, value] of headers.entries()) {
        if (key === "content-type") found = true
      }
      expect(found).toBe(false)

    } else {
      throw "Content Type was not automatically processed"
    }
  })

})