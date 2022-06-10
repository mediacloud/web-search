import React from "react";

import { Link } from "react-router-dom";
import { getInvoices } from "../data";

export default function Invoices() {
    let invoices = getInvoices(); 

    for (const element of invoices) {
        console.log(element)
    }


    
    const mainStyle = {
        padding: "1rem 0"
    }

    return (
        
        <main style={mainStyle}>
            <h2>Invoices</h2>
        </main>
    );
}