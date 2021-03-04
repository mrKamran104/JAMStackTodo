const { ApolloServer, gql } = require('apollo-server-lambda')
const faunadb = require('faunadb')
const q = faunadb.query
const dotenv = require("dotenv");
dotenv.config();

const typeDefs = gql`
  type Query {
    getAllTodos: [Todo!]
  }
  type Mutation{
    addTodo(task: String!): Todo
    updateTodo(id: ID!, task: String!): Todo
    deleteTodo(id: ID!): Todo
  }
  type Todo {
    id: ID!
    task: String!
  }
`
const client = new faunadb.Client({
  secret: process.env.FAUNADB_ADMIN_SECRET
})

const resolvers = {
  Query: {
    getAllTodos: async () => {
      try {
        const res = await client.query(q.Map(
          q.Paginate(q.Documents(q.Collection("gql_todos"))),
          q.Lambda((x) => q.Get(x))
        ))

        // console.log(res)
        return res.data.map(({ ref, data }) => {
          return {
            id: ref.id,
            task: data.task,
          };
        });
      } catch (error) {
        return { statusCode: 500, body: error.toString() }
      }
    },
    // authorByName: (root, args) => {
    //   console.log('authorByName', args.name)
    //   return authors.find((author) => author.name === args.name) || 'NOTFOUND'
    // },
  },
  Mutation: {
    addTodo: async (_, { task }) => {
      try {
        const todoItem = {
          data: { task: task }
        }

        const res = await client.query(q.Create(q.Collection('gql_todos'), todoItem))

        return {
          id: res.ref.id,
          task: res.data.task,
        };
      } catch (error) {
        return { statusCode: 500, body: error.toString() }
      }
    },
    updateTodo: async (_, { id, task }) => {
      // console.log(task)
      try {
        const res = await client.query(
          q.Update(q.Ref(q.Collection("gql_todos"), id), {
            data: { task: task },
          })
        );
        // console.log(res.data.task)
        return {
          id: res.ref.id,
          task: res.data.task,
        };
      } catch (error) {
        return { statusCode: 500, body: error.toString() }
      }
    },
    deleteTodo: async (_, { id }) => {
      try {
        const res = await client.query(q.Delete(q.Ref(q.Collection("gql_todos"), id)))

        return {
          id: res.ref.id,
          task: res.data.task
        }
      } catch (error) {
        return { statusCode: 500, body: error.toString() }
      }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const handler = server.createHandler()

module.exports = { handler }
