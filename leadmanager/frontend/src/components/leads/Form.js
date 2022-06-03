import {
  useAddLeadMutation
} from "../../features/api/apiSlice";

import { useState } from "react";
import { render } from "react-dom";

const TodoList = () => {
  const [newTodo, setNewTodo] = useState('');
  const [addLead] = useAddLeadMutation();

  let state = {
    first_name: '',
    last_name: '',
    email: '',
    message: ''
  };


  // onChange takes in an event, setsState: 
  // e.target.name 
  onChange = e => this.setState({
    [e.target.first_name]:
      e.target.value
  });

  onSubmit = e => {
    e.preventDefault();
    console.log("submit");
  }


  render() {
    const{first_name, last_name, email, message} = this.state; 

    return(
      
    )
  }





}

