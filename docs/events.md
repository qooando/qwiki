# Events

Every subclass of `Base` implements its local event manager.
Global `$qw` qwiki instance is used for global events.

Qwiki core events are provided as constants in `EventNames` object.

## Add a callback

You can add a callback to any event, there is no
actual limitation.

```ts
import {EventContext} from "./EventManager";

$qw.on("myFunkyEvent", async (ctx: EventContext, name: string) => {
    console.log(`Hello world, ${name}`)
})
```

Callbacks can be ordered by priority

```ts

$qw.on("myFunkyEvent", async (ctx: EventContext, name: string) => {
    console.log(`Good morning, ${name}`)
}, -10)

$qw.on("myFunkyEvent", async (ctx: EventContext, name: string) => {
    console.log(`Good evening, ${name}`)
}, 10)
```

## Call an event

To call an event call the emit function, you can pass
the event name or a `EventContext` object. Additional
parameters are provided as is to all callbacks.

```ts
await $qw.emit("myFunkyEvent", "Bob")
```

callbacks are executed in priority order. If you want
to run them in parallel, pass a proper context

```ts
await $qw.emit({
    event: "myFunkyEvent",
    parallel: true
}, "Bob")
```
