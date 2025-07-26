import { Hono } from 'hono'
import { userRouter } from './routes/user'
import { blogRouter } from './routes/blog'

const app = new Hono<{
  //Bindings fn used to inject environment variables like connection string into ts
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
}>()

app.get("/", (c) => {
  return c.json({
    message: "Hi"
  })
})

app.route("api/v1/user/",userRouter)
app.route("api/v1/user/blog",blogRouter)

export default app