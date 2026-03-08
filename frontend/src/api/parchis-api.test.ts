import { describe, expect, it } from 'vitest'
import { buildRollTwoDiceAndDrawQuestionCalls } from './parchis-api'

describe('buildRollTwoDiceAndDrawQuestionCalls', () => {
  it('uses a single VRF request before the roll call', () => {
    const calls = buildRollTwoDiceAndDrawQuestionCalls({
      accountAddress: '0x123',
      gameId: 7,
      turnSystemAddress: '0x456',
      vrfProviderAddress: '0x789',
    })

    expect(calls).toHaveLength(2)
    expect(calls[0]).toMatchObject({
      contractAddress: '0x789',
      entrypoint: 'request_random',
    })
    expect(calls[0].calldata.map((value) => BigInt(value))).toEqual([0x456n, 0n, 0x123n])
    expect(calls[1]).toMatchObject({
      contractAddress: '0x456',
      entrypoint: 'roll_two_dice_and_draw_question',
    })
  })
})
