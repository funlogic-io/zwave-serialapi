/* eslint-disableno-unused-expressions */
const { standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-02')

standardDecodeResponseSpecs(sut, {
  success: {
    1: {
      data: '05001d03000000000000000000000000000000000000000000000000000000000500',
      expected: { apiVersion: 5, apiType: 'controllerApi', timerSupported: false, controllerType: 'primary', sis: false, nodes: [{ nodeId: 1 }, { nodeId: 2 }], chipType: 5, chipVersion: 0 }
    }
  }
})