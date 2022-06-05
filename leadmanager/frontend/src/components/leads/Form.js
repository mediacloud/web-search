import {
  useAddLeadMutation
} from "../../features/api/apiSlice";
import { useState } from "react";
import { connect } from 'react-redux';


const TodoList = () => {
  // useState (allows me to use state and other React features without writing a class)
  const [newTodo, setNewTodo] = useState('');

  // addLead is a variable and encapsulates teh useAddLeadMutation function we created in ApiSlice
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
    const { first_name, last_name, email, message } = this.state;
    const lead = { first_name, last_name, email, message };
    this.addLead(lead);
    this.setState({
      first_name: '',
      last_name: '',
      email: '',
      message: '',
    });
  };

  render(); {
    const { first_name, last_name, email, message } = this.state;
    return (
      <div className="card card-body mt-4 mb-4">
        <h2>Add Lead</h2>
        <form onSubmit={this.onSubmit}>
          <div className="form-group">
            <label>First Name</label>
            <input
              className="form-control"
              type="text"
              name="first name"
              onChange={this.onChange}
              value={first_name}
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input
              className="form-control"
              type="text"
              name="last name"
              onChange={this.onChange}
              value={last_name}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-control"
              type="text"
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
    );
  }
}

export default connect(null, (Form));
