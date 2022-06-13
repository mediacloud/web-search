import {
    useGetLeadsQuery,
    useDeleteLeadMutation,
    useUpdateLeadMutation,
    useAddLeadMutation
} from "../api/leads";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignCenter, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons'
import React, { Fragment, useState } from "react"
import { Table } from "@mui/material";


const UserList = () => {
    const [newLead, setNewLead] = useState('')

    const {
        data: leads,
        isLoading,
        isSuccess,
        isError,
        error
    } = useGetLeadsQuery()

    const [addLead] = useAddLeadMutation();
    const [updateLead] = useUpdateLeadMutation();
    const [deleteLead] = useDeleteLeadMutation();

    let val = 1;

    const handleSubmit = (e) => {
        val++;
        e.preventDefault();
        // addTodo
        console.log(newLead);
        //addLead({ "id": val, "first_name": newLead, "last_name": newLead, "email": newLead, "message": newLead, completed: false })
        setNewLead('')
    }


    const inputStyle = {
        paddingLeft: "20px",
    }


    const newItemSection =
        <form onSubmit={handleSubmit}>

            <div className="new-lead" style={inputStyle}>
                <input
                    type="text"
                    id="new-lead"
                    value={newLead}
                    onChange={(e) => setNewLead(e.target.value)}
                    placeholder="Enter a new lead"
                />

                <button className="submit">
                    <FontAwesomeIcon icon={faUpload} />
                </button>

            </div>
        </form>




    let content;

    const trStyle = {
        fontSize: "20px"
    }

    if (isLoading) {
        content = <p>Loading...</p>
    }

    else if (isSuccess) {
        content =
            <Fragment>
                <table className="table table-striped">
                    <thead>
                        <tr style={trStyle}>
                            <td>ID</td>
                            <td>Username</td>
                            <td>Email</td>
                            <td>Admin?</td>
                            <td>Superuser?</td>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead) => {
                            return (
                                <tr key={lead.id}>
                                    <td>{lead.id}</td>
                                    <td>{lead.username}</td>
                                    <td>{lead.email}</td>
                                    <td>{lead.is_staff.toString()}</td>
                                    <td>{lead.is_superuser.toString()}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </Fragment>
    }


    else if (isError) {
        content = <p>{error}</p>
    }

    const usersStyle = {
        fontSize: "50px",
        textAlign: "center"
    }
    return (
        <main>
            <h1 style={usersStyle}>Leads</h1>
            {newItemSection}
            {content}
        </main>
    )
}
export default UserList
