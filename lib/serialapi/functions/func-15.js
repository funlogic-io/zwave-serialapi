const consts = require('../consts')
const { libraryTypeFormat } = require('./formats')
const funcUtils = require('./func-utils')

const name = 'getVersion'
const funcId = consts.FUNC_ID_ZW_GET_VERSION

function decodeResponseData (reader, response) {
  response.version = reader.readAsciiString(12)
  response.libraryType = reader.readByte(b => libraryTypeFormat.format(b))
}

module.exports = {
  name,
  funcId,
  encodeRequest: funcUtils.buildNoParameterRequestEncoder(funcId),
  decodeResponse: funcUtils.buildResponseDecoder(funcId, decodeResponseData)
}
