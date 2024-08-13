/*
* Error Managment
*/

export enum FetchErrorType {
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  Server,
  Maintenance,
  Unknown
}

const FetchErrorsMap = new Map<number, FetchErrorType>()

FetchErrorsMap.set(400, FetchErrorType.BadRequest)
FetchErrorsMap.set(401, FetchErrorType.Unauthorized)
FetchErrorsMap.set(403, FetchErrorType.Forbidden)
FetchErrorsMap.set(404, FetchErrorType.NotFound)
FetchErrorsMap.set(500, FetchErrorType.Server)
FetchErrorsMap.set(503, FetchErrorType.Maintenance)
FetchErrorsMap.set(0, FetchErrorType.Unknown)

export class FetchError extends Error {
  type: FetchErrorType
  status: number

  constructor(type: FetchErrorType, message: string, status: number) {
    super(message)
    this.type = type
    this.status = status
  }
}

export type ErrorMiddleware = (httpResponse: Response) => void


/*
* Fetch base classs
*/

export class Fetch {
  protected base: string
  protected jwtToken: string | null = null
  protected errorMiddlewares: Map<FetchErrorType, Array<ErrorMiddleware>> = new Map()
  protected aditionalData: Map<string, any> = new Map()

  constructor(url: string) {
    this.base = url
    return this
  }

  /*
  * Add global data for all requests
  */
  public addGlobalPayload (key: string, data: any = {}) {
    this.aditionalData.set(key, data)
    return this
  }

  protected getGlobalPayload () {
    return Object.fromEntries(this.aditionalData)
  }

  public removeGlobalPayload (key: string) {
    this.aditionalData.delete(key)
    return this
  }

  /*
  * Authorization Token (JWT)
  */
  public setAuthToken(prefix="JWT", token: string) {
    this.jwtToken = `${prefix} ${token}`
    return this
  }

  public deleteAuthToken() {
    this.jwtToken = null
    return this
  }

  /*
   * Add callbacks that will be called when an error happens at any request made 
   */

  public setErrrorMiddleware(type: FetchErrorType, callback: ErrorMiddleware) {
    const callbacks = this.errorMiddlewares.get(type)
    if (callbacks) {
      callbacks.push(callback)
    } else {
      const callbacks = [callback]
      this.errorMiddlewares.set(type, callbacks)
    }
    return this
  }

  /*
  * This method analyse response to throw real errors, not simple JS ugly ones
  */
  protected processResponse = async (httpResponse: Response) => {

    const status = httpResponse.status
    const contentType = httpResponse.headers.get("content-type")
    let response = (contentType && contentType.includes("application/json")) ? await httpResponse.json() : await httpResponse.text()
    
    // Successful responses
    if (httpResponse.status >=100 && httpResponse.status < 300) {
      return response
    }
    
    // Eror responses
    let errorType = FetchErrorsMap.get(status)
    if (errorType === undefined) errorType = FetchErrorType.Unknown // Fallback error type
    // Call Error Midlewares
    const callbacks = this.errorMiddlewares.get(errorType)
    if (callbacks) {
      for (const callback of callbacks) {
        callback(httpResponse)
      }
    }
  
    throw new FetchError(errorType, response, status)
  }

  /*
  * Bluid header at every request
  */
  protected  buildHeaders(contentType="application/json") {
    const headers = new Headers();
    headers.set('Content-Type', contentType)

    if (this.jwtToken) {
      headers.set("Authorization",this.jwtToken)
    }
  
    return headers
  }

  /*
  * CRUD 
  */
  protected get(url: string, options={}, rawResponse=false) {
    const req = fetch(`${this.base}${url}`, {
      headers: this.buildHeaders(),
      ...options
    })

    if (rawResponse) {
      return req
    } 

    return req.then(this.processResponse)
  }

  protected post(url: string, payload: Array<any> | Object = {}) {
    let fullPayload 
    
    if (Array.isArray(payload)) {
      fullPayload = payload
    } else {
      fullPayload = {
        ...this.getGlobalPayload(),
        ...payload
      }
    }

    return fetch(`${this.base}${url}`, {
      method: 'POST',
      body: JSON.stringify(fullPayload),
      headers: this.buildHeaders(),
      mode: "cors",
    }).then(this.processResponse)
  }

  protected postForm(url: string, payload={}) {
    const fullPayload = {
      ...this.getGlobalPayload(),
      ...payload
    }

    const data = new FormData()
    for (const payloadKey of Object.keys(fullPayload)) {
      // @ts-ignore
      data.append(payloadKey, fullPayload[payloadKey])
    }

    const headers = this.buildHeaders("multipart/form-data")

    return fetch(`${this.base}${url}`, {
      method: 'POST',
      body: data,
      headers: headers,
      mode: "cors",
    }).then(this.processResponse)
  }

  protected patch(url: string, payload={}) {
    const fullPayload = {
      ...this.getGlobalPayload(),
      ...payload
    }
    return fetch(`${this.base}${url}`, {
      method: 'PATCH',
      body: JSON.stringify(fullPayload),
      headers: this.buildHeaders(),
    }).then(this.processResponse)
  }

  protected delete(url: string) {
    return fetch(`${this.base}${url}`, {
      method: 'DELETE',
      headers: this.buildHeaders(),
    }).then(this.processResponse)
  }
}