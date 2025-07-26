import { Hono } from "hono";
import { PrismaClient } from "../generated/prisma/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { verify } from "hono/jwt";
import { createBlogInput,updateBlogInput } from "@sanandobanerjee/medium-app--common";
export const blogRouter=new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  },Variables:{
    userId: String
  }
}>();

blogRouter.use("/*",async(c,next)=>{
    const authHeader =c.req.header("Authorization") || ""
    //empty string used to handle cases where authHeader is undefined, so no tyoe error
    try{
        const user= await verify(authHeader,c.env.JWT_SECRET)
        if(user){
            c.set("userId",String(user.id))
            await next(); 
        } else {
            c.status(403)
        return c.json({
            message:"you are not logged in"
            })
        }
    }catch(e){
        c.status(403)
        return c.json({
            message:"you are not logged in"
            })
    }
})

//to create new blogs
blogRouter.post('/', async(c) => {
    const body = await c.req.json();
    const { success }= createBlogInput.safeParse(body);
    if(!success){
        c.status(411);
        return c.json({
            message: "Inputs are incorrect"
        })
    }
    
    const authorId=c.get("userId")
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.create({
        data:{
            title: body.title,
            content: body.content,
            authorId: Number(authorId)      //extracted from middleware
        }
    })
    return c.json({
        id:blog.id
    })
})

//to update posted blogs
blogRouter.put('/', async(c) => {
    const body = await c.req.json();
    const { success }=updateBlogInput.safeParse(body);
    if(!success){
        c.status(411);
        return c.json({
            message: "Inputs are incorrect"
        })
    }
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.update({
        where:{
            id:body.id
        },
        data:{
            title: body.title,
            content: body.content
        }
    })
    return c.json({
        id:blog.id
    })
})

//generate all blogs on landing page. to-do: add pagination
blogRouter.get('/bulk',async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const blogs = await prisma.blog.findMany();

    return c.json({
        blogs
    })
})

//generate blog by a specific creator
blogRouter.get('/:id', async(c) => {
    const id = c.req.param("id");

    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    try{
        const blog = await prisma.blog.findFirst({
            where:{
            id:(id)
            },
        })
    
        return c.json({
            blog
        });
    } catch(e) {
        c.status(411);
        return c.json({
            message: "Blog cannot be fetched"
        })
    }
    
})

//generate all blogs on landing page. to-do: add pagination
blogRouter.get('/bulk',async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())
    const blogs = await prisma.blog.findMany();

    return c.json({
        blogs
    })
})