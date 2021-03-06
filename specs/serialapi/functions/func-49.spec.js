/* eslint-disable no-unused-expressions */
const { metaSpecs, standardDecodeCallbackSpecs } = require('../../tools/test-frame-codec')
const sut = require('../../../lib/serialapi/functions/func-49')
metaSpecs(sut, 'applicationControllerUpdate', 0x49)

standardDecodeCallbackSpecs(sut, {
  success: {
    1: {
      data: '84030f0410012532272c2b7085567286ef82',
      expected: {
        nodeId: 3,
        updateStatus: 'NODE_INFO_RECEIVED',
        nodeInfo: {
          basicClass: 4,
          genericClass: 16,
          specificClass: 1,
          commandClasses: [37, 50, 39, 44, 43, 112, 133, 86, 114, 134, 239, 130]
        }
      }
    },
    SLAVE: {
      data: '100100',
      expected: {
        updateStatus: 'SUC_ID',
        nodeId: 0x01,
        nodeInfo: undefined
      }

    }
  }

})
