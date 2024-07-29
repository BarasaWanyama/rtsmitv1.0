import React from 'react';

const AlertsNotifications = ({ alerts, removeAlert }) => {
  return (
    <div className="alerts-container">
      {alerts.map(alert => (
        <div key={alert.id} className={`alert alert-${alert.type}`}>
          {alert.message}
          <button onClick={() => removeAlert(alert.id)}>×</button>
        </div>
      ))}
    </div>
  );
};

export default AlertsNotifications;