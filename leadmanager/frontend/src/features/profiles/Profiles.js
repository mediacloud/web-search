import {
    useGetLeadsQuery,
    useDeleteLeadMutation,
    useUpdateLeadMutation,
    useAddLeadMutation
} from "../api/apiSlice";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faUpload } from '@fortawesome/free-solid-svg-icons'
import React, { useState } from "react"


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
        setNewLead({ "id": val, "first_name": newLead, "last_name": newLead, "email": newLead, "message": newLead, completed: false })
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
            </div>
            <button className="submit">
                <FontAwesomeIcon icon={faUpload} />
            </button>
        </form>



    let content;

    if (isLoading) {
        content = <p>Loading...</p>
    } else if (isSuccess) {
        content = leads.map(lead => {
            return (
                <article key={lead.id}>
                    <div className="lead">
                        <input
                            type="checkbox"
                            checked={lead.completed}
                            id={lead.id}
                            onChange={() => updateLead({ ...lead, completed: !lead.completed })}
                        />
                        <label htmlFor={lead.id}>{lead.title}</label>
                    </div>
                    <button className="trash" onClick={() => ({ id: lead.id })}>
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </article>
            )
        })
    } else if (isError) {
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






