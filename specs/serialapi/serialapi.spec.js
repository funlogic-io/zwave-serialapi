/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const mockTime = require('../tools/mock-time')
const createMockSerialApiEnv = require('../tools/mock-serialapi-env')
const sinon = require('sinon')
const { isObservable } = require('rxjs')
const { count } = require('rxjs/operators')

describe('serialapispec', () => {
  let clock
  before(() => {
    clock = mockTime()
  })

  after(() => {
    clock.restore()
    clock = undefined
  })

  describe('closed instance', () => {
    let env
    let port
    let sut

    beforeEach(function () {
      env = createMockSerialApiEnv()
      port = env.port
      sut = env.serialApi
    })

    afterEach(function () {
      port.close()
      env = null
      port = null
      sut = null
    })

    describe('hmacIsOpen()', () => {
      it('should be an observable', () => {
        expect(isObservable(sut.hmacIsOpen)).to.be.true
      })
      it('should return false', () => {
        expect(sut.hmacIsOpen.value).to.be.false
      })
      it('hmacOpen() should open it and hmacClose() should close it', () => {
        return sut.hmacOpen().then(() => {
          expect(sut.hmacIsOpen.value).to.be.true
          // Serial Api should send a NAK on init
          port.expectToReceive([0x15], 'Controller reset: Initial NAK')
        }).then(() => sut.hmacClose()).then(() => {
          expect(sut.hmacIsOpen.value).to.be.false
          // Close does not send anything
          port.expectNoMoreReceivedData()
        })
      })
    })

    it('should accept the call and postpone until open', () => {
      sut.unicast2({})
      sut.unicast3({})
      return port.wait(10).then(() => {
        port.expectToReceive([0x15])
        return port.wait(10)
      }).then(() => {
        port.expectRequest(2)
        port.emitData([0x06])
        return port.wait(10)
      }).then(() => {
        port.expectRequest(3)
        port.emitData([0x06])
        port.expectNoMoreReceivedData()
      })
    })
  })

  describe('opened instance', () => {
    let env
    let port
    let sut

    beforeEach(() => {
      env = createMockSerialApiEnv()
      port = env.port
      sut = env.serialApi
      return sut.hmacOpen().then(() => {
        port.flushRecvData()
      })
    })
    afterEach(() => {
      port.close()
      env = null
      port = null
      sut = null
    })

    describe('send()', () => {
      it('should complete after receiving ack', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        sut.unicast2().then(onComplete, onError)

        return port.wait(10).then(() => {
          port.expectRequest(2)
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false
          port.emitData([0x06])
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.true
        })
      })

      it('should fail after timing out', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        sut.unicast2().then(onComplete, onError)

        return port.wait(10).then(() => {
          port.expectRequest(2)
          expect(onComplete.calledOnce).to.be.false
          expect(onError.called).to.be.false
          return port.wait(20000)
        }).then(() => {
          expect(onComplete.calledOnce).to.be.false
          expect(onError.calledOnce).to.be.true
        })
      })
    })

    describe('send() with response', () => {
      it('should complete after receiving response', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        sut.bidi11().then(onComplete, onError)

        return port.wait(10).then(() => {
          port.expectRequest(11)
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false
          port.emitData([0x06])
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false
          port.emitResponse(11)
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.calledOnce).to.be.true
          expect(onComplete.args[0][0]).to.deep.equal({ response: 'bidi11' })
        })
      })

      it('should complete multiple send in a row', () => {
        const onComplete1 = sinon.mock()
        const onError1 = sinon.mock()
        sut.bidi11().then(onComplete1, onError1)

        const onComplete2 = sinon.mock()
        const onError2 = sinon.mock()
        sut.bidi12().then(onComplete2, onError2)

        return port.wait(10).then(() => {
          port.expectRequest(11)
          port.expectNoMoreReceivedData()
          expect(onError1.called).to.be.false
          expect(onComplete1.called).to.be.false

          port.emitAck()
          port.emitResponse(11)

          return port.wait(10)
        }).then(() => {
          port.expectAck()
          port.expectRequest(12)

          expect(onError1.called).to.be.false
          expect(onComplete1.calledOnce).to.be.true
          expect(onComplete1.args[0][0].response).to.deep.equal('bidi11')

          port.emitAck()
          port.emitResponse(12)
          return port.wait(10)
        }).then(() => {
          port.expectToReceive([0x06])
          expect(onError2.called).to.be.false
          expect(onComplete2.calledOnce).to.be.true
          expect(onComplete2.args[0][0].response).to.deep.equal('bidi12')
        })
      })

      it('should complete after receiving response with the ack', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        sut.bidi12().then(onComplete, onError)

        return port.wait(10).then(() => {
          port.expectRequest(12)
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false

          port.emitAck()
          port.emitResponse(12)
          return port.wait(10)
        }).then(() => {
          port.expectAck()
          expect(onError.called).to.be.false
          expect(onComplete.calledOnce).to.be.true
          expect(onComplete.args[0][0].response).to.deep.equal('bidi12')
        })
      })

      it('should fail if response arrive after the response timeout', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        sut.bidi12({}).then(onComplete, onError)

        return port.wait(10).then(() => {
          port.expectRequest(12)

          expect(onError.called).to.be.false
          expect(onComplete.calledOnce).to.be.false

          port.emitAck()
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false

          return port.wait(20000).then(() => {
            port.emitResponse(12)
            return port.wait(10)
          })
        }).then(() => {
          expect(onError.called).to.be.true
          expect(onComplete.calledOnce).to.be.false
        })
      })
    })

    describe('send() with response and callbackId', () => {
      it('should complete after receiving response and provide a callbacks observable', () => {
        const onComplete = sinon.mock()
        const onError = sinon.mock()
        const params = Symbol('request')
        const fun = env.definitions.bidiWithCallback22
        sut.bidiWithCallback22(params).then(onComplete, onError)

        // Validate that the encode request is called with a callbackId
        expect(fun.encodeRequest.calledOnce).to.be.true
        expect(fun.encodeRequest.args[0][0]).to.deep.equal(params)
        expect(fun.encodeRequest.args[0][1].callbackId).to.be.a('number')
        const callbackId = fun.encodeRequest.args[0][1].callbackId
        expect(callbackId !== 0).to.be.true

        let response
        return port.wait(10).then(() => {
          port.expectRequest(22)

          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false

          port.emitAck()
          return port.wait(10)
        }).then(() => {
          expect(onError.called).to.be.false
          expect(onComplete.called).to.be.false

          port.emitResponse(22)
          return port.wait(10)
        }).then(() => {
          port.expectAck()

          expect(fun.decodeResponse.called).to.be.true
          expect(fun.decodeResponse.args[0][0]).to.be.deep.equal({ type: 1, funcId: 22, params: Buffer.alloc(0) })
          expect(onError.called).to.be.false
          expect(onComplete.calledOnce).to.be.true

          response = onComplete.args[0][0]
          expect(response).to.deep.equal({ response: 'bidiWithCallback22' })
          expect(response.callbacks).to.be.a('object')
          expect(response.callbacks.subscribe).to.be.a('function')

          port.emitRequest(22, [callbackId, false])

          return port.wait(10)
        }).then(() => {
          port.expectAck()
          return Promise.all([
            response.callbacks.toPromise(),
            response.callbacks.pipe(count()).toPromise()
          ])
        }).then(callbackInfo => {
          expect(callbackInfo[0]).to.deep.equal({ callback: 'bidiWithCallback22' })
          expect(callbackInfo[1]).to.equal(1)
        })
      })
    })

    describe('inboundRequests', () => {
      it('should emit requests with decoded callback', () => {
        const subCallback1 = sinon.mock()
        const subCallback2 = sinon.mock()
        const sub1 = sut.inboundRequests.subscribe(subCallback1)
        const sub2 = sut.callbackOnly41.subscribe(subCallback2)

        function assertSubscriptionCallback (cb) {
          expect(cb.calledOnce).to.be.true
          const request = cb.args[0][0]
          expect(request).to.be.deep.equal({ callback: 'callbackOnly41' })
          expect(request.meta).to.be.deep.equal({ funcId: 41, data: [] })
        }

        return port.emitRequest(41).then(() => {
          assertSubscriptionCallback(subCallback1)
          assertSubscriptionCallback(subCallback2)
        }).finally(() => {
          sub1.unsubscribe()
          sub2.unsubscribe()
        })
      })
    })

    describe('frames', () => {
      it('should emit raw request', () => {
        const onFrame = sinon.mock()
        const sub = sut.frames.subscribe(onFrame)

        return port.emitData('0115004984230f0410012532272c2b7085567286ef8213').then(() => {
          expect(onFrame.calledOnce).to.be.true
          expect(onFrame.args[0][0]).to.be.deep.equal({
            funcId: 73,
            params: Buffer.from([132, 35, 15, 4, 16, 1, 37, 50, 39, 44, 43, 112, 133, 86, 114, 134, 239, 130]),
            type: 0
          })
        }).finally(() => {
          sub.unsubscribe()
        })
      })
    })

    describe('dispose()', () => {
      it('should dispose the serialapi', () => {
        expect(sut.hmacIsOpen.value).to.be.true
        expect(port.api.close.calledOnce).to.be.false
        return sut.dispose().then(() => {
          expect(sut.hmacIsOpen.value).to.be.false
          expect(port.api.close.calledOnce).to.be.true
        })
      })
    })
  })
})
