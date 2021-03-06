/* eslint-disableno-unused-expressions */
const sut = require('../../../lib/serialapi/functions/func-14')
const { metaSpecs, standardEncodeRequestSpecs, standardDecodeResponseSpecs, standardDecodeCallbackSpecs } = require('../../tools/test-frame-codec')
metaSpecs(sut, 'sendDataMulti', 0x14)

standardEncodeRequestSpecs(sut, {
  success: {
    'All defaults': {
      request: {
        nodeIds: [10, 11],
        command: [1, 2, 3]
      },
      callbackId: 0x01,
      expected: [2, 10, 11, 3, 1, 2, 3, 0x05, 0x01]
    },
    'With no transmit options': {
      request: {
        nodeIds: [12, 13, 14],
        command: [4, 5, 6, 7],
        transmitOptions: {}
      },
      callbackId: 0x02,
      expected: [3, 12, 13, 14, 4, 4, 5, 6, 7, 0x00, 0x02]
    },
    'With acknoledge': {
      request: {
        nodeIds: [1],
        command: [1, 2, 3],
        transmitOptions: {
          acknoledge: true
        }
      },
      callbackId: 0x03,
      expected: [1, 1, 3, 1, 2, 3, 0x01, 0x03]
    },
    'With lowEnergy': {
      request: {
        nodeIds: [1],
        command: [1, 2, 3],
        transmitOptions: {
          lowPower: true
        }
      },
      callbackId: 0x04,
      expected: [1, 1, 3, 1, 2, 3, 0x02, 0x04]
    },
    'With route': {
      request: {
        nodeIds: [1],
        command: [1, 2, 3],
        transmitOptions: {
          autoRoute: true
        }
      },
      callbackId: 0x05,
      expected: [1, 1, 3, 1, 2, 3, 0x04, 0x05]
    },
    'With noRoute': {
      request: {
        nodeIds: [1],
        command: [1, 2, 3],
        transmitOptions: {
          noRoute: true
        }
      },
      callbackId: 0x06,
      expected: [1, 1, 3, 1, 2, 3, 0x10, 0x06]
    },
    'With explore': {
      request: {
        nodeIds: [1],
        command: [1, 2, 3],
        transmitOptions: {
          explore: true
        }
      },
      callbackId: 0x07,
      expected: [1, 1, 3, 1, 2, 3, 0x20, 0x07]
    }

  }
})

standardDecodeResponseSpecs(sut, {
  success: {
    1: {
      data: '01',
      expected: {
        success: true
      },
      hasCallback: true
    },
    2: {
      data: '00',
      expected: {
        success: false
      },
      hasCallback: false
    }
  }
})

standardDecodeCallbackSpecs(sut, {
  success: {
    1: {
      data: '01000002',
      callbackId: 0x01,
      expected: {
        txStatus: 'OK'
      }
    }
  }
})
