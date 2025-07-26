import { Hono } from "hono";
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { PrismaClient } from "../generated/prisma/edge";
import { signupInput,signinInput } from "@sanandobanerjee/medium-app--common";

export const userRouter=new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
}>();

userRouter.post('/signup', async(c) => {
  const body = await c.req.json();
  const { success } = signupInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({
      message: "Inputs are incorrect"
    })
  }
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  try{
    const user = await prisma.user.create({
    data:{
      email: body.email,
      password: body.password,
      name: body.name
    }
  })
  const jwt = await sign({
    id: user.id
  },c.env.JWT_SECRET);

  return c.text(jwt)
  }catch(e){
    c.status(411);
    return c.text('User already exists')
  }
})

userRouter.post('/signin', async (c) => {
  const body = await c.req.json();
  const { success } = signinInput.safeParse(body);
  if(!success){
    c.status(411);
    return c.json({
      message: "Inputs are incorrect"
    })
  }

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  try{
    const user = await prisma.user.findFirst({
    where:{
      email: body.email,
      password: body.password,
    }
  })

  if(!user){
    c.status(403);
    return c.text('Invalid')
  }
  const jwt = await sign({
    id: user.id
  },c.env.JWT_SECRET);

  return c.text(jwt)
  }catch(e){
    c.status(411);
    return c.text('User already exists')
  }})
