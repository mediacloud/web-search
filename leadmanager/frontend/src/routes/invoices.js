import React from "react";

import { NavLink, Outlet } from "react-router-dom";
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
                    <NavLink
                        style={({ isActive }) => {
                            return {
                                display: "block",
                                margin: "1rem 0",
                                color: isActive ? "red" : "",
                            };
                        }}
                        to={`/invoices/${invoice.number}`}
                        key={invoice.number}
                    >
                        {invoice.name}
                    </NavLink>
                )))}
            </nav>
            <Outlet />
        </div>
    );
}