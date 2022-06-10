import React from "react";

import { Link } from "react-router-dom";
import { getInvoices } from "../data";

export default function Invoices() {
    let invoices = getInvoices();


    const divStyle = {
        display: "flex",
    };

    const navStyle = {
        borderRight: "solid 1px",
        padding: "1rem"
    }

    const linkStyle = {
        display: "block",
        margin: "1rem 0",
    }

    return (
        <div style={divStyle}>
            <nav style={navStyle}>
                {invoices.map((invoice => (
                    <Link
                        style={linkStyle}
                        to={`/invoices/${invoice.number}`}
                        key={invoice.number}>
                        {invoice.name}
                    </Link>
                )))}
            </nav>
        </div>
    );
}