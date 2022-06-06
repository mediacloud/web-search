import {
    useGetLeadsQuery,
    useDeleteLeadMutation,
    useUpdateLeadMutation,
    useAddLeadMutation
} from "../api/apiSlice";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faUpload } from '@fortawesome/free-solid-svg-icons'
import { useState } from "react"

const LeadList = () => {
    const [newLead, setNewLead] = useState('')


    // this custom hook is being created for us 
    const {
        data: leads,
        isLoading,
        isSuccess,
        isError,
        error
    } = useGetLeadsQuery()

    //const [addLead] = useAddLeadMutation();
    const [updateLead] = useUpdateLeadMutation();
    //const [deleteLead] = useDeleteLeadMutation();



    // define conditional content 
    let content;

    if (isLoading) {
        content = <p>Loading...</p>
    } else if (isSuccess) {
        content = leads.map(lead => { //JSON.stringify(leads)
            // returning an article which will have an article and each artciel is going to have a key
            // that matches the lead.id 
            // lots of artciles will be run 
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
            {content}
        </main>
    )
}
export default Profiles






