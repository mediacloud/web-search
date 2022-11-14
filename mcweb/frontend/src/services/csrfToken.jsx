import React from 'react';

export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i += 1) {
      const cookie = cookies[i].trim();
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === (`${name}=`)) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export function CsrfToken() {
  return (
    <input type="hidden" name="csrfmiddlewaretoken" value={getCookie('csrftoken')} />
  );
}

export function saveCsrfToken() {
  // centralize the logic for saving the CSRF Token so we can change it later in one easy place
  window.CSRF_TOKEN = getCookie('csrftoken');
}
