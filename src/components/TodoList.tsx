import React, { useEffect, useState } from "react"
import { useQuery, useMutation } from "@apollo/client"
import gql from "graphql-tag"
import "./TodoList.css"
import Swal from "sweetalert2"

const GET_TODOS = gql`
  {
    getAllTodos {
      id
      task
    }
  }
`

const ADD_TODO = gql`
  mutation addTodo($task: String!) {
    addTodo(task: $task) {
      id
      task
    }
  }
`
const UPDATE_TODO = gql`
  mutation($id: ID!, $task: String!) {
    updateTodo(id: $id, task: $task) {
      id
      task
    }
  }
`

const DELETE_TODO = gql`
  mutation($id: ID!) {
    deleteTodo(id: $id) {
      id
      task
    }
  }
`

export default function TodoList() {
  const [task, setTask] = useState<string>("")
  const { loading, error, data } = useQuery(GET_TODOS)
  const [addTodo] = useMutation(ADD_TODO)
  const [updateTodo] = useMutation(UPDATE_TODO)
  const [deleteTodo] = useMutation(DELETE_TODO)

  const updateTask = async (todo: { task: string; id: number }) => {
    const result: { value: string } = await Swal.mixin({
      input: "text",
      confirmButtonText: "Update",
      showCancelButton: true,
    }).queue([
      {
        titleText: "Enter Task",
        input: "text",
        inputValue: todo.task,
      },
    ])
    if (result.value) {
      updateTodo({
        variables: {
          id: todo.id,
          task: result.value[0],
        },
        refetchQueries: [{ query: GET_TODOS }],
      })
    }
  }

  const deleteTask = (id: number) => {
    deleteTodo({
      variables: {
        id: id,
      },
      refetchQueries: [{ query: GET_TODOS }],
    })
  }

  const addTask = (e: any) => {
    e.preventDefault()
    if (task === "")
      return Swal.fire("Error", "Please write some words", "error")

    addTodo({
      variables: {
        task: e.target.title.value,
      },
      refetchQueries: [{ query: GET_TODOS }],
    })
    setTask("")
  }

  if (loading) {
    return <h2>Loading...</h2>
  }

  if (error) {
    console.log(error)
    return <h2>Something is wrong...</h2>
  }

  return (
    <div>
      <h2>Todo App</h2>
      <div>
        <form className="inputBtn" onSubmit={addTask}>
          <input
            name="title"
            value={task}
            placeholder="Enter task . . ."
            onChange={e => setTask(e.target.value)}
          />
          <button>ADD</button>
        </form>
      </div>
      <div style={{ marginTop: "25px" }}>
        {!loading ? (
          data.getAllTodos?.map((todo: { id: number; task: string }) => {
            return (
              <div className="card" key={todo.id}>
                <div style={{ textAlign: "left" }}>{todo.task}</div>
                <div>
                  <button onClick={() => updateTask(todo)}>Edit</button>
                  <button
                    style={{ marginLeft: "10px" }}
                    onClick={() => deleteTask(todo.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <h2>Loading...</h2>
        )}
      </div>
    </div>
  )
}
