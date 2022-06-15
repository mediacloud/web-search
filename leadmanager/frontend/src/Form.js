import React, { Componenet, Fragment } from "react";

import CSRFToken from "./csrftoken";

class Form extends Componenet {
    render() {
        return (
            <form action="/endpoint" method="post">
                <CSRFToken />
                <button type="submit">Send</button>
            </form>
        );
    }
}

export default Form