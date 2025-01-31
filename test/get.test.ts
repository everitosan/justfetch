import { Fetch, FetchError, FetchErrorType } from "../src"

type CatInfo = {
  id: string,
  url: string,
  width: number,
  height: number
}

class CatApi extends Fetch {

  getRandom(): Promise<Array<CatInfo>> {
    return this.get("/v1/images/search", { options: {credentials: "same-origin"} })
  }
  
  badRequest() {
    return this.get("/v1/images/unknown")
  }

  notFound() {
    return this.get("/v1/404")
  }
}
const w = new CatApi("https://api.thecatapi.com")
  .setOptions({credentials: "same-origin"})
  .addHeader("Authorization", "Bearer fhsofu023elkqjr09iqldjaw-edowqaoeu09fa")

describe("Fetch implementation", () => {
  it("should get a cat image", async () => {
    const info = await w.getRandom()
    expect(info.length).toBe(1)
  })

  it("should trigger Bad Request", async () => {
    try {
      await w.badRequest()
    } catch(e) {
      const error = e as FetchError
      expect(error.status).toBe(400)
      expect(error.type).toBe(FetchErrorType.BadRequest)
    }
  })

  it("should trigger Not Found", async () => {
    try {
      await w.notFound()
    } catch(e) {
      const error = e as FetchError
      expect(error.status).toBe(404)
      expect(error.type).toBe(FetchErrorType.NotFound)
    }
  })

})