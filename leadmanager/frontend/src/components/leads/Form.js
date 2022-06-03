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


  const newItemSection =
    { first_name, last_name, email, message } = this.state;
    
  <div className="card card-body mt-4 mb-4">
    <h2>Add Lead</h2>
    <form onSubmit={this.onSubmit}>
      <div className="form-group">
        <label>First Name</label>
        <input
          className="form-control"
          type="text"
          name="First Name"
          onChange={this.onChange}
          value={first_name}
        />
      </div>
      <div className="form-group">
        <label>Last Name</label>
        <input
          className="form-control"
          type="text"
          name="Last Name"
          onChange={this.onChange}
          value={last_name}
        />
      </div>
      <div className="form-group">
        <label>Email</label>
        <input
          className="form-control"
          type="email"
          name="email"
          onChange={this.onChange}
          value={email}
        />
      </div>
      <div className="form-group">
        <label>Message</label>
        <textarea
          className="form-control"
          type="text"
          name="message"
          onChange={this.onChange}
          value={message}
        />
      </div>
      <div className="form-group">
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </div>
    </form>
  </div>


  return (
    <main>
      <h1>Form</h1>
      {newItemSection}
    </main>
  
    )

}

export default Form
