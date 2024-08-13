# JustFetch

Este proyecto es una pequeña biblioteca basada en `fetch` que permite hacer peticiones de una forma más rápida considerando el crear una clase con métodos para la interacción con el api.

La biblioteca expone dos clases:
- Fetch
- FetchError

Un Enum:
- FetchErrorType

Un type:
- ErrorMiddleware

## Uso

Considerando [thecatapi](https://developers.thecatapi.com/view-account/ylX4blBYT9FaoVd6OhvR?report=bOoHBz-8t) se puede definir una clase como la siguiente.
```ts
import { Fetch, FetchError, FetchErrorType } from "justfetch"


type CatInfo = {
  id: string,
  url: string,
  width: number,
  height: number
}

class CatApi extends Fetch {
  getRandom(): Promise<Array<CatInfo>> {
    return this.get("/v1/images/search")
  }
}

const cat = new CatApi("https://api.thecatapi.com")
```
Al momento de hacer peticiones, los status codes que por definición son considerados como no exitosos, crearán una excepción, permitiendo hacer uso del catch para su manejo.

```ts
const random = async () => {
  try {
    await cat.getRandom()
  } catch(e) {
    const error = e as FetchError

    if (error.status === 404) {
      alert("Recurso no encontrado")
    } else if (error.type === FetchErrorType.BadRequest) {
      alert("Error en la solicitud")
    } else {
      console.log(error.message)
    }
  }
}
```

### Global Payload
Permite definir un payload global que será enviado junto con el `body` en todas las peticiones a partir de su seteo. Se necesita especificar un key para poder setearlo y removerlo a conveniencia.

```ts
cat.addGlobalPayload("location", {lat: 19.232, lng: 3.24424})
  .
  .
  .
cat.removeGlobalPayload("location")
```

### Error Middlewares
Permite agregar callbacks cuando es que sucede un error de forma global en la clase.

```ts
cat.setErrrorMiddleware(FetchErrorType.BadRequest, (httpResponse: Response) => {
  alert("Verificar el request")
})
```

De esta forma, cada que ocurra un error que devuelva un 400 en cualquier petición realizada por esta clase, se ejecutarán los middlewares asociados. Se pueden agregar uno o más registrándolos uno por uno.

### Autorización

En caso de que se necesite agregar un JsonWebToken, puede hacerlo con:
```ts
cat.setAuthToken("Bearer", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c")
  .
  .
  .
cat.deleteAuthToken()
```
