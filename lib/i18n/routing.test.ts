import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { localizedPath, parsePathname, switchLocalePath } from './routing.ts'

describe('parsePathname', () => {
    it('defaults to mk without prefix', () => {
        assert.deepEqual(parsePathname('/markets'), { locale: 'mk', pathname: '/markets' })
    })

    it('parses english prefix', () => {
        assert.deepEqual(parsePathname('/en/stock/KMB'), { locale: 'en', pathname: '/stock/KMB' })
    })
})

describe('localizedPath', () => {
    it('omits prefix for mk', () => {
        assert.equal(localizedPath('/dividends', 'mk'), '/dividends')
    })

    it('adds en prefix', () => {
        assert.equal(localizedPath('/dividends', 'en'), '/en/dividends')
    })
})

describe('switchLocalePath', () => {
    it('switches mk to en', () => {
        assert.equal(switchLocalePath('/stock/KMB', 'en'), '/en/stock/KMB')
    })

    it('switches en to mk', () => {
        assert.equal(switchLocalePath('/en/markets', 'mk'), '/markets')
    })
})
