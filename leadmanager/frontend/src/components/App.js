import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';


import {
    BrowserRouter,
    Routes,
    Route
} from 'react-router-dom';

import { Outlet, Link } from 'react-router-dom';

import Expenses from '../routes/expenses';
import Invoices from '../routes/invoices';
import Invoice from '../routes/Invoice';
import { ApiProvider } from '@reduxjs/toolkit/query/react';
import { apiSlice } from '../features/api/apiSlice';



class App extends Component {
    render() {
        return (
            <div>
                <h1>Bookkeeper</h1>
                <nav style={{
                    borderBottom: "solid 1px",
                    paddingBottom: "1rem",
                }}>
                    <Link to="/invoices">Invoices</Link>|{" "}
                    <Link to="/expenses">Expenses</Link>
                </nav>
                <Outlet />
            </div>
        );



    }
}

createRoot(document.getElementById('app')).
    render(
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<App />}>
                    <Route path='expenses' element={<Expenses />} />
                    <Route path="invoices" element={<Invoices />}>
                        <Route
                            index
                            element={
                                <main style={{ padding: "1rem" }}>
                                    <p>Select an invoice</p>
                                </main>
                            }
                        />
                        <Route path=":invoiceId" element={<Invoice />} />
                    </Route>
                    <Route
                        path="*"
                        element={
                            <main style={{ padding: "1rem" }}>
                                <p>There's nothing here!</p>
                            </main>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter >
    );



