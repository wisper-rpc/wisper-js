# Routers
A router can be defined by the following TypeScript interface definition.

```ts
interface Router {
	route( path: string, message: Message ): Promise<any> | null;
}
```

Basically, any object which implements the `route` method is considered to be a Router.


## NamespaceRouter
A namespace router looks at parts of a path and delegates to other routers.
