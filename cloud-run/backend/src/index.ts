import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  ...app,
  port: Number(process.env.PORT ?? 8080),
  hostname: '0.0.0.0',
}
