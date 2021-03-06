/* eslint-disableno-unused-expressions */
const { metaSpecs, standardDecodeResponseSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-20')
metaSpecs(sut, 'memoryGetId', 0x20)

standardDecodeResponseSpecs(sut, {
  success: {
    1: {
      data: 'c45311a301',
      expected: {
        homeId: 0xc45311a3 & 0xffffffff,
        nodeId: 0x01
      }
    }
  }
})
