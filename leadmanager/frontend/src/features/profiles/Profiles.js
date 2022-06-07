import {
    useGetLeadsQuery,
    useDeleteLeadMutation,
    useUpdateLeadMutation,
    useAddLeadMutation
} from "../api/apiSlice";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faUpload } from '@fortawesome/free-solid-svg-icons'
import React, { Fragment, useState } from "react"
import { Table } from "@mui/material";


const Profiles = () => {
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


    const newItemSection =
        <form onSubmit={handleSubmit}>

            <div className="new-lead">
                <input
                    type="text"
                    id="new-lead"
                    value={newLead}
                    onChange={(e) => setNewLead(e.target.value)}
                    placeholder="Enter new lead"
                />

                <button className="submit">
                    <FontAwesomeIcon icon={faUpload} />
                </button>
            </div>
        </form>



    let content;

    if (isLoading) {
        content = <p>Loading...</p>
    } else if (isSuccess) {
        content =
            <Fragment>
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <td>ID</td>
                            <td>First name</td>
                            <td>Last name</td>
                            <td>Email</td>
                            <td>Message</td>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead) => {
                            return (
                                <tr key= {lead.id}>
                                    <td>{lead.id}</td>
                                    <td>{lead.first_name}</td>
                                    <td>{lead.last_name}</td>
                                    <td>{lead.email}</td>
                                    <td>{lead.message}</td>
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
    return (
        <main>
            <h1>Leads</h1>
            {newItemSection}
            {content}
        </main>
    )
}
export default Profiles






