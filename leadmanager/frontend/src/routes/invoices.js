import * as React from 'react';

import {
    useLocation,
    NavLink,
    Outlet,
    useSearchParams,
} from 'react-router-dom';

import { getInvoices } from '../data';

function QueryNavLink({ to, ...props }) {
    let location = useLocation();
    return <NavLink to={to + location.search} {...props} />;
}

export default function Invoices() {
    let invoices = getInvoices();
    let [searchParams, setSearchParams] = useSearchParams({ replace: true });

    return (
        <div style={{ display: 'flex' }}>
            <nav style={{ borderRight: 'solid 1px', padding: '1rem' }}>
                <input
                    value={searchParams.get('filter') || ''}
                    onChange={(event) => {
                        let filter = event.target.value;
                        if (filter) {
                            setSearchParams({ filter }, { replace: true });
                        } else {
                            setSearchParams({}, { replace: true });
                        }
                    }}
                />
                {invoices
                    .filter((invoice) => {
                        let filter = searchParams.get('filter');
                        if (!filter) return true;
                        let name = invoice.name.toLowerCase();
                        return name.startsWith(filter.toLowerCase());
                    })
                    .map((invoice) => (
                        <QueryNavLink
                            key={invoice.number}
                            style={({ isActive }) => {
                                return {
                                    display: 'block',
                                    margin: '1rem 0',
                                    color: isActive ? 'red' : '',
                                };
                            }}
                            to={`/invoices/${invoice.number}`}
                        >
                            {invoice.name}
                        </QueryNavLink>
                    ))}
            </nav>
            <Outlet />
        </div>
    );
}
