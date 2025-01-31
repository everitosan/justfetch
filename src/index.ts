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

type Options = {
  mode?: RequestMode,
  credentials?: RequestCredentials
}


type RequesElements = {
  options?: Options
  headers?: Headers,
  payload?: Array<any> | FormData | Object ,
  rawResponse?: boolean
}

type RequestMethod = "GET" | "POST" | "PATCH" | "DELETE"

/*
* Fetch base classs
*/

export class Fetch {
  protected base: string
  protected jwtToken: string | null = null
  protected errorMiddlewares: Map<FetchErrorType, Array<ErrorMiddleware>> = new Map()
  protected aditionalData: Map<string, any> = new Map()

  protected globalOptions: Options = {}
  protected globalHeaders = new Headers()

  constructor(url: string) {
    this.base = url
    return this
  }

  /*
  * Global payload for all requests
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
  * Global headers
  */
 public addHeader(key: string, value: string) {
  this.globalHeaders.set(key, value)
  return this
 }

  /*
  * Configure gloabl options
  */

  public setOptions(options: Options) {
    this.globalOptions = options
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

  public buildRequestDetails(method: RequestMethod, e: RequesElements): RequestInit {
    const reqHeaders: Headers = new Headers()
    let options = Object.assign({}, this.globalOptions)
    let payload = Object.assign({}, this.getGlobalPayload())
    
    this.globalHeaders.forEach((value, key) => reqHeaders.set(key, value))
    
    
    // Merge headers
    if (e.headers) e.headers.forEach((value, key) => {
      reqHeaders.set(key, value)
    })

    // Merge options
    if (e.options) {
        options = {
          ...options,
        ...e.options
      }
    }
  

    if (method === "GET" ) {
      return {
        headers: reqHeaders,
        ...options
      }
    }
  
    // If is not GET request we 
    //  -> set content-type based in payload
    //  -> set body in correct format
    if (e.payload instanceof FormData) {
      // if payload is formdata, remove content type
      reqHeaders.delete("Content-Type")
    } else {
      reqHeaders.set("Content-Type", "application/json")
    }

    // Merge payload only works for formData and json
    let body: string | FormData 
    if (e.payload instanceof FormData) {
      // !todo 
      // add to form data global payload
      body = e.payload
    } else if (Array.isArray(e.payload)) {
      body = JSON.stringify(e.payload)
    } else {
      body = JSON.stringify({
        ...payload,
        ...e.payload
      })
    }
    
    return {
      method: method,
      headers: reqHeaders,
      body,
      ...options
    }
  }

  /*
  * CRUD 
  */

  protected get(url: string, e: RequesElements = {}) {
    const req = fetch(`${this.base}${url}`, this.buildRequestDetails('GET', e)) 
    if (e.rawResponse) {
      return req
    } 
    return req.then(this.processResponse)
  }

  protected post(url: string, e: RequesElements={}) {
    return fetch(`${this.base}${url}`, this.buildRequestDetails("POST", e))
      .then(this.processResponse)
  }

  protected patch(url: string, e: RequesElements={}) {
    return fetch(`${this.base}${url}`, this.buildRequestDetails("PATCH", e))
      .then(this.processResponse)
  }

  protected delete(url: string, e: RequesElements={}) {
    return fetch(`${this.base}${url}`, this.buildRequestDetails("DELETE", e))
      .then(this.processResponse)
  }
}