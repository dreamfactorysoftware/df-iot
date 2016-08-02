'use strict'

module.exports = {
  devices: {
    path: '/api/v2/devices/_table/devices',
    qs: (c) => {
      return {
        filter: `(DeviceID='${c.deviceId}') AND (Token='${c.password}')`
      }
    }
  },
  telemetry: {
    path: '/api/v2/telemetry/_table/telemetry'
  }
}
