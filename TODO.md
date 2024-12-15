[x] pachear el sqlite3
  [x] para que funcione en el browser

[x] Montamos documentator encima y empezamos a documentar todo.
  [x] Hasta que tengamos traducción y marcado
  [x] En español

[x] La siguiente es: rasgos.
  [x] porque con la API de rasgos es como se monta la percepción
  [x] la API consiste en 1 clase Rasgo o ocmo sea
    [x] de primeras tendría que tener:
      [x] memory (constructor)
      [x] connection (constructor)
      [x] logger (constructor)
      [x] on_mount
      [x] on_mounted
      [x] on_unmount
      [x] on_unmounted


En este punto, hay que buscar un punto común entre la API de Rasgos, y las subsiguientes APIs de:
  - API de Percepción
  - API de Fisicalidad

La flexibilidad es máxima, ahora podemos:
  [ ] montar y desmontar rasgos en tiempo de ejecución
    [ ] con asincronibilidad máxima
    [ ] con mount, mounted, unmount, unmounted
    [ ] con las APIs básicas igual: memory, logger, connection
    [ ] pudiendo mapear, cómo quieras, cada API
      [ ] es decir, puedes montar cualquier instancia de clase en cualquier nombre de objeto
      [ ] que eso no sé si es bueno o malo
      [ ] pero permite:
        [ ] ver, rápidamente, los rasgos creados, y acceder a sus propias APIs
        [ ] alterar cualquier API de la memory

Entonces. Las APIs de Percepción y de Fisicalidad se generan por vía API de Rasgos.

En principio, no creo que deban alterar los métodos de otros objetos de la API global.

Creo que deben ceñirse a su propio espacio de nombres, no veo necesidad de más.

Entonces, más adelante, se irán añadiendo otros rasgos, que pueden complicar las cosas.
[ ] Pero ahora mismo, habría que pensar en:
  [ ] cómo hacer una API de Percepción que:
    [ ] permita crear server cuando pueda
    [ ] fallbackee a crear client cuando no pueda server
    [ ] pero permanezca todo bajo una misma capa
      [ ] donde el server tendría unas escuchas extra y un proceso diferente de despliegue
      [ ] donde el client necesitaría un nodo fuerte al que asociarse

La API podría hacer algo así, por ejemplo:

```js
await memory.perception.connect()
  // >> esto ya:
  // >>  iniciaría el server en nodejs (si no está ya)
  // >>  iniciaría el client en browser (si no está ya)
  // >>  & abriría los flags de despachar eventos de recepción
await memory.perception.disconnect()

await memory.physic.connect();
  // >> esto ya:
  // >>  iniciaría el server en nodejs (si no está ya)
  // >>  iniciaría el client en browser (si no está ya)
  // >>  & abriría los flags de despachar eventos de emisión
await memory.physic.disconnect();
```

La cosa es que, de lo que queda, tiene que quedar una API prácticamente igual entre un entorno y otro.

De esta forma, tenemos que poder añadirle dinámicamente capacidad para despachar nuevos eventos.

O en su defecto, pasamos todos los eventos por 1, y creamos nuestro discriminator que acepte escalación.

Esto implica tomar todos los eventos de recepción.

Pero también centralizaremos los eventos de emisión. Del cliente. Y del servidor, de todos.

Entonces. Tendríamos luego un mapa de "eventos identificados". Y tendrían un despachador asociado. O varios. Sí, varios.

Aquí viene, ves, aquí hay intríngulis que flipas, hay que darle bastantes vueltas.

Un PERCEPTRÓN es un (parámetro de un) evento específico del SOCKET.IO, en uno de los ON(wherever, callback).
Lo que pasa es que TODOS LOS PERCEPTRONES son procesados por el mismo ON. (Así que es centralizar la API por 1 evento)

Un REACTRÓN es el callback de ese perceptrón.
Lo que pasa es que TODOS LOS REACTRONES pueden ser asociados a cualquier tipo de PERCEPTRÓN.
Los REACTRONES tienen una PRIORIDAD que hace que unos precedan a otros.

Un mismo PRECEPTRÓN puede activar muchos REACTRONES.

Por eso, las asociaciones irían como sigue:

Todo Perceptrón tiene uno o varios tipos. Ejemplo:

```js
new Perceptron({
    types: ["visual", "auditivo", "pielativo", "olfativo"]
});
```

El Perceptrón es lanzado por el emit.

Entonces, la Perception procesará este Perceptrón.

```js
await this.perception.percibe(perceptron);
```

Lo que sucederá dentro, pues, será que:

```js
this.perception.reactrons.forEach(reactron => reactron.react_to(perceptron));
```

Para esto, antes ha habido de haber un:

```js
this.perception.reactrons.add("some", new Reactron(this));
this.perception.reactrons.remove("some");
this.perception.reactrons.replace("some", new Reactron(this));
```

Vale, pero para que se pueda cargar mucho más, partiremos las relaciones entre Perceptron y Reactron por Canales.

Entonces, donde hemos dicho "types", en realidad queremos decir "canales". "Types" siempre es una mala idea, hay que concretar más.

Entonces, los reactrones se distribuirían en canales. Así que esta no sería todavía la API.

Entre this.perception y .reactrons tendría que haber una mención al canal o canales que se quiere referir uno.

De esta forma, un Perceptron ya tiene unos canales asociados a los que va a atacar. Y quedaría algo así:

```js
this.perception.channels(["visual", "auditivo", "etc"]).react_to(perceptron)
this.perception.channels(perceptron.channels).react_to(perceptron)
```

Pero hay que darle otra vuelta más. Porque ese dato no está en el perceptron solamente, también en el reactron.

Así que este filtro... podría definirse desde el reactron. ¿Qué es mejor?

Pues no importa en realidad. Tú puedes hacer que un perceptrón y un reactrón discriminen por sí mismos en qué ocasión atacar.

Lo único que estamos requiriendo y permitiendo es:
  - Permitir: que perceptrón y reactrón se encuentren siempre vía CANALES.
  - Requerir: que en cada Percepción:
    - se acumulen 1 sola vez todos los Reactrones matcheados por los CANALES del Preceptrón
    - se ordenen estos reactrones
    - se llamen estos reactrones con el perceptrón y la memoria pertinente

Podemos hacer que el perceptrón tenga su propia API, y seguramente sería lo más recomendable.


Así que nos quedamos con esta idea:

- Perceptrón tiene Canales.
- Percepción coge Perceptrón.canales, coge Reactrones con esos canales 1 vez, los ordena y los despacha.
- Percepción tiene memoria de Reactrones.



Perceptrón => despachado por => {
    "visual": function(perceptron) {
        // El this es la memory, igual que siempre
    }
}

socket servidor{
    recibe{
        eventos{ "perceptron" }que luego serán despachados por{
            un mapa de discriminadores que{
                asocian un{ "reactron" }
            }
        }
    }
}





Tenemos funcionalidad en el browser.

La librería es, ahora mismo, 100% compatible con nodejs y browser.

El siguiente paso implica servidores:

  - socket.io y socket.io-client.
  - Esto obliga a que haya mínimo 1 servidor para que pueda haber comunicación.
  - Y la comunicación mínima es entre el cliente y el servidor.

La percepción, son los eventos que defines con:
  .on("message.from.server", funcly);
  .on("message.from.server", funcly);
  .on("message.from.server", funcly);
  .on("message.from.server", funcly);
  .on("message.from.server", funcly);

La fisicalidad, implica a parte de estos eventos, y luego a:
  .emit("eventtype", dataly);

Nos interesan estos 2 métodos, al margen de todo lo otro. Más el connect.