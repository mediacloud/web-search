// React
import React from "react";

// information from store
import { selectCurrentUser } from '../../services/userApi';
import { useSelector } from 'react-redux';


function display(user) {
  if (user.isLoggedIn) {
    return (
      <>
        <h1> Account Username: {currentUser.username} </h1>
      </>
    )
  }
  else {
    return (
      <h1>Logged out</h1>
    )
  }
}


const Account = () => {
  const currentUser = useSelector(selectCurrentUser);


  return (

    <div style={{ paddingTop: "200px" }}>
      {/* {display(user.isLoggedIn)} */}
      <h1>hello</h1>
    </div>

  );
}

export default Account
