import React from 'react';
import Nav from '../../components/Nav';

export default function Error( user, isAuthenticated, authChecked) {
  return (
    <div>
      <Nav user={user} isAuthenticated={isAuthenticated} authChecked={authChecked}></Nav>
      <h1>Sorry! You must be an admin to view this page</h1>
      <p>Please contact info@120eaststate.com for help</p>
    </div>
  )
}