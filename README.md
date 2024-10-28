# JustFetch

Este proyecto es una pequeña biblioteca basada en `fetch` y `typescript` que permite hacer peticiones de una forma más rápida considerando el crear una clase con métodos para la interacción con el api.

```bash
$ npm i justfetch-ts
```

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
  .addHeader("Content-Type", "application/json")
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
Permite agregar callbacks para manejar errores en cualquiera de las peticiones que sean accionadas por la clase. 

```ts
cat.setErrrorMiddleware(FetchErrorType.BadRequest, (httpResponse: Response) => {
  alert("Verificar el request")
})

cat.setErrrorMiddleware(FetchErrorType.Unauthorized, (httpResponse: Response) => {
  alert("Ups!! parece que no tienes permisos para hacer eso")
})
```

De esta forma, cada que ocurra un error que devuelva un 400 o 401 en cualquier petición realizada por esta clase, se ejecutarán los middlewares asociados.

### Autorización

En caso de que se necesite agregar configuración para mandar credenciales o setear algún token, puede agregarlo una sola vez al inicio o por petición específica:
```ts

  new CatApi("https://api.thecatapi.com")
    .setOptions({credentials: "same-origin"})
    .addHeader("Authorization", "Bearer fhsofu023elkqjr09iqldjaw-edowqaoeu09fa")

  .
  .
  .

  getRandom(): Promise<Array<CatInfo>> {
    return this.get("/v1/images/search", { options: {credentials: "same-origin"} })
  }
```
