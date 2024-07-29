
import React from 'react';

function Login({ onGoogleLogin }) {
  console.log('Rendering Login component');
  return (
    <div className="login-container">
      <h2>Login</h2>
      <button onClick={() => {
        console.log('Google login button clicked');
        onGoogleLogin();
      }}>
        Login with Google
      </button>
    </div>
  );
}

export default Login;